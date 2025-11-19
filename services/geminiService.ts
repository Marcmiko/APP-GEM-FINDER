
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
        throw new Error("API Key missing. Check Vercel Environment Variables (VITE_API_KEY).");
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
    
    // STRICT MODE: Ensure address starts with 0x and is length 42
    let address = String(data.address || '').trim();
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    if (!addressRegex.test(address)) {
        // Fail silently on invalid address to prevent hallucinations
        return null;
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
        return { tokens: [], sources: [] };
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
    
    const prompt = `
    You are a Crypto Data Extractor.
    
    **GOAL:** Find REAL, TRADEABLE tokens on Base blockchain.
    
    **CRITICAL RULES:**
    1. **NO HALLUCINATIONS:** You must find the specific contract address (starts with 0x) on a website like DexScreener, BaseScan, or CoinGecko.
    2. **VERIFICATION:** If you find a token name, search for "TokenName base address 0x". If you can't find the 0x address, DISCARD IT.
    
    **SEARCH QUERIES TO RUN:**
    - "site:dexscreener.com/base trending"
    - "site:geckoterminal.com base pools"
    - "top gainers base chain 24h"
    
    **FALLBACK:**
    If you cannot find *new* gems, return the current TOP TRENDING tokens on Base (e.g., AERO, BRETT, DEGEN, TOSHI) with their real addresses.
    
    **OUTPUT:**
    JSON Array of objects.
    Fields: name, symbol, address (MUST BE 0x...), liquidity, volume24h, marketCap, holders, gemScore (0-100), analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findGems error:", error);
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
    You are a "New Listing" Scanner.
    
    **GOAL:** List the most recent tokens added to Base DEXs (Uniswap, Aerodrome).
    
    **STRICT VALIDATION:**
    - You MUST provide the Contract Address (0x...).
    - Search specifically for: "site:dexscreener.com/base/ new pairs" OR "site:basescan.org/tokens recent".
    
    **STRATEGY:**
    1. Find names of new tokens.
    2. Search "[Token Name] base contract address".
    3. If address is not found, do not include the token.
    4. **FALLBACK:** If no brand new tokens are verifiable, return "Recently Trending" tokens on Base.
    
    **OUTPUT:**
    JSON Array of objects.
    Fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findNewProjects error:", error);
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
    You are a Crypto Analyst for Base Chain.
    
    **GOAL:** Identify 3 "High Conviction" tokens.
    
    **DATA EXTRACTION:**
    - Search for "Base chain bullish narrative twitter".
    - Cross-reference with "site:dexscreener.com/base" to find the Real Contract Address.
    - **DO NOT INVENT DATA.** Only use tokens where you can find a 0x address.
    
    **OUTPUT:**
    JSON Array of objects.
    Fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, convictionScore, analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    const result = parseAIResponse(response);
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("getAnalystPicks error:", error);
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
      You are a Social Sentiment Tracker for Base.
      
      **GOAL:** Find tokens that people are talking about on X (Twitter).
      
      **PROCESS:**
      1. Identify trending tickers ($BRETT, $TOSHI, $DEGEN, etc).
      2. **MANDATORY:** Search "[Ticker] base address" to find the 0x contract.
      3. If you can't find the address, check the "Top Volume" list on DexScreener Base, as high volume usually correlates with social trends.
      
      **OUTPUT:**
      JSON Array of objects.
      Fields: name, symbol, address, liquidity, volume24h, marketCap, holders, gemScore, analysis, technicalIndicators, socialSentiment, websiteUrl, xUrl, coinMarketCapUrl, coingeckoUrl, iconUrl.
      `;
  
      const response = await generateWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 2048 }
        },
      });
  
      const result = parseAIResponse(response);
      if (result.tokens.length > 0) saveToCache(cacheKey, result);
      return result;
  
    } catch (error: any) {
      console.error("findSocialTrends error:", error);
      throw error;
    }
  };
