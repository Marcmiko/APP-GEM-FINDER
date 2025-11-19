
import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';
import { searchDexScreener, mapDexScreenerPairToToken, DexScreenerPair } from './dexScreenerService';
import { searchCoinGecko, getTrendingCoinGecko } from './coinGeckoService';

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

// --- CORE LOGIC ---

const FALLBACK_TOKENS = ["BRETT", "DEGEN", "TOSHI", "AERO", "MOG", "KEYCAT", "VIRTUAL", "HIGHER"];

const fetchTokensFromNames = async (names: string[]): Promise<Token[]> => {
  const tokens: Token[] = [];
  const seenAddresses = new Set<string>();

  for (const name of names) {
    // 1. Try DexScreener first (best for new/meme tokens)
    const pairs = await searchDexScreener(name);

    if (pairs.length > 0) {
      // Sort by liquidity to get the "real" one
      pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      const bestPair = pairs[0];

      if (!seenAddresses.has(bestPair.baseToken.address)) {
        tokens.push(mapDexScreenerPairToToken(bestPair));
        seenAddresses.add(bestPair.baseToken.address);
        continue; // Found on DexScreener, move to next name
      }
    }

    // 2. If not found or low quality, try CoinGecko
    const cgTokens = await searchCoinGecko(name);
    if (cgTokens.length > 0) {
      const bestCg = cgTokens[0];
      if (!seenAddresses.has(bestCg.address)) {
        tokens.push(bestCg);
        seenAddresses.add(bestCg.address);
      }
    }
  }
  return tokens;
};

const getGeminiSuggestions = async (prompt: string): Promise<{ names: string[], sources: GroundingChunk[] }> => {
  try {
    const ai = getAiClient();
    const response = await generateWithRetry(ai, {
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    let text = response.text || '';
    // Extract JSON array of strings
    const jsonMatch = text.match(/\[\s*".*"\s*\]/s) || text.match(/\[\s*'.*'\s*\]/s);
    let names: string[] = [];

    if (jsonMatch) {
      try {
        // Replace single quotes with double quotes for valid JSON if needed
        const jsonStr = jsonMatch[0].replace(/'/g, '"');
        names = JSON.parse(jsonStr);
      } catch (e) {
        console.warn("Failed to parse JSON from Gemini:", e);
      }
    }

    // Fallback: split by commas if no JSON found but text looks like a list
    if (names.length === 0 && text.includes(',')) {
      names = text.split(',').map(s => s.trim()).filter(s => s.length > 1 && s.length < 20);
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    return { names, sources: sources as GroundingChunk[] };

  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return { names: [], sources: [] };
  }
};

export const findGems = async (startDate?: string, endDate?: string, forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = `gem_finder_${startDate || 'all'}_${endDate || 'all'}`;

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const prompt = `
    Find the top 10 TRENDING token tickers on Base blockchain right now.
    Look for "Top Gainers", "Trending", or "Hottest" tokens on Base from the last 24 hours.
    Return ONLY a JSON array of strings (tickers or names). Example: ["BRETT", "DEGEN", "TOSHI"].
    Do not include any other text.
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);

    // Mix in CoinGecko trending if available
    const cgTrending = await getTrendingCoinGecko();
    const combinedNames = [...new Set([...names, ...cgTrending, ...FALLBACK_TOKENS])];

    const tokens = await fetchTokensFromNames(combinedNames);

    const result = { tokens: tokens.slice(0, 12), sources }; // Limit to 12
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findGems error:", error);
    // Fallback to hardcoded list if AI fails completely
    const tokens = await fetchTokensFromNames(FALLBACK_TOKENS);
    return { tokens, sources: [] };
  }
};

export const findNewProjects = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'new_projects';

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const prompt = `
    Find 10 NEWLY LAUNCHED tokens on Base blockchain from the last 24-48 hours.
    Look for "New Pairs", "New Listings", or "Recent Mints" on Base.
    Return ONLY a JSON array of strings (tickers or names).
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);
    // For new projects, if AI fails, we might not want to show old trending ones, but better than nothing.
    const searchList = names.length > 0 ? names : ["VIRTUAL", "LUNA", "KEYCAT"];

    const tokens = await fetchTokensFromNames(searchList);

    const result = { tokens: tokens.slice(0, 12), sources };
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findNewProjects error:", error);
    return { tokens: [], sources: [] };
  }
};

export const getAnalystPicks = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'analyst_picks';

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const prompt = `
    Find 5 "High Conviction" or "Blue Chip" tokens on Base blockchain that analysts are bullish on.
    Return ONLY a JSON array of strings.
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);
    const searchList = names.length > 0 ? names : ["AERO", "BRETT", "PRIME"];

    const tokens = await fetchTokensFromNames(searchList);

    const result = { tokens: tokens.slice(0, 12), sources };
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("getAnalystPicks error:", error);
    const tokens = await fetchTokensFromNames(["AERO", "BRETT"]);
    return { tokens, sources: [] };
  }
};

export const findSocialTrends = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'social_trends';

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const prompt = `
      Find tokens on Base blockchain that are trending on Twitter/X right now.
      Return ONLY a JSON array of strings (tickers).
      `;

    const { names, sources } = await getGeminiSuggestions(prompt);
    const searchList = names.length > 0 ? names : ["DEGEN", "MOG", "TOSHI"];

    const tokens = await fetchTokensFromNames(searchList);

    const result = { tokens: tokens.slice(0, 12), sources };
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findSocialTrends error:", error);
    const tokens = await fetchTokensFromNames(["DEGEN", "MOG"]);
    return { tokens, sources: [] };
  }
};

export const analyzeSpecificToken = async (query: string): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  try {
    // Direct search first
    const pairs = await searchDexScreener(query);
    // Sort by liquidity
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    if (pairs.length > 0) {
      return { tokens: [mapDexScreenerPairToToken(pairs[0])], sources: [] };
    }

    // Fallback to CoinGecko
    const cgTokens = await searchCoinGecko(query);
    if (cgTokens.length > 0) {
      return { tokens: [cgTokens[0]], sources: [] };
    }

    return { tokens: [], sources: [] };

  } catch (error: any) {
    console.error("analyzeSpecificToken error:", error);
    throw error;
  }
};
