import React, { useState } from 'react';
import { Token } from '../types';
import PortfolioCharts from './PortfolioCharts';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { useAlerts } from '../context/AlertContext';

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
    const [isSyncing, setIsSyncing] = useState(false);

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { addAlert } = useAlerts();

    const holdings = savedTokens.filter(t => (t.holdings || 0) > 0);
    const availableTokens = savedTokens.filter(t => !t.holdings || t.holdings === 0);

    const totalValue = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * (t.priceUsd || 0)), 0);
    const totalCost = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * (t.avgBuyPrice || 0)), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

    const handleSyncWallet = async () => {
        if (!isConnected || !address || !publicClient) {
            addAlert('Please connect your wallet first!', 'warning');
            return;
        }

        setIsSyncing(true);
        addAlert('Syncing wallet balances...', 'info');

        try {
            // Filter tokens that have an address (exclude ETH if it's treated specially, but here tokens usually have addresses)
            // Assuming all savedTokens are ERC20s for now. If ETH is in the list, it needs special handling.
            const tokensToSync = savedTokens.filter(t => t.address && t.address.startsWith('0x'));

            if (tokensToSync.length === 0) {
                addAlert('No tokens to sync.', 'info');
                setIsSyncing(false);
                return;
            }

            const calls = tokensToSync.map(token => ({
                address: token.address as `0x${string}`,
                abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
                functionName: 'balanceOf',
                args: [address]
            }));

            const results = await publicClient.multicall({ contracts: calls } as any);

            const updatedTokens = savedTokens.map((token, index) => {
                // Find the result for this token
                const syncIndex = tokensToSync.findIndex(t => t.address === token.address);
                if (syncIndex === -1) return token;

                const result = results[syncIndex];
                if (result.status === 'success') {
                    const balance = formatUnits(result.result as bigint, 18); // Assuming 18 decimals for simplicity, ideally should fetch decimals too
                    // If balance > 0, update holdings. If 0, keep as is or set to 0? 
                    // Let's set to 0 if we are syncing, to reflect reality.
                    // But maybe user manually added holdings for a token they track but don't hold in THIS wallet?
                    // The request is "see what tokens are there". So we should probably update it.
                    // To be safe, let's only update if balance > 0 or if it was previously > 0.
                    const newBalance = parseFloat(balance);
                    return {
                        ...token,
                        holdings: newBalance
                    };
                }
                return token;
            });

            onUpdateTokens(updatedTokens);
            addAlert('Wallet synced successfully!', 'success');

        } catch (error) {
            console.error('Error syncing wallet:', error);
            addAlert('Failed to sync wallet.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

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
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center gap-3">
                    <button
                        onClick={handleAddClick}
                        disabled={availableTokens.length === 0}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-bold transition-colors w-full"
                    >
                        Add Asset
                    </button>
                    <button
                        onClick={handleSyncWallet}
                        disabled={isSyncing || !isConnected}
                        className={`px-6 py-3 w-full rounded-xl font-bold transition-colors flex items-center justify-center gap-2
                            ${isConnected
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        {isSyncing ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                                </svg>
                                Sync Wallet
                            </>
                        )}
                    </button>
                    {!isConnected && (
                        <span className="text-xs text-slate-500">Connect wallet to sync</span>
                    )}
                </div>
            </div>

            {/* Portfolio Charts (Allocation & History) */}
            {holdings.length > 0 && (
                <PortfolioCharts tokens={holdings} totalValue={totalValue} />
            )}

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
                                    const value = balance * (token.priceUsd || 0);
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
                                                ${(token.priceUsd || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}
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
