
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
    // We'll use a generic search or specific tokens to seed the "alerts"
    const pairs = await searchDexScreener("Base"); // Broad search to get some pairs

    if (!pairs || pairs.length === 0) return [];

    const alerts: WhaleAlert[] = [];

    // 2. Analyze pairs for "Whale" activity (Simulated based on real aggregate stats)
    pairs.forEach(pair => {
        // Logic: If volume is high, simulate a recent "Big Buy"
        if (pair.volume?.h24 > 50000) {
            // Create a "Buy" alert
            if (Math.random() > 0.5) { // Randomize so it's not every token every time
                const amount = Math.floor(Math.random() * 50000) + 10000; // $10k - $60k
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
        if (pair.liquidity?.usd > 200000 && Math.random() > 0.8) {
            const amount = Math.floor(Math.random() * 100000) + 50000;
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
        if (pair.volume?.h1 > 10000 && Math.random() > 0.7) {
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

    // Sort by timestamp descending
    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20); // Return top 20
};
