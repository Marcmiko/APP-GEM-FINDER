
import { searchDexScreener, DexScreenerPair } from './dexScreenerService';

export interface WhaleAlert {
    id: string;
    tokenName: string;
    tokenSymbol: string;
    type: 'BUY' | 'SELL' | 'LIQUIDITY_ADD' | 'VOLUME_SPIKE';
    amountUsd: number;
    timestamp: number;
    pairAddress: string;
    message: string;
}

// Mock "Whale" names or addresses for flavor
const WHALE_NAMES = [
    "0x7a...3f21", "BaseGod", "ChadTrader", "0xDe...adBe", "SmartMoney", "DeepPockets", "0x12...90AB"
];

const generateRandomWhaleName = () => WHALE_NAMES[Math.floor(Math.random() * WHALE_NAMES.length)];

export const getWhaleAlerts = async (): Promise<WhaleAlert[]> => {
    // 1. Fetch trending/recent pairs from DexScreener to get real data
    // Search for multiple popular tokens to ensure we get a good mix of pairs
    // Append "Base" to ensure we get pairs on the right chain
    const queries = ["Base", "WETH Base", "USDC Base", "BRETT", "DEGEN", "TOSHI"];
    let pairs: DexScreenerPair[] = [];

    for (const q of queries) {
        const res = await searchDexScreener(q);
        if (res) pairs = [...pairs, ...res];
    }

    // Remove duplicates
    pairs = pairs.filter((pair, index, self) =>
        index === self.findIndex((t) => (
            t.pairAddress === pair.pairAddress
        ))
    );

    console.log(`WhaleWatch: Found ${pairs.length} pairs after search and filter.`);

    if (!pairs || pairs.length === 0) {
        console.warn("WhaleWatch: No pairs found.");
        return [];
    }

    const alerts: WhaleAlert[] = [];

    // 2. Analyze pairs for "Whale" activity (Simulated based on real aggregate stats)
    pairs.forEach(pair => {
        // Logic: If volume is high, simulate a recent "Big Buy"
        // Lowered threshold to 10k for more activity
        if (pair.volume?.h24 > 10000) {
            // Create a "Buy" alert
            // Increased probability to 70%
            if (Math.random() > 0.3) {
                const amount = Math.floor(Math.random() * 50000) + 5000; // $5k - $55k
                alerts.push({
                    id: Math.random().toString(36).substr(2, 9),
                    tokenName: pair.baseToken.name,
                    tokenSymbol: pair.baseToken.symbol,
                    type: 'BUY',
                    amountUsd: amount,
                    timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60), // Within last hour
                    pairAddress: pair.pairAddress,
                    message: `🐋 Whale (${generateRandomWhaleName()}) bought $${(amount / 1000).toFixed(1)}k of ${pair.baseToken.symbol}!`
                });
            }
        }

        // Logic: If liquidity is huge, maybe a "Liquidity Add"
        // Lowered threshold to 50k
        if (pair.liquidity?.usd > 50000 && Math.random() > 0.7) {
            const amount = Math.floor(Math.random() * 50000) + 10000;
            alerts.push({
                id: Math.random().toString(36).substr(2, 9),
                tokenName: pair.baseToken.name,
                tokenSymbol: pair.baseToken.symbol,
                type: 'LIQUIDITY_ADD',
                amountUsd: amount,
                timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 2), // Within last 2 hours
                pairAddress: pair.pairAddress,
                message: `💧 Massive Liquidity Add: $${(amount / 1000).toFixed(1)}k added to ${pair.baseToken.symbol} pool.`
            });
        }

        // Logic: Volume Spike
        // Lowered threshold to 5k
        if (pair.volume?.h1 > 5000 && Math.random() > 0.6) {
            alerts.push({
                id: Math.random().toString(36).substr(2, 9),
                tokenName: pair.baseToken.name,
                tokenSymbol: pair.baseToken.symbol,
                type: 'VOLUME_SPIKE',
                amountUsd: pair.volume.h1,
                timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 15), // Last 15 mins
                pairAddress: pair.pairAddress,
                message: `📈 Volume Spike! ${pair.baseToken.symbol} traded $${(pair.volume.h1 / 1000).toFixed(1)}k in the last hour.`
            });
        }
    });

    // Fail-safe: If no alerts generated (e.g. API issues), add some simulated ones
    if (alerts.length === 0) {
        console.warn("WhaleWatch: No alerts generated from live data. Using fallback.");
        const fallbackTokens = ["BRETT", "DEGEN", "TOSHI", "AERO"];
        fallbackTokens.forEach(symbol => {
            const amount = Math.floor(Math.random() * 20000) + 5000;
            alerts.push({
                id: Math.random().toString(36).substr(2, 9),
                tokenName: symbol,
                tokenSymbol: symbol,
                type: 'BUY',
                amountUsd: amount,
                timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 30),
                pairAddress: '0x0000000000000000000000000000000000000000',
                message: `🐋 Whale (${generateRandomWhaleName()}) bought $${(amount / 1000).toFixed(1)}k of ${symbol}!`
            });
        });
    }

    // Sort by timestamp descending
    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20); // Return top 20
};
