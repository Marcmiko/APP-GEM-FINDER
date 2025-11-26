// Multi-source price aggregator for Base tokens
// Tries multiple APIs to maximize price discovery

import { getTokenPrices } from './geckoTerminalService';
import { getPairsByAddress } from './dexScreenerService';

export async function getMultiSourcePrice(tokenAddress: string): Promise<number | null> {
    const address = tokenAddress.toLowerCase();

    // Try multiple sources in parallel
    // Try multiple sources in parallel
    // Prioritize GeckoTerminal and DexScreener for Base tokens
    const sources = [
        fetchGeckoTerminalPrice(address),
        fetchDexScreenerPrice(address),
        fetch1InchPrice(address),
        fetchCoinMarketCapPrice(address),
        fetchBirdeyePrice(address)
    ];

    const results = await Promise.allSettled(sources);

    // Return the first successful price
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value > 0) {
            return result.value;
        }
    }

    return null;
}

// 1inch Price Oracle (free API)
async function fetch1InchPrice(address: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://api.1inch.dev/price/v1.1/8453/${address}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data[address] ? parseFloat(data[address]) : null;
    } catch (error) {
        console.warn('1inch price fetch failed:', error);
        return null;
    }
}

// CoinMarketCap API (requires key but try anyway)
async function fetchCoinMarketCapPrice(address: string): Promise<number | null> {
    try {
        // Public endpoint (limited but works)
        const response = await fetch(
            `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/market-pairs/latest?slug=&category=spot&centerType=cex&sort=cmc_rank_advanced&direction=desc&start=1&limit=1&quoteCurrencyId=2781&address=${address}`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.data?.marketPairs?.[0]?.price || null;
    } catch (error) {
        return null;
    }
}

// Birdeye API (Solana-focused but has some Base data)
async function fetchBirdeyePrice(address: string): Promise<number | null> {
    try {
        const response = await fetch(
            `https://public-api.birdeye.so/public/price?address=${address}`
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data?.data?.value || null;
    } catch (error) {
        return null;
    }
}
// GeckoTerminal Wrapper
async function fetchGeckoTerminalPrice(address: string): Promise<number | null> {
    try {
        const prices = await getTokenPrices([address]);
        return prices[address.toLowerCase()] || null;
    } catch (error) {
        return null;
    }
}

// DexScreener Wrapper
async function fetchDexScreenerPrice(address: string): Promise<number | null> {
    try {
        const pairs = await getPairsByAddress([address]);
        if (pairs.length > 0) {
            // Return the price of the most liquid pair
            const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            return parseFloat(bestPair.priceUsd) || null;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Batch fetch prices for multiple tokens
// Batch fetch prices for multiple tokens
// Batch fetch prices for multiple tokens with robust fallback
export async function getMultiSourcePrices(addresses: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    // Strict validation of addresses
    const validAddresses = addresses.filter(addr =>
        addr &&
        addr !== 'undefined' &&
        addr.startsWith('0x')
    );

    console.log(`[MultiPrice] Starting fetch for ${validAddresses.length} valid tokens`);

    // 1. Try DexScreener (Primary Source - Supports CORS & Base)
    // DexScreener allows up to 30 addresses per call in theory, but we'll do individual or small batch
    // The user's snippet suggests individual calls or batch.
    // DexScreener API: GET https://api.dexscreener.com/latest/dex/tokens/addr1,addr2

    const BATCH_SIZE = 30;
    for (let i = 0; i < validAddresses.length; i += BATCH_SIZE) {
        const batch = validAddresses.slice(i, i + BATCH_SIZE);
        const batchStr = batch.join(',');

        try {
            console.log(`[MultiPrice] Fetching batch of ${batch.length} from DexScreener`);
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${batchStr}`);
            if (res.ok) {
                const data = await res.json();
                if (data.pairs && Array.isArray(data.pairs)) {
                    // DexScreener returns pairs, we need to find the best price for each token
                    batch.forEach(addr => {
                        const tokenPairs = data.pairs.filter((p: any) =>
                            p.baseToken.address.toLowerCase() === addr.toLowerCase()
                        );

                        if (tokenPairs.length > 0) {
                            // Sort by liquidity to get the most accurate price
                            tokenPairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                            const bestPair = tokenPairs[0];
                            const price = parseFloat(bestPair.priceUsd);
                            if (price > 0) {
                                prices[addr.toLowerCase()] = price;
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('[MultiPrice] DexScreener batch failed:', e);
        }
    }

    // 2. Fallback: GeckoTerminal for any missing
    const missing = validAddresses.filter(addr => !prices[addr.toLowerCase()]);
    if (missing.length > 0) {
        console.log(`[MultiPrice] Falling back to GeckoTerminal for ${missing.length} tokens`);
        try {
            const geckoPrices = await getTokenPrices(missing);
            Object.entries(geckoPrices).forEach(([addr, price]) => {
                if (price > 0) {
                    prices[addr.toLowerCase()] = price;
                }
            });
        } catch (e) {
            console.warn('[MultiPrice] GeckoTerminal fallback failed:', e);
        }
    }

    console.log(`[MultiPrice] Finished. Total prices found: ${Object.keys(prices).length}/${validAddresses.length}`);
    return prices;
}
