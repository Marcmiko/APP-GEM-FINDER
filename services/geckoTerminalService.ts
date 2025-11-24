
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

const mapGeckoTerminalPoolToToken = (pool: GeckoTerminalPool): Token => {
    const attr = pool.attributes;
    const baseTokenId = pool.relationships.base_token.data.id;
    const tokenAddress = baseTokenId.replace('base_', '');

    // Extract symbol from pool name (e.g., "HSS / WETH 838.861%")
    // Usually "SYMBOL / QUOTE ..."
    const nameParts = attr.name.split(' / ');
    const symbol = nameParts[0] || 'UNKNOWN';

    return {
        name: symbol, // We use symbol as name for now as GT doesn't give full name in this endpoint
        symbol: symbol,
        address: tokenAddress,
        pairAddress: attr.address,
        creationDate: attr.pool_created_at,
        liquidity: parseFloat(attr.reserve_in_usd) || 0,
        volume24h: parseFloat(attr.volume_usd.h24) || 0,
        marketCap: parseFloat(attr.fdv_usd) || 0,
        fdv: parseFloat(attr.fdv_usd) || 0,
        holders: 0,
        buyPressure: calculateBuyPressure(attr.transactions.h24),
        priceUsd: parseFloat(attr.base_token_price_usd) || 0,
        priceChange1h: parseFloat(attr.price_change_percentage.h1) || 0,
        priceChange24h: parseFloat(attr.price_change_percentage.h24) || 0,
        volume1h: parseFloat(attr.volume_usd.h1) || 0,
        isLiquidityLocked: false,
        isOwnershipRenounced: false,
        gemScore: 50, // Default score for new tokens
        analysis: {
            summary: `New pool on ${pool.relationships.dex.data.id}. Created at ${new Date(attr.pool_created_at).toLocaleTimeString()}.`,
            strengths: "Just Launched",
            risks: "High Volatility, Unverified",
            verdict: "Sniper Target 🎯",
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
