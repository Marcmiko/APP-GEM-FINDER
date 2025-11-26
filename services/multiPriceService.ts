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
    const missingAddresses: string[] = [];

    console.log(`[MultiPrice] Starting fetch for ${addresses.length} tokens`);

    // 1. Try Batch Fetching (GeckoTerminal is best for batch)
    try {
        console.log('[MultiPrice] Step 1: GeckoTerminal Batch');
        const geckoPrices = await getTokenPrices(addresses);
        Object.entries(geckoPrices).forEach(([addr, price]) => {
            if (price > 0) {
                prices[addr.toLowerCase()] = price;
            }
        });
        console.log(`[MultiPrice] GeckoTerminal found ${Object.keys(geckoPrices).length} prices`);
    } catch (e) {
        console.warn('[MultiPrice] Batch GeckoTerminal fetch failed:', e);
    }

    // Identify missing
    addresses.forEach(addr => {
        if (!prices[addr.toLowerCase()]) {
            missingAddresses.push(addr);
        }
    });

    // 2. Try Moralis (if key is present)
    if (missingAddresses.length > 0) {
        console.log(`[MultiPrice] Step 2: Moralis for ${missingAddresses.length} missing tokens`);
        try {
            // Dynamic import to avoid issues if service is not perfect yet
            const { getMoralisTokenPrices } = await import('./moralisService');
            const moralisPrices = await getMoralisTokenPrices(missingAddresses);

            let moralisCount = 0;
            Object.entries(moralisPrices).forEach(([addr, price]) => {
                if (price > 0) {
                    prices[addr.toLowerCase()] = price;
                    moralisCount++;
                    // Remove from missing
                    const index = missingAddresses.indexOf(addr);
                    if (index > -1) {
                        missingAddresses.splice(index, 1);
                    }
                }
            });
            console.log(`[MultiPrice] Moralis found ${moralisCount} prices`);
        } catch (e) {
            console.warn('[MultiPrice] Moralis fetch failed:', e);
        }
    }

    // 3. Individual Fallback for missing tokens
    if (missingAddresses.length > 0) {
        console.log(`[MultiPrice] Step 3: Individual Fallback for ${missingAddresses.length} tokens...`);

        // Process in parallel with concurrency limit
        const BATCH_SIZE = 5;
        for (let i = 0; i < missingAddresses.length; i += BATCH_SIZE) {
            const batch = missingAddresses.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (addr) => {
                let price = null;

                // Try DexScreener first (best for memes)
                if (!price) {
                    price = await fetchDexScreenerPrice(addr);
                    if (price) console.log(`[MultiPrice] DexScreener found price for ${addr}`);
                }

                // Then CoinGecko (reliable for majors)
                if (!price) {
                    price = await fetchCoinMarketCapPrice(addr);
                    if (price) console.log(`[MultiPrice] CMC found price for ${addr}`);
                }

                // Then 1inch (Oracle)
                if (!price) {
                    price = await fetch1InchPrice(addr);
                    if (price) console.log(`[MultiPrice] 1inch found price for ${addr}`);
                }

                // Then Birdeye
                if (!price) {
                    price = await fetchBirdeyePrice(addr);
                    if (price) console.log(`[MultiPrice] Birdeye found price for ${addr}`);
                }

                if (price && price > 0) {
                    prices[addr.toLowerCase()] = price;
                }
            }));
        }
    }

    // 4. Last Resort: BaseScan Scraper (if available)
    const stillMissing = addresses.filter(addr => !prices[addr.toLowerCase()]);
    if (stillMissing.length > 0) {
        console.log(`[MultiPrice] Step 4: BaseScan Scraper for ${stillMissing.length} tokens`);
        try {
            // Dynamic import to avoid circular deps if any
            const { getBasescanPrices } = await import('./basescanService');
            const scrapedPrices = await getBasescanPrices(stillMissing);
            Object.entries(scrapedPrices).forEach(([addr, price]) => {
                if (price && typeof price === 'number' && price > 0) {
                    prices[addr.toLowerCase()] = price;
                    console.log(`[MultiPrice] BaseScan found price for ${addr}`);
                }
            });
        } catch (e) {
            console.warn('[MultiPrice] BaseScan fallback failed:', e);
        }
    }

    console.log(`[MultiPrice] Finished. Total prices found: ${Object.keys(prices).length}/${addresses.length}`);
    return prices;
}
