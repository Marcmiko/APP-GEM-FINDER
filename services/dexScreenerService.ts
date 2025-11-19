
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
    return {
        name: pair.baseToken.name,
        symbol: pair.baseToken.symbol,
        address: pair.baseToken.address,
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
            strengths: pair.priceChange?.h24 > 0 ? "Positive 24h price action." : "High volume.",
            risks: pair.liquidity?.usd < 10000 ? "Low liquidity." : "Standard volatility.",
            verdict: pair.volume?.h24 > 100000 ? "High Activity" : "Speculative",
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
        websiteUrl: pair.info?.websites?.[0]?.url || null,
        xUrl: pair.info?.socials?.find(s => s.type === 'twitter')?.url || null,
        coinMarketCapUrl: null,
        coingeckoUrl: null,
        iconUrl: pair.info?.imageUrl || null,
        convictionScore: undefined
    };
};

const calculateGemScore = (pair: DexScreenerPair): number => {
    let score = 50;
    
    // Liquidity factor
    if (pair.liquidity?.usd > 100000) score += 20;
    else if (pair.liquidity?.usd > 10000) score += 10;
    else score -= 10;

    // Volume factor
    if (pair.volume?.h24 > 500000) score += 20;
    else if (pair.volume?.h24 > 50000) score += 10;

    // Price action
    if (pair.priceChange?.h24 > 10) score += 10;
    if (pair.priceChange?.h1 > 5) score += 5;

    return Math.min(100, Math.max(0, score));
}
