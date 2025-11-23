import React, { useEffect, useState } from 'react';
import { Token } from '../types';
import { findSocialTrends } from '../services/geminiService';
import { motion } from 'framer-motion';
import TokenCard from './TokenCard';

const SentimentHeatmap: React.FC = () => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { tokens } = await findSocialTrends();
            // Sort by magnitude (stored in convictionScore) descending
            const sorted = tokens.sort((a, b) => (b.convictionScore || 0) - (a.convictionScore || 0));
            setTokens(sorted);
            setLoading(false);
        };
        fetchData();
    }, []);

    const getBlockColor = (sentiment: number) => {
        if (sentiment >= 80) return 'bg-emerald-500 hover:bg-emerald-400';
        if (sentiment >= 60) return 'bg-green-500 hover:bg-green-400';
        if (sentiment >= 40) return 'bg-slate-500 hover:bg-slate-400';
        if (sentiment >= 20) return 'bg-orange-500 hover:bg-orange-400';
        return 'bg-red-500 hover:bg-red-400';
    };

    const getBlockSize = (magnitude: number) => {
        if (magnitude >= 9) return 'col-span-2 row-span-2 text-2xl'; // Viral
        if (magnitude >= 7) return 'col-span-2 row-span-1 text-xl'; // High Hype
        if (magnitude >= 5) return 'col-span-1 row-span-1 text-lg'; // Moderate
        return 'col-span-1 row-span-1 text-sm'; // Low
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 animate-pulse">Analyzing Social Sentiment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-white mb-2">
                    Social Sentiment <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Heatmap</span> 🔥
                </h1>
                <p className="text-slate-400">
                    Visualizing real-time hype and sentiment on Twitter & Farcaster.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-[120px]">
                {tokens.map((token, index) => {
                    const sentiment = token.socialSentiment.positive;
                    const magnitude = token.convictionScore || 5;
                    const colorClass = getBlockColor(sentiment);
                    const sizeClass = getBlockSize(magnitude);

                    return (
                        <motion.div
                            key={token.address}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedToken(token)}
                            className={`${sizeClass} ${colorClass} rounded-2xl p-4 relative cursor-pointer transition-all duration-300 shadow-lg group overflow-hidden flex flex-col justify-between`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="relative z-10 flex justify-between items-start">
                                <span className="font-bold text-white drop-shadow-md">{token.symbol}</span>
                                <span className="text-xs font-medium bg-black/20 px-2 py-1 rounded-full text-white/90 backdrop-blur-sm">
                                    {sentiment}% Bullish
                                </span>
                            </div>

                            <div className="relative z-10">
                                <div className="text-white/90 font-medium text-sm">
                                    ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toFixed(2)}
                                </div>
                                <div className={`text-xs font-bold ${(token.priceChange24h || 0) >= 0 ? 'text-white' : 'text-white/80'}`}>
                                    {(token.priceChange24h || 0) > 0 ? '+' : ''}{(token.priceChange24h || 0).toFixed(2)}%
                                </div>
                            </div>

                            {/* Background Icon Faded */}
                            {token.iconUrl && (
                                <img
                                    src={token.iconUrl}
                                    alt={token.symbol}
                                    className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-500 grayscale group-hover:grayscale-0"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Token Detail Modal */}
            {selectedToken && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedToken(null)}>
                    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl" onClick={e => e.stopPropagation()}>
                        <TokenCard
                            token={selectedToken}
                            onSave={() => { }} // Dummy
                            isSaved={false}
                            onUnsave={() => { }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SentimentHeatmap;
