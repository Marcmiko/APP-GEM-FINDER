
import { Token } from '../types';

const BASE_API_URL = 'https://api.dexscreener.com/latest/dex';

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
  pairCreatedAt?: number;
  info?: {
    imageUrl?: string;
    websites?: { label: string; url: string }[];
    socials?: { type: string; url: string }[];
  };
}

export interface DexScreenerSearchResponse {
  schemaVersion: string;
  pairs: DexScreenerPair[];
}

export const searchDexScreener = async (query: string): Promise<DexScreenerPair[]> => {
  try {
    const response = await fetch(`${BASE_API_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`DexScreener API error: ${response.statusText}`);
    }
    const data: DexScreenerSearchResponse = await response.json();
    // Filter for Base chain only
    return data.pairs.filter(pair => pair.chainId === 'base');
  } catch (error) {
    console.error("Error searching DexScreener:", error);
    return [];
  }
};

export const getPairsByAddress = async (addresses: string[]): Promise<DexScreenerPair[]> => {
  if (addresses.length === 0) return [];

  try {
    // DexScreener allows comma-separated addresses (up to 30)
    const chunks = [];
    for (let i = 0; i < addresses.length; i += 30) {
      chunks.push(addresses.slice(i, i + 30).join(','));
    }

    let allPairs: DexScreenerPair[] = [];

    for (const chunk of chunks) {
      const response = await fetch(`${BASE_API_URL}/tokens/${chunk}`);
      if (!response.ok) continue;
      const data: DexScreenerSearchResponse = await response.json();
      if (data.pairs) {
        allPairs = [...allPairs, ...data.pairs];
      }
    }

    // Filter for Base chain only (just in case)
    return allPairs.filter(pair => pair.chainId === 'base');
  } catch (error) {
    console.error("Error fetching pairs from DexScreener:", error);
    return [];
  }
};

export const mapDexScreenerPairToToken = (pair: DexScreenerPair): Token => {
  const websites = pair.info?.websites || [];
  const socials = pair.info?.socials || [];

  return {
    name: pair.baseToken.name,
    symbol: pair.baseToken.symbol,
    address: pair.baseToken.address,
    pairAddress: pair.pairAddress,
    creationDate: pair.pairCreatedAt ? new Date(pair.pairCreatedAt).toISOString() : new Date().toISOString(),
    liquidity: pair.liquidity?.usd || 0,
    volume24h: pair.volume?.h24 || 0,
    marketCap: pair.marketCap || pair.fdv || 0,
    holders: 0, // DexScreener doesn't provide holder count directly
    isLiquidityLocked: false, // Not provided by DexScreener API directly
    isOwnershipRenounced: false, // Not provided
    gemScore: calculateGemScore(pair),
    analysis: {
      summary: `Trading on ${pair.dexId} with $${pair.liquidity?.usd?.toLocaleString()} liquidity.`,
      strengths: generateStrengths(pair),
      risks: generateRisks(pair),
      verdict: generateVerdict(pair),
    },
    technicalIndicators: {
      rsi: null,
      macd: null,
      movingAverages: pair.priceChange?.h24 ? `${pair.priceChange.h24}% (24h)` : null,
    },
    socialSentiment: {
      positive: 50,
      negative: 25,
      neutral: 25,
      summary: "Social data not directly available via API."
    },
    websiteUrl: websites.find(w => w.label === 'Website')?.url || websites[0]?.url || null,
    xUrl: socials.find(s => s.type === 'twitter')?.url || null,
    telegramUrl: socials.find(s => s.type === 'telegram')?.url || null,
    discordUrl: socials.find(s => s.type === 'discord')?.url || null,
    coinMarketCapUrl: null, // Will be populated if found in socials or via separate search
    coingeckoUrl: null,
    iconUrl: pair.info?.imageUrl || null,
    convictionScore: undefined
  };
};

const generateStrengths = (pair: DexScreenerPair): string => {
  const strengths = [];
  if (pair.liquidity?.usd > 50000) strengths.push("Strong Liquidity");
  if (pair.volume?.h24 > 100000) strengths.push("High 24h Volume");
  if (pair.priceChange?.h24 > 10) strengths.push("Positive Momentum");
  if (pair.txns?.h24?.buys > pair.txns?.h24?.sells) strengths.push("More Buys than Sells");
  return strengths.join(", ") || "No major strengths detected.";
};

const generateRisks = (pair: DexScreenerPair): string => {
  const risks = [];
  if (pair.liquidity?.usd < 5000) risks.push("Very Low Liquidity");
  if (pair.volume?.h24 < 1000) risks.push("Low Volume");
  if (pair.priceChange?.h24 < -10) risks.push("Negative Price Action");
  if (!pair.info?.socials?.length) risks.push("No Social Links");
  return risks.join(", ") || "Standard volatility risk.";
};

const generateVerdict = (pair: DexScreenerPair): string => {
  const score = calculateGemScore(pair);
  if (score > 80) return "High Potential Gem 💎";
  if (score > 60) return "Good Potential 🚀";
  if (score > 40) return "Neutral / Watchlist 👀";
  return "High Risk / Avoid ⚠️";
};

const calculateGemScore = (pair: DexScreenerPair): number => {
  let score = 50;

  // Liquidity factor (0-30 points)
  if (pair.liquidity?.usd > 500000) score += 30;
  else if (pair.liquidity?.usd > 100000) score += 20;
  else if (pair.liquidity?.usd > 10000) score += 10;
  else score -= 20; // Penalty for low liquidity

  // Volume factor (0-20 points)
  if (pair.volume?.h24 > 1000000) score += 20;
  else if (pair.volume?.h24 > 100000) score += 10;
  else if (pair.volume?.h24 < 1000) score -= 10;

  // Price action (0-20 points)
  if (pair.priceChange?.h24 > 20) score += 20;
  else if (pair.priceChange?.h24 > 5) score += 10;
  else if (pair.priceChange?.h24 < -20) score -= 10;

  // Socials factor (0-10 points)
  if (pair.info?.socials?.length) score += 10;
  if (pair.info?.websites?.length) score += 5;

  // Age factor (Newer might be riskier but higher potential for "Gem Finder")
  // For "New Projects" we might want new, but for general score, established is safer.
  // Let's keep it neutral for now.

  return Math.min(100, Math.max(0, score));
}

export const filterRecentPairs = (pairs: DexScreenerPair[], maxAgeHours: number = 48): DexScreenerPair[] => {
  const now = Date.now();
  return pairs.filter(pair => {
    if (!pair.pairCreatedAt) return false;
    const ageHours = (now - pair.pairCreatedAt) / (1000 * 60 * 60);
    return ageHours <= maxAgeHours;
  });
};
