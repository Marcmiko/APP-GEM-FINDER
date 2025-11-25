
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

export interface SecurityChecks {
  renouncedOwnership: boolean;
  liquidityLocked: boolean;
  noMintFunction: boolean;
  noBlacklist: boolean;
  noProxy: boolean;
}

export interface TokenLinks {
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  discord?: string | null;
  coinmarketcap?: string | null;
  coingecko?: string | null;
}

export interface Token {
  name: string;
  symbol: string;
  address: string;
  pairAddress: string;
  decimals?: number;
  chainId?: number;
  creationDate: string;
  liquidity: number;
  volume24h: number;
  marketCap: number;
  fdv?: number;
  holders: number;
  buyPressure: number; // 0-100 percentage of buys
  priceUsd: number;
  priceChange1h?: number;
  priceChange24h?: number;
  volume1h?: number;
  entryPrice?: number;
  holdings?: number;
  avgBuyPrice?: number;

  // Deprecated flat fields (kept for backward compatibility if needed, but prefer objects)
  isLiquidityLocked: boolean;
  isOwnershipRenounced: boolean;
  websiteUrl?: string | null;
  xUrl?: string | null;
  telegramUrl?: string | null;
  discordUrl?: string | null;
  coinMarketCapUrl?: string | null;
  coingeckoUrl?: string | null;

  // New structured fields
  isVerified?: boolean;
  verdict?: string; // Quick access to analysis.verdict
  aiAnalysis?: string; // Quick access to analysis.summary
  keyDrivers?: string; // From analysis.strengths
  risks?: string; // From analysis.risks

  circulatingSupply?: number;
  totalSupply?: number;

  gemScore: number;
  analysis: TokenAnalysis;
  technicalIndicators?: TechnicalIndicators;
  socialSentiment?: SocialSentiment;

  links: TokenLinks;
  securityChecks: SecurityChecks;

  iconUrl?: string | null;
  convictionScore?: number;
  auditScore?: number; // 0-100
  auditReport?: {
    overallScore: number; // Mapped from securityScore for compatibility
    securityScore: number; // 0-100
    utilityScore: number; // 0-100
    communityScore: number; // 0-100
    redFlags: string[];
    greenFlags: string[];
  };
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

export type Page = 'gem-finder' | 'ai-sniper' | 'new-projects' | 'analyst-picks' | 'social-trends' | 'token-analyzer' | 'saved-projects';
