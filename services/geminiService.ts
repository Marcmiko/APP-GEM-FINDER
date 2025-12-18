
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
const BLACKLIST_TOKENS = ["PIPPIN", "HONEYPOT", "SCAM"]; // Add known bad tokens here

const fetchTokensFromNames = async (names: string[], minLiquidity = 10000, minVolume = 1000, minVolume1h = 0): Promise<Token[]> => {
  const tokens: Token[] = [];
  const seenAddresses = new Set<string>();

  // Filter out blacklisted names before even searching
  const filteredNames = names.filter(name => !BLACKLIST_TOKENS.includes(name.toUpperCase()));

  for (const name of filteredNames) {
    // 1. Try DexScreener first (best for new/meme tokens)
    const pairs = await searchDexScreener(name);

    if (pairs.length > 0) {
      // Prioritize exact symbol matches
      const exactMatches = pairs.filter(p => p.baseToken.symbol.toUpperCase() === name.toUpperCase());
      const sourcePairs = exactMatches.length > 0 ? exactMatches : pairs;

      // Filter out garbage pairs first
      const validPairs = sourcePairs.filter(p =>
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
    Find 10 HIDDEN GEM tokens on Base blockchain that fit one of these 4 HISTORICAL SUCCESS ARCHETYPES (Current Date: ${today}):
    
    1. "THE SLEEPING GIANT" (Pattern: DONUT/TOSHI)
       - Older token (>3 months) with massive community strength (check social mentions).
       - Price is currently ranging or consolidating after a long period of quiet.
       - High holder count relative to its market cap.
       
    2. "THE FAIR LAUNCH" (Pattern: BRETT/MOCHI)
       - Recent launch (last 1-60 days).
       - Verified mechanics: Liquidity Burned, Renounced, 0 Tax.
       - Strong "meme-ability" or cultural impact potential.
       
    3. "THE TECH INNOVATOR" (Pattern: VIRTUAL/PRIME)
       - Focus on AI, DePIN, Gaming, or Infrastructure.
       - Continuous shipping: Look for recent GitHub or social updates.
       - Solves a real problem in the Base ecosystem.

    4. "THE CASH COW" (Pattern: AERO/REVENUE)
       - Protocols generating high fees relative to TVL or MC.
       - High Buy-back and burn mechanics or staker rewards.
       - Undervalued P/S ratio compared to competitors.
    
    CRITERIA:
    - Market cap UNDER $5 million (up to $15M for high-revenue plays).
    - Liquidity > $10k.
    - Not typically found in the standard trending lists.
    
    INSTRUCTIONS:
    - Return ONLY a JSON array of objects.
    - Format: [{"symbol": "TOKEN1", "archetype": "The Sleeping Giant", "rationale": "Deep technical analysis of why it matches this pattern"}]
    - Diversify the selection across all 4 archetypes.
    - Do not include any other text.
    `;

    const ai = getAiClient();
    const response = await generateWithRetry(ai, {
      model: "gemini-1.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2048 }
      },
    });

    let suggestions: { symbol: string, archetype: string, rationale: string }[] = [];
    try {
      if (response.text) {
        suggestions = JSON.parse(response.text);
      }
    } catch (e) {
      console.warn("Failed to parse structured gems JSON", e);
      // Fallback: try to match simple string array pattern if AI failed to follow instructions
      const { names } = await getGeminiSuggestions(prompt);
      suggestions = names.map(n => ({ symbol: n, archetype: "Unknown", rationale: "AI suggested hidden gem." }));
    }

    const searchList = suggestions.map(s => s.symbol);
    // Add defaults if empty
    const combinedNames = [...new Set(searchList.length > 0 ? searchList : FALLBACK_TOKENS)];

    // LOWER thresholds for hidden gems:
    // - Min liquidity: $10k (down from $50k)
    // - Min volume 24h: $2k (down from $10k)  
    // - Min volume 1h: $100 (down from $1k)
    const tokens = await fetchTokensFromNames(combinedNames, 10000, 2000, 100);

    // Merge AI rationale back into tokens
    const enrichedTokens = tokens.map(t => {
      const suggestion = suggestions.find(s => s.symbol.toUpperCase() === t.symbol.toUpperCase());
      if (suggestion) {
        return {
          ...t,
          explosionRationale: suggestion.rationale,
          keyDrivers: `Archetype: ${suggestion.archetype} - ${suggestion.rationale}`, // Put archetype in key drivers
          analysis: {
            ...t.analysis,
            strengths: `Archetype: ${suggestion.archetype}. ${t.analysis?.strengths || ''}`,
            explosionRationale: suggestion.rationale
          }
        };
      }
      return t;
    });

    // Filter out tokens with market cap > $50M (relaxed from $10M to find more gems)
    const hiddenGems = enrichedTokens.filter(t => {
      const marketCap = t.marketCap || 0;
      return marketCap < 50_000_000; // Max $50M market cap
    });

    // If strict filter removed everything, try a more relaxed filter (up to $100M)
    // or just return the top tokens found regardless of MC (but sorted by lowest MC)
    let finalTokens = hiddenGems;
    if (finalTokens.length === 0 && enrichedTokens.length > 0) {
      console.warn("Strict filter removed all tokens, relaxing criteria...");
      finalTokens = enrichedTokens.filter(t => (t.marketCap || 0) < 100_000_000);
    }

    // If STILL nothing, just return what we found but mark them (or just show them)
    if (finalTokens.length === 0 && enrichedTokens.length > 0) {
      finalTokens = enrichedTokens;
    }

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const result = { tokens: finalTokens.slice(0, 12), sources }; // Limit to 12
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findGems error:", error);
    // Fallback: Try to get real new pools from GeckoTerminal first
    try {
      const { getNewPools } = await import('./geckoTerminalService');
      const newPools = await getNewPools();
      if (newPools.length > 0) {
        return { tokens: newPools.slice(0, 12), sources: [] };
      }
    } catch (e) {
      console.warn("Fallback to new pools failed:", e);
    }

    // Ultimate fallback to hardcoded list if everything fails
    const tokens = await fetchTokensFromNames(FALLBACK_TOKENS, 5000, 1000, 0);
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
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const prompt = `
    Find 10 NEWLY LAUNCHED tokens on Base blockchain from the last 24-72 hours (Current Date: ${today}).
    
    CRITERIA FOR NEW HIDDEN GEMS:
    - Launched between ${yesterday} and ${today}
    - Market cap UNDER $2 million (very early stage)
    - Has liquidity pool created (at least $5k liquidity)
    - NOT a copycat or obvious scam
    - Has some initial volume (shows real interest)
    - Unique name or concept
    
    AVOID:
    - Tokens launched more than 3 days ago
    - Tokens with market cap already over $5M
    - Known forks or copies
    - Tokens with suspicious contract
    
    Look for "New Pairs", "New Listings", or "Recent Launches" on Base.
    Return ONLY a JSON array of strings (tickers or names).
    `;

    const { names, sources } = await getGeminiSuggestions(prompt);

    // Even lower thresholds for brand new projects:
    // - Min liquidity: $5k (very new)
    // - Min volume 24h: $500 (just needs some activity)
    // - Min volume 1h: $50 (shows it's alive)
    const tokens = await fetchTokensFromNames(names, 5000, 500, 50);

    // Filter for very early stage (market cap < $10M, relaxed from $5M)
    const earlyStage = tokens.filter(t => {
      const marketCap = t.marketCap || 0;
      return marketCap < 10_000_000; // Max $10M for new projects
    });

    let finalTokens = earlyStage;
    if (finalTokens.length === 0 && tokens.length > 0) {
      // If strict filter failed, show whatever we found
      finalTokens = tokens;
    }

    const result = { tokens: finalTokens.slice(0, 12), sources };
    if (result.tokens.length > 0) saveToCache(cacheKey, result);
    return result;

  } catch (error: any) {
    console.error("findNewProjects error:", error);
    // Fallback to some recent-ish tokens if possible, or just empty
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
      - 5 tokens from "Revenue Spikes" or "Dune Analytics Breakouts" (High fee generation)

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
    
    Check if it fits one of these "Success Archetypes":
    1. "Sleeping Giant" (Old, active community, low price)
    2. "Fair Launch" (Locked LP, Renounced, No Tax, organic growth)
    3. "Tech Innovator" (Real shipping product, AI/Gaming, transparency)
    4. "Cash Cow" (High Revenue/Fees, Undervalued vs Revenue)
    
    Provide a JSON object with the following fields:
    - summary: A 1-sentence summary of what the project does.
    - strengths: A short list of key strengths. If it fits an archetype, MENTION IT HERE.
    - risks: A short list of key risks.
    - explosionRationale: A specific thesis on WHY this token could explode (e.g. "Dune revenue up 200%", "Undervalued vs AERO").
    - verdict: A short investment verdict.
    - auditScore: A number 0-100 representing overall project quality/safety.
    - securityScore: A number 0-100 (contract safety, audit status).
    - utilityScore: A number 0-100 (use case, product).
    - communityScore: A number 0-100 (social activity, holders).
    - redFlags: A list of critical warning signs.
    - greenFlags: A list of positive signals.
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
      explosionRationale: analysis.explosionRationale,
      auditScore: analysis.auditScore || 50,
      auditReport: {
        securityScore: analysis.securityScore || 50,
        utilityScore: analysis.utilityScore || 50,
        communityScore: analysis.communityScore || 50,
        overallScore: analysis.auditScore || 50,
        redFlags: analysis.redFlags || [],
        greenFlags: analysis.greenFlags || []
      },
      aiAnalysis: analysis.summary || token.analysis.summary,
      keyDrivers: Array.isArray(analysis.strengths) ? analysis.strengths.join(", ") : (analysis.strengths || token.analysis.strengths),
      risks: Array.isArray(analysis.risks) ? analysis.risks.join(", ") : (analysis.risks || token.analysis.risks),
      analysis: {
        summary: analysis.summary || token.analysis.summary,
        strengths: Array.isArray(analysis.strengths) ? analysis.strengths.join(", ") : (analysis.strengths || token.analysis.strengths),
        risks: Array.isArray(analysis.risks) ? analysis.risks.join(", ") : (analysis.risks || token.analysis.risks),
        verdict: analysis.verdict || token.analysis.verdict,
        explosionRationale: analysis.explosionRationale
      }
    };
  } catch (error) {
    console.error(`Failed to enrich token ${token.symbol}:`, error);
    return token;
  }
};
