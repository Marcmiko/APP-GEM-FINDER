
import { Token } from '../types';

const BASE_API_URL = 'https://api.geckoterminal.com/api/v2';

export interface GeckoTerminalPool {
    id: string;
    type: string;
    attributes: {
        base_token_price_usd: string;
        base_token_price_native_currency: string;
        quote_token_price_usd: string;
        quote_token_price_native_currency: string;
        address: string;
        name: string;
        pool_created_at: string;
        fdv_usd: string;
        market_cap_usd: string | null;
        price_change_percentage: {
            m5: string;
            h1: string;
            h6: string;
            h24: string;
        };
        transactions: {
            m5: { buys: number; sells: number };
            h1: { buys: number; sells: number };
            h24: { buys: number; sells: number };
        };
        volume_usd: {
            m5: string;
            h1: string;
            h6: string;
            h24: string;
        };
        reserve_in_usd: string;
    };
    relationships: {
        base_token: {
            data: {
                id: string;
                type: string;
            }
        };
        quote_token: {
            data: {
                id: string;
                type: string;
            }
        };
        dex: {
            data: {
                id: string;
                type: string;
            }
        };
    };
}

export const getNewPools = async (): Promise<Token[]> => {
    try {
        const response = await fetch(`${BASE_API_URL}/networks/base/new_pools?page=1&limit=20`);
        if (!response.ok) {
            throw new Error(`GeckoTerminal API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data.map(mapGeckoTerminalPoolToToken);
    } catch (error) {
        console.error("Error fetching new pools from GeckoTerminal:", error);
        return [];
    }
};

export const getTokenPrices = async (addresses: string[]): Promise<Record<string, number>> => {
    if (addresses.length === 0) return {};

    try {
        // GeckoTerminal allows up to 30 addresses per request usually, so we might need to chunk if list is huge
        // For now, let's assume < 30 or handle simple batching if needed later.
        const addressesStr = addresses.join(',');
        const response = await fetch(`${BASE_API_URL}/simple/networks/base/token_price/${addressesStr}`);

        if (!response.ok) {
            throw new Error(`GeckoTerminal API error: ${response.statusText}`);
        }

        const data = await response.json();
        // Response format: { data: { attributes: { token_prices: { "0x...": "1.23" } } } }
        const prices: Record<string, number> = {};
        const rawPrices = data.data.attributes.token_prices;

        for (const [addr, price] of Object.entries(rawPrices)) {
            prices[addr] = parseFloat(price as string);
        }

        return prices;
    } catch (error) {
        console.error("Error fetching token prices:", error);
        return {};
    }
};

const mapGeckoTerminalPoolToToken = (pool: GeckoTerminalPool): Token => {
    const attr = pool.attributes;
    const baseTokenId = pool.relationships.base_token.data.id;
    const tokenAddress = baseTokenId.replace('base_', '');

    // Extract symbol from pool name (e.g., "HSS / WETH 838.861%")
    // Usually "SYMBOL / QUOTE ..."
    const nameParts = attr.name.split(' / ');
    const symbol = nameParts[0] || 'UNKNOWN';

    const liquidity = parseFloat(attr.reserve_in_usd) || 0;
    const volume24h = parseFloat(attr.volume_usd.h24) || 0;
    const volume1h = parseFloat(attr.volume_usd.h1) || 0;
    const buyPressure = calculateBuyPressure(attr.transactions.h24);

    const gemScore = calculateSniperGemScore(liquidity, volume24h, buyPressure);
    const { strengths, risks, verdict } = generateSniperAnalysis(liquidity, volume24h, buyPressure, gemScore);

    return {
        name: symbol, // We use symbol as name for now as GT doesn't give full name in this endpoint
        symbol: symbol,
        address: tokenAddress,
        pairAddress: attr.address,
        creationDate: attr.pool_created_at,
        liquidity: liquidity,
        volume24h: volume24h,
        marketCap: parseFloat(attr.fdv_usd) || 0,
        fdv: parseFloat(attr.fdv_usd) || 0,
        holders: 0,
        buyPressure: buyPressure,
        priceUsd: parseFloat(attr.base_token_price_usd) || 0,
        priceChange1h: parseFloat(attr.price_change_percentage.h1) || 0,
        priceChange24h: parseFloat(attr.price_change_percentage.h24) || 0,
        volume1h: volume1h,
        isLiquidityLocked: false,
        isOwnershipRenounced: false,
        gemScore: gemScore,
        analysis: {
            summary: `New pool on ${pool.relationships.dex.data.id}. Created at ${new Date(attr.pool_created_at).toLocaleTimeString()}.`,
            strengths: strengths,
            risks: risks,
            verdict: verdict,
        },
        technicalIndicators: {
            rsi: null,
            macd: null,
            movingAverages: null,
        },
        socialSentiment: {
            positive: 50,
            negative: 0,
            neutral: 50,
            summary: "No social data yet."
        },
        links: {
            website: null,
            twitter: null,
            telegram: null,
            discord: null,
            coinmarketcap: null,
            coingecko: null
        },
        securityChecks: {
            renouncedOwnership: false,
            liquidityLocked: false,
            noMintFunction: false,
            noBlacklist: false,
            noProxy: false
        },
        websiteUrl: null,
        xUrl: null,
        telegramUrl: null,
        discordUrl: null,
        coinMarketCapUrl: null,
        coingeckoUrl: null,
        iconUrl: null,
        convictionScore: undefined
    };
};

const calculateBuyPressure = (txns: { buys: number; sells: number }): number => {
    if (!txns) return 50;
    const total = txns.buys + txns.sells;
    if (total === 0) return 50;
    return Math.round((txns.buys / total) * 100);
};

const calculateSniperGemScore = (liquidity: number, volume: number, buyPressure: number): number => {
    let score = 50; // Start neutral

    // Liquidity Factor (0-30 points)
    // For a sniper, we want SOME liquidity but not necessarily millions (too late)
    if (liquidity > 50000) score += 30;
    else if (liquidity > 10000) score += 20;
    else if (liquidity > 2000) score += 10;
    else score -= 10; // Very low liquidity is risky

    // Volume Factor (0-30 points)
    // High volume relative to liquidity is good
    if (volume > liquidity * 0.5) score += 20;
    if (volume > 10000) score += 10;

    // Buy Pressure Factor (0-20 points)
    if (buyPressure > 70) score += 20;
    else if (buyPressure > 60) score += 10;
    else if (buyPressure < 40) score -= 10;

    // Cap at 95 (leave room for manual verification)
    return Math.min(95, Math.max(10, score));
};

const generateSniperAnalysis = (liquidity: number, volume: number, buyPressure: number, score: number) => {
    const strengths = [];
    const risks = [];

    if (liquidity > 10000) strengths.push("Solid Initial Liquidity");
    if (volume > 5000) strengths.push("Active Trading");
    if (buyPressure > 60) strengths.push("Bullish Buy Pressure");

    if (liquidity < 2000) risks.push("Low Liquidity (High Risk)");
    if (buyPressure < 40) risks.push("Selling Pressure");
    if (volume < 500) risks.push("Low Volume");

    let verdict = "Watchlist 👀";
    if (score > 80) verdict = "Potential Gem 💎";
    else if (score > 65) verdict = "Good Start 🚀";
    else if (score < 40) verdict = "High Risk ⚠️";

    return {
        strengths: strengths.join(", ") || "Fresh Launch",
        risks: risks.join(", ") || "Unknown Risks",
        verdict
    };
};
