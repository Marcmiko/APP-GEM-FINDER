
export interface TechnicalIndicators {
  rsi: number | null;
  macd: string | null;
  movingAverages: string | null;
}

export interface TokenAnalysis {
  summary: string;
  strengths: string;
  risks: string;
  verdict: string;
}

export interface SocialSentiment {
  positive: number;
  negative: number;
  neutral: number;
  summary: string;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  creationDate: string;
  liquidity: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  isLiquidityLocked: boolean;
  isOwnershipRenounced: boolean;
  gemScore: number;
  analysis: TokenAnalysis;
  technicalIndicators?: TechnicalIndicators;
  socialSentiment?: SocialSentiment;
  websiteUrl?: string | null;
  xUrl?: string | null;
  coinMarketCapUrl?: string | null;
  coingeckoUrl?: string | null;
  iconUrl?: string | null;
  convictionScore?: number;
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: WebSource;
}

export interface ScanResult {
  timestamp: Date;
  tokens: Token[];
  sources: GroundingChunk[];
}
