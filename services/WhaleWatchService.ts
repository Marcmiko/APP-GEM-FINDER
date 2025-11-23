import { searchDexScreener } from './dexScreenerService';

export interface WhaleAlert {
    id: string;
    tokenSymbol: string;
    tokenAddress: string;
    type: 'BUY' | 'SELL' | 'LIQUIDITY_ADD' | 'VOLUME_SPIKE';
    amountUsd: number;
    timestamp: number;
    message: string;
    pairAddress?: string;
    url?: string;
}

// Cache to avoid duplicate alerts for the same event
const alertCache = new Set<string>();

export const getWhaleAlerts = async (): Promise<WhaleAlert[]> => {
    try {
        // 1. Fetch trending/active pairs from DexScreener (using a broad search for "Base")
        // We search for common base tokens to get a list of active pairs
        const searchTerms = ["Base", "WETH", "USDC", "BRETT", "DEGEN", "TOSHI"];
        const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

        const pairs = await searchDexScreener(randomTerm);

        // Filter for Base chain only
        const basePairs = pairs.filter(p => p.chainId === 'base').slice(0, 20);

        const newAlerts: WhaleAlert[] = [];

        for (const pair of basePairs) {
            // Logic to detect "Whale" activity based on available aggregate data
            // Since we don't have individual tx stream, we look for high volume or recent spikes

            const volume1h = pair.volume?.h1 || 0;
            const liquidity = pair.liquidity?.usd || 0;
            const priceChange1h = pair.priceChange?.h1 || 0;
            const buys1h = pair.txns?.h1?.buys || 0;
            const sells1h = pair.txns?.h1?.sells || 0;

            // Thresholds for "Whale Activity"
            const HIGH_VOLUME_THRESHOLD = 10000; // $10k in 1h is decent for smaller gems
            const PRICE_SPIKE_THRESHOLD = 5; // 5% move in 1h

            // Generate unique ID for this potential alert state to prevent spamming same alert every minute
            // We use time bucket (every 10 mins) + pair address + type
            const timeBucket = Math.floor(Date.now() / (10 * 60 * 1000));

            if (volume1h > HIGH_VOLUME_THRESHOLD && buys1h > sells1h * 1.5) {
                const alertId = `${timeBucket}-${pair.pairAddress}-BUY_VOLUME`;
                if (!alertCache.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        tokenSymbol: pair.baseToken.symbol,
                        tokenAddress: pair.baseToken.address,
                        type: 'VOLUME_SPIKE',
                        amountUsd: volume1h,
                        timestamp: Date.now(), // We use current time as proxy for "recent"
                        message: `High Buy Volume: $${volume1h.toLocaleString()} in last hour! Bullish momentum detected.`,
                        pairAddress: pair.pairAddress,
                        url: pair.url
                    });
                    alertCache.add(alertId);
                }
            }

            if (priceChange1h > PRICE_SPIKE_THRESHOLD) {
                const alertId = `${timeBucket}-${pair.pairAddress}-PRICE_SPIKE`;
                if (!alertCache.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        tokenSymbol: pair.baseToken.symbol,
                        tokenAddress: pair.baseToken.address,
                        type: 'BUY',
                        amountUsd: volume1h, // approximate
                        timestamp: Date.now(),
                        message: `Price Spike: +${priceChange1h.toFixed(2)}% in 1h! Whale accumulation likely.`,
                        pairAddress: pair.pairAddress,
                        url: pair.url
                    });
                    alertCache.add(alertId);
                }
            }

            if (liquidity > 50000 && pair.fdv && pair.fdv < 500000) {
                const alertId = `${timeBucket}-${pair.pairAddress}-UNDERVALUED`;
                if (!alertCache.has(alertId)) {
                    newAlerts.push({
                        id: alertId,
                        tokenSymbol: pair.baseToken.symbol,
                        tokenAddress: pair.baseToken.address,
                        type: 'LIQUIDITY_ADD',
                        amountUsd: liquidity,
                        timestamp: Date.now(),
                        message: `High Liquidity ($${liquidity.toLocaleString()}) vs Low FDV ($${pair.fdv.toLocaleString()}). Potential Gem?`,
                        pairAddress: pair.pairAddress,
                        url: pair.url
                    });
                    alertCache.add(alertId);
                }
            }
        }

        // Keep cache size manageable
        if (alertCache.size > 100) {
            const it = alertCache.values();
            for (let i = 0; i < 20; i++) {
                alertCache.delete(it.next().value);
            }
        }

        return newAlerts;

    } catch (error) {
        console.error("Failed to fetch whale alerts:", error);
        return [];
    }
};
