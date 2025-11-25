import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import PortfolioCharts from './PortfolioCharts';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { formatUnits, parseAbi } from 'viem';
import { useAlerts } from '../context/AlertContext';
import { POPULAR_BASE_TOKENS } from '../data/popularTokens';
import { getTokenPrices } from '../services/geckoTerminalService';

interface PortfolioDashboardProps {
    savedTokens: Token[];
    onUpdateTokens: (tokens: Token[]) => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ savedTokens, onUpdateTokens }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { addAlert } = useAlerts();

    // Filter out tokens with 0 holdings for display
    const holdings = savedTokens.filter(t => (t.holdings || 0) > 0);

    const totalValue = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * (t.priceUsd || 0)), 0);

    const handleSyncWallet = async () => {
        if (!isConnected || !address || !publicClient) {
            addAlert('Please connect your wallet first!', 'warning');
            return;
        }

        setIsSyncing(true);
        setSyncProgress(10);
        addAlert('Scanning wallet for assets...', 'info');

        try {
            // 1. Combine Saved Tokens + Popular Tokens (deduplicate by address)
            const tokenMap = new Map<string, Partial<Token>>();

            // Add saved tokens first
            savedTokens.forEach(t => {
                if (t.address) tokenMap.set(t.address.toLowerCase(), t);
            });

            // Add popular tokens if not present
            POPULAR_BASE_TOKENS.forEach(t => {
                if (t.address && !tokenMap.has(t.address.toLowerCase())) {
                    tokenMap.set(t.address.toLowerCase(), t);
                }
            });

            const allTokensToScan = Array.from(tokenMap.values()) as Token[]; // Cast to Token[] as we expect them to have basic fields
            setSyncProgress(30);

            // 2. Fetch ETH Balance
            const ethBalance = await publicClient.getBalance({ address });
            const ethBalanceFormatted = parseFloat(formatUnits(ethBalance, 18));

            // 3. Fetch Token Balances (Multicall)
            // Filter out ETH placeholder if it exists in scan list to avoid double counting or error
            const erc20Tokens = allTokensToScan.filter(t => t.symbol !== 'ETH' && t.address);

            const calls = erc20Tokens.map(token => ({
                address: token.address as `0x${string}`,
                abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
                functionName: 'balanceOf',
                args: [address]
            }));

            const results = await publicClient.multicall({ contracts: calls } as any);
            setSyncProgress(60);

            // 4. Process Balances & Identify Held Tokens
            const heldTokens: Token[] = [];
            const addressesToFetchPrice: string[] = [];

            // Add ETH if balance > 0
            if (ethBalanceFormatted > 0) {
                const ethToken = tokenMap.get('0x4200000000000000000000000000000000000006'.toLowerCase()) || {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    address: '0x4200000000000000000000000000000000000006',
                    decimals: 18
                };

                heldTokens.push({
                    ...ethToken,
                    holdings: ethBalanceFormatted,
                    priceUsd: ethToken.priceUsd || 0, // Will fetch update
                    // Defaults for required Token fields
                    chainId: 8453,
                    pairAddress: '',
                    creationDate: new Date().toISOString(),
                    liquidity: 0,
                    volume24h: 0,
                    marketCap: 0,
                    fdv: 0,
                    holders: 0,
                    buyPressure: 50,
                    priceChange1h: 0,
                    priceChange24h: 0,
                    volume1h: 0,
                    isLiquidityLocked: false,
                    isOwnershipRenounced: false,
                    gemScore: 0,
                    analysis: { summary: 'Native Token', strengths: '', risks: '', verdict: 'Hold' },
                    technicalIndicators: { rsi: null, macd: null, movingAverages: null },
                    socialSentiment: { positive: 0, negative: 0, neutral: 100, summary: '' },
                    links: { website: null, twitter: null, telegram: null, discord: null, coinmarketcap: null, coingecko: null },
                    securityChecks: { renouncedOwnership: false, liquidityLocked: false, noMintFunction: false, noBlacklist: false, noProxy: false },
                    websiteUrl: null, xUrl: null, telegramUrl: null, discordUrl: null, coinMarketCapUrl: null, coingeckoUrl: null, iconUrl: null
                } as Token);

                addressesToFetchPrice.push(ethToken.address!);
            }

            // Process ERC20s
            results.forEach((result, index) => {
                if (result.status === 'success') {
                    const token = erc20Tokens[index];
                    const balance = parseFloat(formatUnits(result.result as bigint, token.decimals || 18));

                    if (balance > 0) {
                        heldTokens.push({
                            ...token,
                            holdings: balance,
                            priceUsd: token.priceUsd || 0, // Will fetch update
                            // Defaults
                            chainId: 8453,
                            pairAddress: '',
                            creationDate: new Date().toISOString(),
                            liquidity: 0,
                            volume24h: 0,
                            marketCap: 0,
                            fdv: 0,
                            holders: 0,
                            buyPressure: 50,
                            priceChange1h: 0,
                            priceChange24h: 0,
                            volume1h: 0,
                            isLiquidityLocked: false,
                            isOwnershipRenounced: false,
                            gemScore: 0,
                            analysis: { summary: 'Wallet Asset', strengths: '', risks: '', verdict: 'Hold' },
                            technicalIndicators: { rsi: null, macd: null, movingAverages: null },
                            socialSentiment: { positive: 0, negative: 0, neutral: 100, summary: '' },
                            links: { website: null, twitter: null, telegram: null, discord: null, coinmarketcap: null, coingecko: null },
                            securityChecks: { renouncedOwnership: false, liquidityLocked: false, noMintFunction: false, noBlacklist: false, noProxy: false },
                            websiteUrl: null, xUrl: null, telegramUrl: null, discordUrl: null, coinMarketCapUrl: null, coingeckoUrl: null, iconUrl: null
                        } as Token);

                        if (token.address) addressesToFetchPrice.push(token.address);
                    }
                }
            });

            setSyncProgress(80);

            // 5. Fetch Prices
            if (addressesToFetchPrice.length > 0) {
                const prices = await getTokenPrices(addressesToFetchPrice);

                // Update prices in heldTokens
                heldTokens.forEach(t => {
                    if (t.address && prices[t.address.toLowerCase()]) {
                        t.priceUsd = prices[t.address.toLowerCase()];
                    } else if (t.symbol === 'ETH' && prices['0x4200000000000000000000000000000000000006']) {
                        // Special case for ETH if address casing mismatch
                        t.priceUsd = prices['0x4200000000000000000000000000000000000006'];
                    }
                });
            }

            // 6. Merge with existing saved tokens (preserve existing data if not in heldTokens, update if in heldTokens)
            // Actually, we want to SHOW what's in the wallet.
            // But we also want to keep "watched" tokens (0 balance).

            const newSavedTokens = [...savedTokens];

            // Update existing tokens with new holdings/prices
            heldTokens.forEach(heldToken => {
                const existingIndex = newSavedTokens.findIndex(t => t.address?.toLowerCase() === heldToken.address?.toLowerCase());
                if (existingIndex >= 0) {
                    newSavedTokens[existingIndex] = {
                        ...newSavedTokens[existingIndex],
                        holdings: heldToken.holdings,
                        priceUsd: heldToken.priceUsd
                    };
                } else {
                    // Add new token found in wallet
                    newSavedTokens.push(heldToken);
                }
            });

            // Reset holdings for tokens NOT found in wallet (but were previously saved)?
            // If we did a full scan, yes. But we only scanned "popular" + "saved".
            // So if a token was saved and we scanned it and found 0, we should set 0.
            // Our 'erc20Tokens' list included ALL saved tokens. So if it's not in 'heldTokens' (and was in saved), it means balance is 0.

            newSavedTokens.forEach(t => {
                const wasScanned = erc20Tokens.some(s => s.address?.toLowerCase() === t.address?.toLowerCase());
                const isHeld = heldTokens.some(h => h.address?.toLowerCase() === t.address?.toLowerCase());

                if (wasScanned && !isHeld && t.symbol !== 'ETH') {
                    t.holdings = 0;
                }
            });

            onUpdateTokens(newSavedTokens);
            setSyncProgress(100);
            addAlert(`Wallet synced! Found ${heldTokens.length} assets.`, 'success');

        } catch (error) {
            console.error('Error syncing wallet:', error);
            addAlert('Failed to sync wallet.', 'error');
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncProgress(0), 1000);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 p-6 rounded-2xl border border-indigo-500/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-indigo-400">
                            <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                            <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                            <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                        </svg>
                    </div>
                    <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Balance</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="mt-4">
                        <button
                            onClick={handleSyncWallet}
                            disabled={isSyncing || !isConnected}
                            className={`w-full py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                                ${isConnected
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Scanning... {syncProgress}%
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                                    </svg>
                                    Sync Wallet
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <PortfolioCharts tokens={savedTokens} totalValue={totalValue} />
                </div>
            </div>

            {/* Assets Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Your Assets</h3>
                    <span className="text-sm text-slate-400">{holdings.length} tokens found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-900/50 text-left">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Asset</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {holdings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        {isSyncing ? 'Scanning blockchain...' : 'No assets found. Connect wallet and sync.'}
                                    </td>
                                </tr>
                            ) : (
                                holdings.map((token, idx) => {
                                    const value = (token.holdings || 0) * (token.priceUsd || 0);
                                    return (
                                        <tr key={token.address || idx} className="hover:bg-slate-700/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mr-3 border border-indigo-500/30">
                                                        {token.iconUrl ? (
                                                            <img src={token.iconUrl} alt={token.symbol} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            token.symbol?.substring(0, 2)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{token.name}</div>
                                                        <div className="text-xs text-slate-400">{token.symbol}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                                                ${token.priceUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300 font-mono">
                                                {token.holdings?.toLocaleString()} {token.symbol}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-white">
                                                ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PortfolioDashboard;
