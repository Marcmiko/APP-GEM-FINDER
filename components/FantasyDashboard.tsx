
import React from 'react';
import { useFantasy } from '../context/FantasyContext';
import Leaderboard from './Leaderboard';
import { motion } from 'framer-motion';

const FantasyDashboard: React.FC = () => {
    const { balance, portfolio, history, portfolioValue, totalValue, resetAccount, sellToken } = useFantasy();

    const pnl = totalValue - 10000;
    const pnlPercent = (pnl / 10000) * 100;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm font-medium">Total Portfolio Value</p>
                    <h2 className="text-4xl font-bold text-white mt-2">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${pnl >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({pnlPercent.toFixed(2)}%)
                    </div>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm font-medium">Cash Balance</p>
                    <h2 className="text-3xl font-bold text-white mt-2">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <p className="text-xs text-slate-500 mt-2">Available to trade</p>
                </div>

                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-slate-400 text-sm font-medium">Your Rank</p>
                        <h2 className="text-3xl font-bold text-white mt-2">#42</h2>
                    </div>
                    <button
                        onClick={() => { if (confirm("Reset your fantasy account?")) resetAccount() }}
                        className="text-xs text-red-400 hover:text-red-300 underline self-start mt-2"
                    >
                        Reset Account
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Portfolio */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6">Your Positions</h3>

                        {portfolio.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <p>No active positions.</p>
                                <p className="text-sm mt-1">Go to Gem Finder to start trading!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {portfolio.map((pos) => {
                                    const currentValue = pos.amount * (pos.token.priceUsd || 0);
                                    const costBasis = pos.amount * pos.entryPrice;
                                    const posPnl = currentValue - costBasis;
                                    const posPnlPercent = (posPnl / costBasis) * 100;

                                    return (
                                        <div key={pos.token.address} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                {pos.token.iconUrl ? (
                                                    <img src={pos.token.iconUrl} alt={pos.token.symbol} className="w-10 h-10 rounded-full" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                                                        {pos.token.symbol[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-white">{pos.token.name}</h4>
                                                    <p className="text-xs text-slate-400">{pos.amount.toLocaleString()} {pos.token.symbol}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="font-bold text-white">${currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                                                    <p className={`text-xs ${posPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {posPnl >= 0 ? '+' : ''}{posPnlPercent.toFixed(2)}%
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => sellToken(pos.token.address, 100)}
                                                    className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                                                >
                                                    Sell
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                            {history.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${tx.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {tx.type}
                                        </span>
                                        <span className="text-slate-300">{tx.tokenSymbol}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-slate-400">${tx.amountUsd.toLocaleString()}</span>
                                        <span className="text-slate-600 text-xs block">{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-slate-500 text-sm">No transaction history.</p>}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Leaderboard */}
                <div className="lg:col-span-1">
                    <Leaderboard />
                </div>
            </div>
        </div>
    );
};

export default FantasyDashboard;
