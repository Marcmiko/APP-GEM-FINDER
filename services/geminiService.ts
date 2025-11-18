
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
    
    // STRICT MODE: Ensure address starts with 0x
    let address = String(data.address || '');
    if (!address.startsWith('0x')) {
        address = 'Address not found';
    }

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
        socialSentiment: {
            positive: data.socialSentiment?.positive ? robustParseFloat(data.socialSentiment.positive) : 50,
            negative: data.socialSentiment?.negative ? robustParseFloat(data.socialSentiment.negative) : 25,
            neutral: data.socialSentiment?.neutral ? robustParseFloat(data.socialSentiment.neutral) : 25,
            summary: data.socialSentiment?.summary ? String(data.socialSentiment.summary) : "Neutral social activity.",
        },
        websiteUrl: data.websiteUrl ? String(data.websiteUrl) : null,
        xUrl: data.xUrl ? String(data.xUrl) : null,
        coinMarketCapUrl: data.coinMarketCapUrl ? String(data.coinMarketCapUrl) : null,
        coingeckoUrl: data.coingeckoUrl ? String(data.coingeckoUrl) : null,
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
        jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
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

// --- CACHING UTILS ---
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getFromCache = (key: string): { tokens: Token[]; sources: GroundingChunk[] } | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
            return data;
        }
        return null;
    } catch (e) {
        return null;
    }
};

const saveToCache = (key: string, data: { tokens: Token[]; sources: GroundingChunk[] }) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify({
            timestamp: Date.now(),
            data
        }));
    } catch (e) {
        // ignore storage errors
    }
};

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
            throw error;
        }
    }
};


export const findGems = async (startDate?: string, endDate?: string, forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = `gem_finder_${startDate || 'all'}_${endDate || 'all'}`;
  
  if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
  }

  try {
    const ai = getAiClient();
    
    let dateFilterInstruction = "trending in the **last 24-72 hours**";
    if (startDate) dateFilterInstruction = `launched after ${startDate}`;

    const prompt = `
    You are a specialized Crypto Hunter for Base chain.
    
    **STRICT REALITY CHECK:**
    1. You MUST verify that every token you list ACTUALLY EXISTS on the Base blockchain.
    2. You MUST find a REAL contract address starting with '0x'. 
    3. **DO NOT HALLUCINATE.** If you cannot find specific new gems, fallback to known trending tokens on Base (like AERO, BRETT, DEGEN, TOSHI) but DO NOT invent fake names.
    
    **TASK:** Find active, trending tokens on Base.
    
    **SEARCH STRATEGY:**
    1. Query: "Base chain top gainers today", "DexScreener Base trending", "CoinGecko Base new coins", "Alchemy Base DEX list".
    2. Find official links: Website, Twitter (X), CoinMarketCap, CoinGecko.
    3. Get Technicals: RSI, MACD (Estimate from chart trends if needed).
    4. Get Sentiment: Search X (Twitter) for community sentiment.

    **SCORING:**
    - Calculate **GemScore** (0-100) based on: 40% Volume/Liquidity, 40% Social Hype (X/Twitter), 20% Security.
    - If the token has high volume but low social presence, score lower.

    **JSON OUTPUT:**
    Return a JSON Array of token objects.
    Include fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, analysis (summary, strengths, risks, verdict), technicalIndicators (rsi, macd, movingAverages), socialSentiment (positive, negative, neutral, summary), websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findGems error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are currently overloaded. Please wait 30 seconds and try again.");
    }
    throw error;
  }
};

export const findNewProjects = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'new_projects';
  
  if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
  }

  try {
    const ai = getAiClient();
    const prompt = `
    You are a "New Listing" scanner for Base.
    
    **STRICT REALITY CHECK:**
    1. **REAL TOKENS ONLY.** Verify existence on DexScreener Base or CoinGecko Base.
    2. **NO FAKE ADDRESSES.** You must find the 0x contract address.
    3. If you can't find brand new tokens, return the **Top Trending** tokens on Base instead. Better to show popular real tokens than fake new ones.
    
    **SEARCH STRATEGY:**
    1. Search "New Base chain tokens DexScreener", "Base trending coins Coingecko", "Alchemy Base DEX list".
    2. **Traction Check:** Do they have an active Twitter (X)? If not, flag as High Risk.
    
    **JSON OUTPUT:**
    Return a JSON Array of token objects.
    Include fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findNewProjects error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
    throw error;
  }
};

export const getAnalystPicks = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'analyst_picks';
  
  if (!forceRefresh) {
      const cached = getFromCache(cacheKey);
      if (cached) return cached;
  }

  try {
    const ai = getAiClient();
    const prompt = `
    You are a Degen Analyst.
    
    **STRICT REALITY CHECK:**
    1. **REAL TOKENS ONLY.** Do not invent projects.
    2. **VALIDATE:** Check if key KOLs (Key Opinion Leaders) are talking about them on X.
    
    **TASK:** Provide 3 "High Conviction" plays on Base.
    
    **STRATEGY:**
    - Look for "Narratives" (AI, Memes, RWA).
    - **Conviction Score:** Based on Narrative Strength + KOL Validation.
    - **Verdict:** "Buy the dip", "Breakout Watch", "Accumulate".
    
    **JSON OUTPUT:**
    Return a JSON Array of token objects.
    Include fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, convictionScore, analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("getAnalystPicks error:", error);
    if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
    throw error;
  }
};

export const findSocialTrends = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
    const cacheKey = 'social_trends';
  
    if (!forceRefresh) {
        const cached = getFromCache(cacheKey);
        if (cached) return cached;
    }

    try {
      const ai = getAiClient();
      const prompt = `
      You are a Social Media Trend Scanner.
      
      **STRICT REALITY CHECK:**
      1. **REAL DATA ONLY.** Ensure the token exists on Base.
      2. **NO FAKES.** If you can't verify the contract, do not list it.
      
      **TASK:** Return 5 tokens that are POPULAR on Base right now based on X/Twitter.
      
      **SEARCH STRATEGY:**
      1. Search "Trending Base meme coins Twitter", "Base chain viral tokens".
      2. **FALLBACK:** If you can't find specific tweets, assume that **Top Trending on DexScreener Base** IS the social trend (because volume = attention).
      3. **Sentiment:** Analyze the "Vibe". Is it Euphoric? Fearful? Scammy?
      
      **JSON OUTPUT:**
      Return a JSON Array of Token objects.
      Include fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, analysis, technicalIndicators, socialSentiment (positive/negative/neutral), websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
      `;
  
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
  
      const result = parseAIResponse(response);
      if (result.tokens.length > 0) saveToCache(cacheKey, result);
      return result;
  
    } catch (error: any) {
      console.error("findSocialTrends error:", error);
      if (error?.message?.includes('503') || error?.status === 503) {
        throw new Error("AI servers are busy. Please try again shortly.");
    }
      throw error;
    }
  };
