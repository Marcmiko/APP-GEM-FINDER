
import React from 'react';
import { motion } from 'framer-motion';

interface Trader {
    rank: number;
    name: string;
    pnl: number;
    winRate: number;
    avatar: string;
}

// Mock Data
const MOCK_LEADERBOARD: Trader[] = [
    { rank: 1, name: "CryptoKing", pnl: 4520, winRate: 78, avatar: "👑" },
    { rank: 2, name: "BaseAlpha", pnl: 3100, winRate: 65, avatar: "🚀" },
    { rank: 3, name: "DiamondHands", pnl: 2850, winRate: 55, avatar: "💎" },
    { rank: 4, name: "DegenDave", pnl: 1200, winRate: 42, avatar: "🐸" },
    { rank: 5, name: "MoonSoon", pnl: 950, winRate: 48, avatar: "🌙" },
];

const Leaderboard: React.FC = () => {
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                🏆 Weekly Leaderboard
            </h3>
            <div className="space-y-3">
                {MOCK_LEADERBOARD.map((trader, index) => (
                    <motion.div
                        key={trader.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                index === 1 ? 'bg-gray-400/10 border-gray-400/30' :
                                    index === 2 ? 'bg-orange-700/10 border-orange-700/30' :
                                        'bg-slate-700/30 border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400 text-lg' :
                                    index === 1 ? 'text-gray-300' :
                                        index === 2 ? 'text-orange-400' :
                                            'text-slate-500'
                                }`}>#{trader.rank}</span>
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                                {trader.avatar}
                            </div>
                            <div>
                                <p className="font-bold text-white">{trader.name}</p>
                                <p className="text-xs text-slate-400">Win Rate: {trader.winRate}%</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-green-400">+${trader.pnl.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">PnL</p>
                        </div>
                    </motion.div>
                ))}
                <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">Ranks reset every Sunday at 00:00 UTC</p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
