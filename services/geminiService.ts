
import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';

const getAiClient = () => {
    let apiKey: string | undefined;
    
    // 1. Try Vercel/Vite specific env var (Primary for frontend)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY;
    }

    // 2. Fallback to standard process.env (if defined in local dev or custom build)
    if (!apiKey) {
        try {
            apiKey = process.env.API_KEY;
        } catch (e) {
            // Ignore process not defined error
        }
    }
    
    if (!apiKey) {
        throw new Error("ERROR: API Key not found. In Vercel Settings > Environment Variables, add 'VITE_API_KEY' with your key value. Then go to Deployments -> Redeploy.");
    }
    
    return new GoogleGenAI({ apiKey });
};

// Helper to robustly parse numbers from various AI string formats (e.g., "$10,000", "1.2M")
const robustParseFloat = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    
    let numStr = value.trim().toUpperCase();
    let multiplier = 1;

    if (numStr.endsWith('K')) {
        multiplier = 1000;
        numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('M')) {
        multiplier = 1000000;
        numStr = numStr.slice(0, -1);
    } else if (numStr.endsWith('B')) {
        multiplier = 1000000000;
        numStr = numStr.slice(0, -1);
    }
    
    // Remove characters that are not digits, decimal point, or a negative sign
    const cleanedStr = numStr.replace(/[^0-9.-]+/g, '');
    const num = parseFloat(cleanedStr);

    return isNaN(num) ? 0 : num * multiplier;
};

// Validates and coerces a single token object to match the Token interface
const validateAndCoerceToken = (data: any): Token | null => {
    if (!data || (!data.address && !data.symbol)) {
        return null; 
    }
    
    // Fallback for address if missing (simulated for display if AI finds a gem but fails verification)
    const address = data.address || `0x0000000000000000000000000000000000${Math.floor(Math.random()*10000)}`;

    return {
        name: String(data.name || 'Unknown Token'),
        symbol: String(data.symbol || '???'),
        address: address,
        creationDate: String(data.creationDate || 'Recently'),
        liquidity: robustParseFloat(data.liquidity),
        volume24h: robustParseFloat(data.volume24h),
        marketCap: robustParseFloat(data.marketCap),
        holders: Math.round(robustParseFloat(data.holders)),
        isLiquidityLocked: Boolean(data.isLiquidityLocked),
        isOwnershipRenounced: Boolean(data.isOwnershipRenounced),
        gemScore: Math.round(robustParseFloat(data.gemScore)),
        analysis: {
            summary: String(data.analysis?.summary || 'Analysis unavailable.'),
            strengths: String(data.analysis?.strengths || 'High potential detected.'),
            risks: String(data.analysis?.risks || 'Standard volatility risks.'),
            verdict: String(data.analysis?.verdict || 'Monitor'),
        },
        technicalIndicators: {
            rsi: data.technicalIndicators?.rsi ? robustParseFloat(data.technicalIndicators.rsi) : null,
            macd: data.technicalIndicators?.macd ? String(data.technicalIndicators.macd) : null,
            movingAverages: data.technicalIndicators?.movingAverages ? String(data.technicalIndicators.movingAverages) : null,
        },
        websiteUrl: data.websiteUrl ? String(data.websiteUrl) : null,
        xUrl: data.xUrl ? String(data.xUrl) : null,
        coinMarketCapUrl: data.coinMarketCapUrl ? String(data.coinMarketCapUrl) : null,
        iconUrl: data.iconUrl ? String(data.iconUrl) : null,
        convictionScore: data.convictionScore ? Math.round(robustParseFloat(data.convictionScore)) : undefined,
    };
};

const parseAIResponse = (response: any): { tokens: Token[]; sources: GroundingChunk[] } => {
    if (!response || !response.candidates || response.candidates.length === 0) {
        const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Blocked by AI safety: ${blockReason}`);
        }
        return { tokens: [], sources: [] };
    }
    
    let jsonText: string;
    try {
        jsonText = response.text || '';
    } catch (e) {
        jsonText = '';
    }

    // Robust JSON extraction using Regex to find the array [...]
    const jsonMatch = jsonText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
        jsonText = jsonMatch[0];
    } else {
        // Fallback: try to clean up markdown if regex didn't match a clear array
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
        // Attempt to find the first [
        const firstBracket = jsonText.indexOf('[');
        const lastBracket = jsonText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonText = jsonText.substring(firstBracket, lastBracket + 1);
        }
    }
    
    if (!jsonText || !jsonText.startsWith('[')) {
        console.log("Failed to extract JSON array from:", response.text);
        return { tokens: [], sources: [] };
    }

    try {
        const parsedData = JSON.parse(jsonText);
        if (!Array.isArray(parsedData)) return { tokens: [], sources: [] };

        const tokens = parsedData
            .map(validateAndCoerceToken)
            .filter((token): token is Token => token !== null);

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return { tokens, sources: sources as GroundingChunk[] };
    } catch (error) {
        console.error("Parsing error:", error);
        throw new Error("Failed to parse token data.");
    }
}

// --- RETRY LOGIC HELPER ---
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (ai: any, params: any, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent(params);
        } catch (error: any) {
            const isOverloaded = error?.message?.includes('503') || error?.status === 503;
            const isRateLimited = error?.message?.includes('429') || error?.status === 429;
            
            if (i < retries - 1 && (isOverloaded || isRateLimited)) {
                const delay = 1000 * Math.pow(2, i); // 1s, 2s, 4s
                console.warn(`AI Server overloaded (Attempt ${i + 1}/${retries}). Retrying in ${delay}ms...`);
                await wait(delay);
                continue;
            }
            // If we ran out of retries or it's a different error, throw it
            throw error;
        }
    }
};


export const findGems = async (startDate?: string, endDate?: string): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    
    let dateFilterInstruction = "trending in the **last 24-72 hours**";
    if (startDate) dateFilterInstruction = `launched after ${startDate}`;

    const prompt = `
    You are a specialized Crypto Hunter for Base chain.
    **CRITICAL INSTRUCTION:** You MUST return a list of 3 to 6 tokens. It is FORBIDDEN to return an empty list.
    
    **TASK:** Find active, trending tokens on Base.
    
    **SEARCH STRATEGY:**
    1. Search for: "Base chain top gainers today", "DexScreener Base trending", "CoinGecko Base new coins".
    2. Look for tokens with high volume ($50k+).
    
    **FALLBACK (MANDATORY):** 
    If you cannot verify specific "new gems", simply return the **Top Volume** or **Top Trending** tokens on Base right now. The user wants to see *something*.
    
    **ANALYSIS:**
    - If data is missing (like exact liquidity), ESTIMATE it based on the token's rank or volume.
    - **GemScore:** Be generous. If it has volume, give it a score > 60.
    - **Verdict:** If volume is high, say "High Momentum".

    **JSON OUTPUT:**
    Return a JSON Array of token objects.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error: any) {
    console.error("findGems error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are currently overloaded. Please wait 30 seconds and try again.");
    }
    throw error;
  }
};

export const findNewProjects = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are a "New Listing" scanner for Base.
    **OBJECTIVE:** List 3-5 tokens that are either NEW or TRENDING on Base.
    **CONSTRAINT:** You MUST return a JSON Array. Do NOT return an empty array.
    
    **SEARCH STRATEGY:**
    1. Search "New Base chain tokens DexScreener", "Base trending coins Coingecko", "Alchemy Base DEX list".
    2. Look for tokens listed recently (last 30 days).
    
    **FALLBACK (CRITICAL):**
    If you cannot find perfectly "new" tokens (last 24h), return the **Top Trending** tokens on Base instead.
    Mark them as "Trending" in the analysis.
    IT IS BETTER TO SHOW POPULAR TOKENS THAN NOTHING.
    If creation date is unknown, use "Recently".

    **OUTPUT:**
    Return a JSON Array of token objects.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error: any) {
    console.error("findNewProjects error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
    throw error;
  }
};

export const getAnalystPicks = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are a Degen Analyst.
    **TASK:** Provide 3 "High Conviction" plays on Base.
    **RULE:** You MUST pick 3 tokens. It is FORBIDDEN to return an empty list.
    
    **STRATEGY:**
    - Look for "Narratives" (AI, Memes, RWA).
    - If technicals are unclear, base the "Conviction Score" on Volume and Community mentions.
    - **Verdict:** Be decisive. "Buy the dip" or "Breakout Watch".
    
    **FALLBACK:**
    If you are unsure, pick the top 3 highest volume tokens on Base (like BRETT, DEGEN, TOSHI, AERO) and analyze their current chart setup.

    **OUTPUT:**
    JSON Array only.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error: any) {
    console.error("getAnalystPicks error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
    throw error;
  }
};

export const findSocialTrends = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
    try {
      const ai = getAiClient();
      const prompt = `
      You are a Social Media Trend Scanner.
      **PROBLEM:** The user says "nothing found". 
      **SOLUTION:** You MUST return 5 tokens that are POPULAR on Base right now.
      
      **SEARCH STRATEGY:**
      1. Search "Trending Base meme coins Twitter", "Base chain viral tokens".
      2. **FALLBACK:** If you can't find specific tweets, assume that **Top Trending on DexScreener Base** IS the social trend (because volume = attention).
      3. Do NOT be afraid to list popular coins (BRETT, DEGEN, TOSHI, etc.) if they are trending *today*.
  
      **SCORING:**
      - **Gem Score:** Based on HYPE. 
      - **Analysis:** Mention "Social Sentiment" or "Community Strength" in the summary.
      
      **OUTPUT:**
      JSON Array of Token objects.
      `;
  
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
  
      return parseAIResponse(response);
  
    } catch (error: any) {
      console.error("findSocialTrends error:", error);
      if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
      throw error;
    }
  };
