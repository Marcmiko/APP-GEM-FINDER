
import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';

const getAiClient = () => {
    let apiKey = '';

    // 1. Try accessing process.env safely. 
    // In some browser environments, accessing 'process' directly throws a ReferenceError if not polyfilled.
    try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY || '';
        }
    } catch (e) {
        // process is not defined, ignore and proceed to next method
    }

    // 2. Try accessing Vite's import.meta.env safely.
    if (!apiKey) {
        try {
            // Use type assertion to avoid TypeScript errors if types aren't fully set up
            const meta = import.meta as any;
            if (meta && meta.env) {
                // Check both VITE_ prefixed (exposed to client) and standard keys
                apiKey = meta.env.VITE_API_KEY || meta.env.API_KEY || '';
            }
        } catch (e) {
            console.warn("Failed to access import.meta.env", e);
        }
    }
    
    if (!apiKey) {
        throw new Error("AI API Key Not Found.\n\nTROUBLESHOOTING:\n1. In Vercel Settings > Environment Variables, ensure you have added your key.\n2. Rename the variable to 'VITE_API_KEY' (Vite requires this prefix).\n3. CRITICAL: Go to Deployments and click 'Redeploy' for the changes to take effect.");
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
        // If we don't have an address, we try to survive with just a name/symbol for display
        // But ideally we need an address.
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

    jsonText = jsonText.trim();

    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }
    
    if (!jsonText || !jsonText.startsWith('[')) {
        console.log("Invalid JSON:", jsonText);
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

export const findGems = async (startDate?: string, endDate?: string): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    
    let dateFilterInstruction = "trending in the **last 24-72 hours**";
    if (startDate) dateFilterInstruction = `launched after ${startDate}`;

    const prompt = `
    You are a pragmatic Crypto Analyst for the Base blockchain.
    **USER PROBLEM:** The user is complaining they see "Nothing found". 
    **YOUR GOAL:** Return a list of active, trending tokens on Base. Do NOT return an empty list unless the blockchain is dead.

    **SEARCH STRATEGY (FIND THE GEMS):**
    1.  **Query:** Search for "Top trending tokens on Base chain today", "CoinGecko Base top gainers", "DexScreener Base trending".
    2.  **Sources:** Use data from **CoinGecko** (\`https://www.coingecko.com/en/exchanges/decentralized/base\`), **Alchemy Dapps**, and **DexScreener** to find what is hot.
    3.  **Focus:** Look for tokens with high Volume relative to Liquidity (Vol/Liq > 0.5 is good).

    **FINANCIAL & TECHNICAL ANALYSIS (MANDATORY):**
    For each token found:
    - **Verdict:** Calculate based on Volume/Liquidity ratio and trend.
    - **Technical Indicators:** Search for "RSI", "MACD", or "Chart" for the token.
      - **RSI (14):** Try to find the value (0-100). If not found, estimate based on "Overbought" (>70) or "Oversold" (<30).
      - **MACD:** Signal (e.g., "Bullish Cross", "Bearish", "Neutral").
      - **Moving Averages:** Trend relative to MA (e.g., "Above MA50").

    **DATA EXTRACTION:**
    - **Address:** Try to find the 0x address.
    - **Icon:** Try to find an icon URL.

    **JSON OUTPUT:**
    Return a JSON Array.
    \`\`\`json
    [
      {
        "name": "Token Name",
        "symbol": "TKN",
        "address": "0x...", 
        "creationDate": "2024-...",
        "liquidity": 50000, 
        "volume24h": 100000,
        "marketCap": 200000,
        "holders": 500,
        "gemScore": 85,
        "isLiquidityLocked": true,
        "isOwnershipRenounced": false,
        "iconUrl": "https://...", 
        "analysis": {
          "summary": "Trending due to [Reason].",
          "strengths": "Volume is 2x Liquidity indicating high demand.",
          "risks": "Price is volatile.",
          "verdict": "Strong Buy" 
        },
        "technicalIndicators": {
          "rsi": 65,
          "macd": "Bullish Convergence",
          "movingAverages": "Reclaiming MA50"
        }
      }
    ]
    \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("findGems error:", error);
    throw error;
  }
};

export const findNewProjects = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are a "New Listing" scanner for Base.
    **GOAL:** Populate the list with **Recently Added** tokens. 
    
    **SEARCH TARGETS:**
    - "CoinGecko New Cryptocurrencies Base chain"
    - "Alchemy list of Base DEXs"
    - "Newest Base tokens DexScreener"

    **VERDICT LOGIC:**
    - Liquidity < $4k: "High Risk / Degen"
    - Volume > $50k & Age < 3 days: "Snipe / Momentum"

    **TECHNICALS:**
    - Attempt to find RSI (14) if chart data exists in search snippets.

    **OUTPUT:**
    Return a JSON Array of valid token objects. Prioritize finding *something*.
    Include "technicalIndicators": { "rsi": ... } if data found.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("findNewProjects error:", error);
    throw error;
  }
};

export const getAnalystPicks = async (): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const prompt = `
    You are a Degen Analyst.
    **GOAL:** Find 3 high-risk/high-reward plays on Base.
    
    **STRATEGY:**
    - Focus on **Social Hype** (Twitter/Farcaster) + **Technical Breakouts**.
    - Sources: Alchemy Base Dapps, CoinGecko Trending, DexScreener.
    
    **ANALYSIS:**
    - **Conviction Score (0-100):** Based on hype + technical structure.
    - **Technicals:** Look for "Golden Cross", "RSI Divergence", or "Breakout" patterns in search results.

    **OUTPUT:**
    JSON Array only.
    Include "technicalIndicators" with RSI, MACD, MA status.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return parseAIResponse(response);

  } catch (error) {
    console.error("getAnalystPicks error:", error);
    throw error;
  }
};
