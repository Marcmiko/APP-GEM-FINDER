import React, { useState } from 'react';
import { Token } from '../types';
import AllocationChart from './AllocationChart';

interface PortfolioDashboardProps {
    savedTokens: Token[];
    onUpdateTokens: (tokens: Token[]) => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ savedTokens, onUpdateTokens }) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingToken, setEditingToken] = useState<Token | null>(null);
    const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>('');
    const [holdingsInput, setHoldingsInput] = useState('');
    const [avgPriceInput, setAvgPriceInput] = useState('');

    const holdings = savedTokens.filter(t => (t.holdings || 0) > 0);
    const availableTokens = savedTokens.filter(t => !t.holdings || t.holdings === 0);

    const totalValue = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * t.priceUsd), 0);
    const totalCost = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * (t.avgBuyPrice || 0)), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const handleEditClick = (token: Token) => {
        setEditingToken(token);
        setHoldingsInput(token.holdings?.toString() || '');
        setAvgPriceInput(token.avgBuyPrice?.toString() || '');
        setIsEditModalOpen(true);
    };

    const handleAddClick = () => {
        setSelectedTokenAddress(availableTokens[0]?.address || '');
        setHoldingsInput('');
        setAvgPriceInput('');
        setIsAddModalOpen(true);
    };

    const handleSaveHolding = () => {
        const targetAddress = editingToken ? editingToken.address : selectedTokenAddress;
        if (!targetAddress) return;

        const updatedTokens = savedTokens.map(t => {
            if (t.address === targetAddress) {
                return {
                    ...t,
                    holdings: parseFloat(holdingsInput) || 0,
                    avgBuyPrice: parseFloat(avgPriceInput) || 0
                };
            }
            return t;
        });

        onUpdateTokens(updatedTokens);
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        setEditingToken(null);
        setSelectedTokenAddress('');
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Balance</h3>
                    <div className="text-3xl font-bold text-white">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-slate-400 text-sm font-medium mb-1">Total Profit / Loss</h3>
                    <div className={`text-3xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        <span className="text-lg ml-2 opacity-80">
                            ({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex items-center justify-center">
                    <button
                        onClick={handleAddClick}
                        disabled={availableTokens.length === 0}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors w-full"
                    >
                        Add Asset
                    </button>
                </div>
            </div>

            {/* Allocation Chart */}
            <AllocationChart tokens={savedTokens} />

            {/* Holdings List */}
            <div id="holdings-list" className="bg-slate-800/30 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Your Assets</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-800/50 text-slate-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-medium">Asset</th>
                                <th className="px-6 py-4 font-medium text-right">Price</th>
                                <th className="px-6 py-4 font-medium text-right">Balance</th>
                                <th className="px-6 py-4 font-medium text-right">Value</th>
                                <th className="px-6 py-4 font-medium text-right">PnL</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {holdings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No assets in portfolio. Click "Add Asset" to start tracking.
                                    </td>
                                </tr>
                            ) : (
                                holdings.map(token => {
                                    const balance = token.holdings || 0;
                                    const value = balance * token.priceUsd;
                                    const cost = balance * (token.avgBuyPrice || 0);
                                    const pnl = value - cost;
                                    const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

                                    return (
                                        <tr key={token.address} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
                                                        {token.symbol[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{token.name}</div>
                                                        <div className="text-xs text-slate-500">{token.symbol}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-300">
                                                ${token.priceUsd.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="text-white font-medium">{balance.toLocaleString()}</div>
                                                {token.avgBuyPrice && (
                                                    <div className="text-xs text-slate-500">Avg: ${token.avgBuyPrice}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-white font-bold">
                                                ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className={pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                    {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                                                    <div className="text-xs opacity-70">${Math.abs(pnl).toFixed(2)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEditClick(token)}
                                                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Add Modal */}
            {(isEditModalOpen || isAddModalOpen) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold text-white mb-4">
                            {isEditModalOpen ? `Edit Holdings: ${editingToken?.symbol}` : 'Add Asset to Portfolio'}
                        </h3>

                        <div className="space-y-4">
                            {isAddModalOpen && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Select Token</label>
                                    <select
                                        value={selectedTokenAddress}
                                        onChange={(e) => setSelectedTokenAddress(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    >
                                        {availableTokens.map(t => (
                                            <option key={t.address} value={t.address}>
                                                {t.symbol} - {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Quantity Owned</label>
                                <input
                                    type="number"
                                    value={holdingsInput}
                                    onChange={(e) => setHoldingsInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Average Buy Price ($)</label>
                                <input
                                    type="number"
                                    value={avgPriceInput}
                                    onChange={(e) => setAvgPriceInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                    placeholder="0.0"
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-8">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setIsAddModalOpen(false);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveHolding}
                                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioDashboard;
