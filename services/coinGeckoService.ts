
import { Token } from '../types';

const BASE_API_URL = 'https://api.coingecko.com/api/v3';

// CoinGecko Simple Token Interface
interface CoinGeckoToken {
    id: string;
    symbol: string;
    name: string;
    platforms: { [key: string]: string };
}

interface CoinGeckoMarketData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    market_cap: number;
    total_volume: number;
    price_change_percentage_24h: number;
    total_supply: number;
    circulating_supply: number;
    roi: null | any;
    last_updated: string;
}

export const searchCoinGecko = async (query: string): Promise<Token[]> => {
    try {
        // 1. Search for the token to get its ID
        const searchRes = await fetch(`${BASE_API_URL}/search?query=${encodeURIComponent(query)}`);
        if (!searchRes.ok) return [];

        const searchData = await searchRes.json();
        const coins = searchData.coins || [];

        // Filter for coins that are on Base (if possible, though search endpoint doesn't always show platforms easily)
        // We will take the top result and check its details
        if (coins.length === 0) return [];

        const topCoin = coins[0];

        // 2. Get detailed data for the top coin
        const detailRes = await fetch(`${BASE_API_URL}/coins/${topCoin.id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`);
        if (!detailRes.ok) return [];

        const details = await detailRes.json();

        // Check if it's on Base
        const baseAddress = details.platforms?.base;
        if (!baseAddress) {
            // Try to see if it's a multi-chain token that includes base
            // If not, we might skip it or return it with a warning.
            // For now, let's be strict: if no Base address, skip.
            return [];
        }

        return [{
            name: details.name,
            symbol: details.symbol.toUpperCase(),
            address: baseAddress,
            creationDate: details.genesis_date || new Date().toISOString(),
            liquidity: 0, // CoinGecko free API doesn't give pool liquidity easily
            volume24h: details.market_data?.total_volume?.usd || 0,
            marketCap: details.market_data?.market_cap?.usd || 0,
            holders: 0,
            isLiquidityLocked: false,
            isOwnershipRenounced: false,
            gemScore: 75, // Being on CoinGecko usually means it's more established
            analysis: {
                summary: details.description?.en?.split('.')[0] || "Listed on CoinGecko.",
                strengths: "Established tracking on CoinGecko.",
                risks: "Market volatility.",
                verdict: "Verified",
            },
            technicalIndicators: {
                rsi: null,
                macd: null,
                movingAverages: details.market_data?.price_change_percentage_24h ? `${details.market_data.price_change_percentage_24h}% (24h)` : null,
            },
            socialSentiment: {
                positive: details.sentiment_votes_up_percentage || 50,
                negative: details.sentiment_votes_down_percentage || 50,
                neutral: 0,
                summary: `Community Score: ${details.community_score}`
            },
            websiteUrl: details.links?.homepage?.[0] || null,
            xUrl: details.links?.twitter_screen_name ? `https://twitter.com/${details.links.twitter_screen_name}` : null,
            coinMarketCapUrl: null,
            coingeckoUrl: `https://www.coingecko.com/en/coins/${details.id}`,
            iconUrl: details.image?.large || details.image?.small || null,
            convictionScore: undefined,
            pairAddress: "", // Not available from CoinGecko simple API
            buyPressure: 50, // Default neutral
            priceUsd: details.market_data?.current_price?.usd || 0,
            telegramUrl: null,
            discordUrl: null
        }];

    } catch (error) {
        console.error("CoinGecko search error:", error);
        return [];
    }
};

export const getTrendingCoinGecko = async (): Promise<string[]> => {
    try {
        const res = await fetch(`${BASE_API_URL}/search/trending`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.coins.map((c: any) => c.item.name);
    } catch (e) {
        return [];
    }
}
