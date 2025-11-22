import React, { useEffect, useState } from 'react';
import { useFantasy } from '../context/FantasyContext';
import { motion, AnimatePresence } from 'framer-motion';

const BattleArena: React.FC = () => {
    const { battleState, startBattle } = useFantasy();
    const { isActive, opponentName, timeLeft, playerScore, opponentScore } = battleState;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getScoreColor = (score: number) => {
        if (score > 0) return 'text-green-400';
        if (score < 0) return 'text-rose-400';
        return 'text-slate-400';
    };

    if (!isActive) {
        return (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                    <div className="text-6xl mb-4">⚔️</div>
                    <h2 className="text-3xl font-extrabold text-white mb-2">Battle Arena</h2>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Challenge <span className="text-indigo-400 font-bold">AlphaBot 9000</span> to a 5-minute trading duel.
                        Highest PnL wins!
                    </p>

                    <button
                        onClick={startBattle}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transform transition-all hover:scale-105 active:scale-95"
                    >
                        Start Battle
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 relative overflow-hidden">
            {/* Background Pulse Animation */}
            <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>

            {/* Header / Timer */}
            <div className="relative z-10 flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="text-red-400 font-bold tracking-wider text-sm uppercase">Live Battle</span>
                </div>
                <div className="text-4xl font-mono font-bold text-white tabular-nums">
                    {formatTime(timeLeft)}
                </div>
                <div className="text-slate-500 text-sm font-medium">
                    VS {opponentName}
                </div>
            </div>

            {/* Scores */}
            <div className="relative z-10 grid grid-cols-2 gap-8">
                {/* Player Side */}
                <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">You</div>
                    <div className={`text-4xl font-bold mb-1 ${getScoreColor(playerScore)}`}>
                        {playerScore > 0 ? '+' : ''}{playerScore.toFixed(2)}%
                    </div>
                    <div className="text-xs text-slate-500">Current PnL</div>
                </div>

                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 rounded-full border-4 border-slate-800 flex items-center justify-center font-black text-slate-600 italic z-20">
                    VS
                </div>

                {/* Opponent Side */}
                <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700/50 relative overflow-hidden">
                    {/* Glitch effect for bot */}
                    <div className="absolute inset-0 bg-red-500/5 opacity-20 animate-pulse"></div>

                    <div className="relative z-10">
                        <div className="text-sm text-slate-400 uppercase tracking-wider mb-2">{opponentName}</div>
                        <div className={`text-4xl font-bold mb-1 ${getScoreColor(opponentScore)}`}>
                            {opponentScore > 0 ? '+' : ''}{opponentScore.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-500">Bot PnL</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 mt-8">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 300, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default BattleArena;
