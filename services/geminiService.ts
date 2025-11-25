
import { GoogleGenAI } from "@google/genai";
import { Token, GroundingChunk } from '../types';
import { searchDexScreener, mapDexScreenerPairToToken, DexScreenerPair } from './dexScreenerService';
import { searchCoinGecko, getTrendingCoinGecko } from './coinGeckoService';
import { getMultiSourcePrices } from './multiPriceService';

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

const generateWithRetry = async (ai: any, params: any, retries = 5): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const isOverloaded = error?.message?.includes('503') || error?.status === 503;
      const isRateLimited = error?.message?.includes('429') || error?.status === 429;

      if (i < retries - 1 && (isOverloaded || isRateLimited)) {
        const delay = 2000 * Math.pow(2, i); // 2s, 4s, 8s, 16s, 32s
        console.warn(`Gemini API overloaded/rate-limited. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
};

// --- CORE LOGIC ---

const FALLBACK_TOKENS = ["BRETT", "DEGEN", "TOSHI", "AERO", "MOG", "KEYCAT", "VIRTUAL", "HIGHER"];

const fetchTokensFromNames = async (names: string[], minLiquidity = 10000, minVolume = 1000, minVolume1h = 0): Promise<Token[]> => {
  const tokens: Token[] = [];
  const seenAddresses = new Set<string>();

  for (const name of names) {
    // 1. Try DexScreener first (best for new/meme tokens)
    const pairs = await searchDexScreener(name);

    if (pairs.length > 0) {
      // Filter out garbage pairs first
      const validPairs = pairs.filter(p =>
        (p.liquidity?.usd || 0) >= minLiquidity &&
        (p.volume?.h24 || 0) >= minVolume &&
        (minVolume1h === 0 || (p.volume?.h1 || 0) >= minVolume1h)
      );

      if (validPairs.length > 0) {
        // Sort by liquidity to get the "real" one
        validPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        const bestPair = validPairs[0];

        if (!seenAddresses.has(bestPair.baseToken.address)) {
          tokens.push(mapDexScreenerPairToToken(bestPair));
          seenAddresses.add(bestPair.baseToken.address);
          continue; // Found on DexScreener, move to next name
        }
      }
    }

    // 2. If not found or low quality, try CoinGecko
    const cgTokens = await searchCoinGecko(name);
    if (cgTokens.length > 0) {
      const bestCg = cgTokens[0];
      // CoinGecko results are usually vetted, but we can check if we have data
      if (!seenAddresses.has(bestCg.address)) {
        // Basic check if we have liquidity info (might be missing from CG search result though)
        if (bestCg.liquidity >= minLiquidity) {
          tokens.push(bestCg);
          seenAddresses.add(bestCg.address);
        }
      }
    }
  }
}

// Batch update prices to ensure they are fresh
if (tokens.length > 0) {
  try {
    const addresses = tokens.map(t => t.address);
    const latestPrices = await getMultiSourcePrices(addresses);

    tokens.forEach(token => {
      const price = latestPrices[token.address.toLowerCase()];
      if (price && price > 0) {
        token.priceUsd = price;
      }
    });
  } catch (e) {
    console.warn("Failed to refresh prices in fetchTokensFromNames", e);
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
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
    Find the top 10 TRENDING token tickers on Base blockchain right now (Current Date: ${today}).
    Look for "Top Gainers", "Trending", or "Hottest" tokens on Base from the last 24 hours.
    Focus on tokens with high volume and community engagement.
    Return ONLY a JSON array of strings (tickers or names). Example: ["BRETT", "DEGEN", "TOSHI"].
    Do not include any other text.
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);

    // Mix in CoinGecko trending if available
    const cgTrending = await getTrendingCoinGecko();
    const combinedNames = [...new Set([...names, ...cgTrending, ...FALLBACK_TOKENS])];

    const tokens = await fetchTokensFromNames(combinedNames, 50000, 10000, 1000);

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
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
    Find 10 NEWLY LAUNCHED tokens on Base blockchain from the last 24-48 hours (Current Date: ${today}).
    Look for "New Pairs", "New Listings", or "Recent Mints" on Base.
    Ignore any tokens launched before ${today}.
    Return ONLY a JSON array of strings (tickers or names).
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);
    // Fallback list must be recent-ish or generic placeholders
    const searchList = names.length > 0 ? names : ["VIRTUAL", "LUNA", "KEYCAT"];

    // Fetch tokens with lower thresholds for new projects but still some liquidity
    let tokens = await fetchTokensFromNames(searchList, 2000, 500);

    // SAFETY NET: If AI + Search failed to find ANYTHING, use a hardcoded list of known active tokens
    if (tokens.length === 0) {
      console.warn("findNewProjects: No tokens found via AI/Search. Using hard fallback.");
      tokens = await fetchTokensFromNames(["BRETT", "DEGEN", "TOSHI", "AERO"], 1000, 100);
    }

    const now = Date.now();
    const recentTokens = tokens.filter(t => {
      const created = new Date(t.creationDate).getTime();
      const ageHours = (now - created) / (1000 * 60 * 60);
      return ageHours <= 168; // 7 days max
    });

    // If strict filter removes everything, fallback to the original list (AI suggestions are usually relevant enough)
    // If even that is empty (shouldn't be due to safety net), return the safety net tokens
    const finalTokens = recentTokens.length > 0 ? recentTokens : tokens;

    const result = { tokens: finalTokens.slice(0, 12), sources };
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findNewProjects error:", error);
    // Ultimate fallback on error
    const tokens = await fetchTokensFromNames(["BRETT", "DEGEN"], 1000, 100);
    return { tokens, sources: [] };
  }
};

export const getAnalystPicks = async (forceRefresh = false): Promise<{ tokens: Token[]; sources: GroundingChunk[] }> => {
  const cacheKey = 'analyst_picks';

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const prompt = `
    Find 5 "High Conviction" or "Blue Chip" tokens on Base blockchain that analysts are bullish on right now (${today}).
    Look for tokens with strong fundamentals, active development, and growing communities.
    Return ONLY a JSON array of strings.
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);
    const searchList = names.length > 0 ? names : ["AERO", "BRETT", "PRIME"];

    const tokens = await fetchTokensFromNames(searchList, 20000, 5000);

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
  const cacheKey = 'social_trends_heatmap';

  if (!forceRefresh) {
    const cached = getFromCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const prompt = `
      Find 15 DIVERSE tokens currently trending on Twitter/X/Farcaster across different categories:
      - 5 tokens from DeFi/Infrastructure (DEXs, Lending, Bridges)
      - 5 tokens from Gaming/NFT/AI
      - 5 tokens from social/community projects

      EXCLUDE these overused memecoins: DEGEN, BRETT, TOSHI, MOCHI, NORMIE, HIGHER, KEYCAT, MOG.
      
      Focus on tokens with REAL utility, products, or unique narratives.
      For each token, estimate "Sentiment Score" (0-100) and "Hype Magnitude" (1-10).
      
        { "symbol": "TICKER", "sentiment": 85, "magnitude": 9, "category": "DeFi" },
        ...
      ]
      `;

    const ai = getAiClient();
    const response = await generateWithRetry(ai, {
      model: "gemini-1.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || '[]';
    let trends: { symbol: string; sentiment: number; magnitude: number; category?: string }[] = [];

    try {
      trends = JSON.parse(text);
    } catch (e) {
      console.warn("Failed to parse social trends JSON", e);
    }

    // Filter out banned memecoins from AI response
    const BANNED_SYMBOLS = ['DEGEN', 'BRETT', 'TOSHI', 'MOCHI', 'NORMIE', 'HIGHER', 'KEYCAT', 'MOG'];
    trends = trends.filter(t => !BANNED_SYMBOLS.includes(t.symbol.toUpperCase()));

    // Fallback if parsing fails or empty
    if (trends.length === 0) {
      console.warn("AI Social Trends failed, using diverse fallback");
      trends = [
        { symbol: "VIRTUAL", sentiment: 85, magnitude: 9, category: "AI" },
        { symbol: "AERO", sentiment: 90, magnitude: 10, category: "DeFi" },
        { symbol: "LUNA", sentiment: 65, magnitude: 6, category: "Gaming" },
        { symbol: "TALENT", sentiment: 70, magnitude: 7, category: "Social" },
        { symbol: "PRIME", sentiment: 75, magnitude: 8, category: "Gaming" },
        { symbol: "USDC", sentiment: 60, magnitude: 5, category: "Stablecoin" }
      ];
    }

    const searchList = trends.map(t => t.symbol);
    const tokens = await fetchTokensFromNames(searchList);

    // Merge sentiment data into the tokens
    const enrichedTokens = tokens.map(token => {
      const trend = trends.find(t => t.symbol.toUpperCase() === token.symbol.toUpperCase());
      if (trend) {
        return {
          ...token,
          socialSentiment: {
            ...token.socialSentiment,
            positive: trend.sentiment,
            negative: 100 - trend.sentiment,
            summary: `${trend.category || 'Trending'} | Hype: ${trend.magnitude}/10`
          },
          convictionScore: trend.magnitude
        };
      }
      return token;
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const result = { tokens: enrichedTokens, sources: sources as GroundingChunk[] };

    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findSocialTrends error:", error);
    // Fallback with diverse tokens, NOT the same memecoins
    const tokens = await fetchTokensFromNames(["VIRTUAL", "AERO", "PRIME"]);
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
      const token = mapDexScreenerPairToToken(pairs[0]);
      const enrichedToken = await enrichTokenAnalysis(token);
      return { tokens: [enrichedToken], sources: [] };
    }

    // Fallback to CoinGecko
    const cgTokens = await searchCoinGecko(query);
    if (cgTokens.length > 0) {
      const token = cgTokens[0];
      const enrichedToken = await enrichTokenAnalysis(token);
      return { tokens: [enrichedToken], sources: [] };
    }

    return { tokens: [], sources: [] };

  } catch (error: any) {
    throw error;
  }
};

export const enrichTokenAnalysis = async (token: Token): Promise<Token> => {
  try {
    const ai = getAiClient();
    const prompt = `
    Analyze the crypto token ${token.name} (${token.symbol}) on Base blockchain.
    Data: Liquidity $${token.liquidity}, Volume $${token.volume24h}, Market Cap $${token.marketCap}.
    
    Provide a JSON object with the following fields:
    - summary: A 1-sentence summary of what the project does.
    - strengths: A short list of key strengths (e.g. "Strong community", "High volume").
    - risks: A short list of key risks (e.g. "Low liquidity", "Anon team").
    - verdict: A short investment verdict (e.g. "High Risk / High Reward", "Safe Bet").
    - auditScore: A number 0-100 representing overall project quality/safety.
    - securityScore: A number 0-100 (contract safety, audit status).
    - utilityScore: A number 0-100 (use case, product).
    - communityScore: A number 0-100 (social activity, holders).
    - redFlags: A list of critical warning signs (e.g. "Mintable", "Blacklist function").
    - greenFlags: A list of positive signals (e.g. "Renounced ownership", "Doxxed team").
    - holderCount: An estimated number of holders (integer) or 0 if unknown.
    
    Return ONLY the JSON object.
    `;

    const response = await generateWithRetry(ai, {
      model: "gemini-1.5-pro",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || '{}';
    const analysis = JSON.parse(text);

    return {
      ...token,
      holders: analysis.holderCount || token.holders || 0,
      auditScore: analysis.auditScore || 50,
      auditReport: {
        securityScore: analysis.auditScorecard.securityScore,
        utilityScore: analysis.auditScorecard.utilityScore,
        communityScore: analysis.auditScorecard.communityScore,
        overallScore: Math.round((analysis.auditScorecard.securityScore + analysis.auditScorecard.utilityScore + analysis.auditScorecard.communityScore) / 3),
        redFlags: analysis.auditScorecard.redFlags,
        greenFlags: analysis.auditScorecard.greenFlags
      },
      analysis: {
        summary: analysis.summary || token.analysis.summary,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.join(", ") : (analysis.strengths || token.analysis.strengths),
        risks: Array.isArray(analysis.risks) ? analysis.risks.join(", ") : (analysis.risks || token.analysis.risks),
        verdict: analysis.verdict || token.analysis.verdict,
      }
    };
  } catch (error) {
    console.error(`Failed to enrich token ${token.symbol}:`, error);
    return token;
  }
};
