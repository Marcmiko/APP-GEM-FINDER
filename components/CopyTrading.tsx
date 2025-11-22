import React, { useState, useEffect } from 'react';
import { useFantasy, WHALE_PROFILES, WhaleProfile } from '../context/FantasyContext';
import { motion, AnimatePresence } from 'framer-motion';

const CopyTrading: React.FC = () => {
    const { followedWallets, toggleFollow } = useFantasy();
    const [recentTrades, setRecentTrades] = useState<{ id: string, whaleName: string, token: string, type: 'BUY' | 'SELL', profit?: number, time: number }[]>([]);

    // Simulate live feed
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const randomWhale = WHALE_PROFILES[Math.floor(Math.random() * WHALE_PROFILES.length)];
                const tokens = ["BRETT", "DEGEN", "TOSHI", "AERO", "MOG", "KEYCAT"];
                const type = Math.random() > 0.5 ? 'BUY' : 'SELL';

                const newTrade = {
                    id: Math.random().toString(36).substr(2, 9),
                    whaleName: randomWhale.name,
                    token: tokens[Math.floor(Math.random() * tokens.length)],
                    type: type as 'BUY' | 'SELL',
                    profit: type === 'SELL' ? Math.floor(Math.random() * 500) - 100 : undefined,
                    time: Date.now()
                };

                setRecentTrades(prev => [newTrade, ...prev].slice(0, 10));
            }
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Copy Trading <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Simulator</span> 👥
                </h1>
                <p className="text-slate-400">
                    Follow top performing wallets and automatically copy their trades in your fantasy portfolio.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Whale List */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        🏆 Top Traders
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {WHALE_PROFILES.map((whale) => (
                            <WhaleCard
                                key={whale.id}
                                whale={whale}
                                isFollowing={followedWallets.includes(whale.id)}
                                onToggle={() => toggleFollow(whale.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Live Feed */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-fit sticky top-24">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Live Activity
                    </h2>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        <AnimatePresence>
                            {recentTrades.map((trade) => (
                                <motion.div
                                    key={trade.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 text-sm"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-slate-200">{trade.whaleName}</span>
                                        <span className="text-xs text-slate-500">Just now</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${trade.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {trade.type}
                                        </span>
                                        <span className="text-slate-300">{trade.token}</span>
                                        {trade.profit !== undefined && (
                                            <span className={`ml-auto font-mono ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {trade.profit > 0 ? '+' : ''}{trade.profit}%
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {recentTrades.length === 0 && (
                                <div className="text-center text-slate-500 py-8">Waiting for activity...</div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WhaleCard: React.FC<{ whale: WhaleProfile, isFollowing: boolean, onToggle: () => void }> = ({ whale, isFollowing, onToggle }) => {
    return (
        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">{whale.avatar}</span>
            </div>

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl border-2 border-slate-600">
                        {whale.avatar}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">{whale.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">{whale.address}</p>
                    </div>
                </div>
                <button
                    onClick={onToggle}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${isFollowing
                            ? 'bg-slate-700 text-slate-300 hover:bg-red-500/20 hover:text-red-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                        }`}
                >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Win Rate</div>
                    <div className="text-green-400 font-bold">{whale.winRate}%</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">PnL</div>
                    <div className="text-indigo-400 font-bold">+${(whale.pnl / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Followers</div>
                    <div className="text-slate-300 font-bold">{whale.followers}</div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 relative z-10">
                {whale.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-slate-700/50 text-xs text-slate-400 border border-slate-600/50">
                        #{tag}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default CopyTrading;
