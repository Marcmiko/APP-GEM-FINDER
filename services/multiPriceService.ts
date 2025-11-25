// Multi-source price aggregator for Base tokens
// Tries multiple APIs to maximize price discovery

export async function getMultiSourcePrice(tokenAddress: string): Promise<number | null> {
    const address = tokenAddress.toLowerCase();

    // Try multiple sources in parallel
    const sources = [
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

// Batch fetch prices for multiple tokens
export async function getMultiSourcePrices(addresses: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    // Fetch in parallel (limit concurrency to avoid rate limits)
    const BATCH_SIZE = 5;
    for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
        const batch = addresses.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(async (addr) => {
                const price = await getMultiSourcePrice(addr);
                return { addr: addr.toLowerCase(), price };
            })
        );

        results.forEach(({ addr, price }) => {
            if (price && price > 0) {
                prices[addr] = price;
            }
        });
    }

    return prices;
}
