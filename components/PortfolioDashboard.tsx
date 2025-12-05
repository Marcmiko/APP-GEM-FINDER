import React, { useState, useEffect, useMemo } from 'react';
import { Token } from '../types';
import PortfolioCharts from './PortfolioCharts';
import PortfolioMetrics from './PortfolioMetrics';
import PortfolioFilters, { applyFiltersAndSort, SortOption, FilterOption } from './PortfolioFilters';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { useAlerts } from '../context/AlertContext';
import { getMultiSourcePrices } from '../services/multiPriceService';
import { usePriceCache } from '../hooks/usePriceCache';
import { calculatePortfolioMetrics, calculateTokenMetrics, formatCurrency, formatPercent, getChangeColor } from '../utils/portfolioCalculations';


interface PortfolioDashboardProps {
    walletTokens: Token[];
    onWalletSync: (tokens: Token[]) => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ walletTokens, onWalletSync }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<number | null>(null);

    // Filters & Sort
    const [sortBy, setSortBy] = useState<SortOption>('value');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { addAlert } = useAlerts();
    const priceCache = usePriceCache({ ttl: 30000 }); // 30s cache

    // Filter out tokens with 0 holdings for display
    const holdings = walletTokens.filter(t => (t.holdings || 0) > 0);

    // Apply filters and sorting
    const filteredHoldings = useMemo(() => {
        return applyFiltersAndSort(holdings, sortBy, filterBy, searchQuery);
    }, [holdings, sortBy, filterBy, searchQuery]);

    // Calculate metrics
    const metrics = useMemo(() => {
        return calculatePortfolioMetrics(holdings);
    }, [holdings]);

    const totalValue = metrics.totalValue;

    const handleSyncWallet = async () => {
        if (!isConnected || !address || !publicClient) {
            addAlert('Please connect your wallet first!', 'warning');
            return;
        }

        setIsSyncing(true);
        setSyncProgress(10);
        addAlert('Scanning wallet for all tokens...', 'info');

        try {
            // 1. Fetch ALL tokens from Blockscout API
            setSyncProgress(20);
            const blockscoutResponse = await fetch(`https://base.blockscout.com/api/v2/addresses/${address}/tokens?type=ERC-20`);

            if (!blockscoutResponse.ok) {
                throw new Error('Failed to fetch tokens from Blockscout');
            }

            const blockscoutData = await blockscoutResponse.json();
            setSyncProgress(40);

            // 2. Fetch ETH Balance
            const ethBalance = await publicClient.getBalance({ address });
            const ethBalanceFormatted = parseFloat(formatUnits(ethBalance, 18));

            // 3. Process discovered tokens
            const heldTokens: Token[] = [];
            const addressesToFetchPrice: string[] = [];

            // Add ETH if balance > 0
            if (ethBalanceFormatted > 0) {
                heldTokens.push({
                    name: 'Ethereum',
                    symbol: 'ETH',
                    address: '0x4200000000000000000000000000000000000006',
                    holdings: ethBalanceFormatted,
                    priceUsd: 0,
                    decimals: 18,
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

                addressesToFetchPrice.push('0x4200000000000000000000000000000000000006');
            }

            setSyncProgress(60);

            // Process ERC20 tokens from Blockscout
            if (blockscoutData.items && Array.isArray(blockscoutData.items)) {
                blockscoutData.items.forEach((item: any) => {
                    if (item.token && item.value && parseFloat(item.value) > 0) {
                        const token = item.token;
                        const balance = parseFloat(formatUnits(BigInt(item.value), parseInt(token.decimals) || 18));

                        // Debug log
                        console.log(`Found token: ${token.symbol} (${token.address}), Balance: ${balance}`);

                        if (balance > 0) {
                            heldTokens.push({
                                name: token.name || token.symbol || 'Unknown',
                                symbol: token.symbol || '???',
                                address: token.address,
                                holdings: balance,
                                priceUsd: 0,
                                decimals: parseInt(token.decimals) || 18,
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
                                websiteUrl: null,
                                xUrl: null,
                                telegramUrl: null,
                                discordUrl: null,
                                coinMarketCapUrl: null,
                                coingeckoUrl: null,
                                iconUrl: token.icon_url || null
                            } as Token);

                            if (token.address && typeof token.address === 'string') {
                                addressesToFetchPrice.push(token.address);
                            }
                        }
                    }
                });
            }

            setSyncProgress(80);

            // 4. Fetch prices using multi-source service
            if (addressesToFetchPrice.length > 0) {
                try {
                    console.log('📊 Fetching prices for', addressesToFetchPrice.length, 'tokens...');
                    const prices = await getMultiSourcePrices(addressesToFetchPrice);

                    let pricesUpdated = 0;
                    heldTokens.forEach(t => {
                        const addr = t.address.toLowerCase();
                        // Handle ETH special case if needed, but service should handle it
                        // or map 0x42...06 to ETH price

                        const price = prices[addr];
                        if (price && price > 0) {
                            t.priceUsd = price;
                            pricesUpdated++;
                            console.log(`✅ ${t.symbol}: $${t.priceUsd.toFixed(6)}`);
                        } else {
                            console.warn(`❌ No price for ${t.symbol} (${t.address})`);
                        }
                    });

                    console.log(`📈 Updated ${pricesUpdated}/${heldTokens.length} token prices`);

                    if (pricesUpdated === 0) {
                        addAlert('Warning: Unable to fetch any token prices', 'error');
                    } else if (pricesUpdated < heldTokens.length) {
                        addAlert(`Prices found for ${pricesUpdated}/${heldTokens.length} tokens`, 'info');
                    }
                } catch (priceError) {
                    console.error('❌ Price fetching completely failed:', priceError);
                    addAlert('Error fetching prices. Please try again.', 'error');
                }
            }

            console.log('=== WALLET SYNC DEBUG ===');
            console.log('Tokens found:', heldTokens.length);
            console.log('Tokens with holdings > 0:', heldTokens.filter(t => t.holdings > 0).length);
            console.log('Tokens with prices > 0:', heldTokens.filter(t => (t.priceUsd || 0) > 0).length);
            console.log('Total value:', heldTokens.reduce((sum, t) => sum + ((t.holdings || 0) * (t.priceUsd || 0)), 0).toFixed(2));
            console.log('All held tokens:', heldTokens);
            console.log('=========================');

            onWalletSync(heldTokens);
            setSyncProgress(100);
            setLastUpdate(Date.now()); // Set last update timestamp
            addAlert(`Wallet synced! Found ${heldTokens.length} assets.`, 'success');

        } catch (error) {
            console.error('Error syncing wallet:', error);
            addAlert(`Failed to sync wallet: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncProgress(0), 1000);
        }
    };

    // Auto-sync when wallet connects
    useEffect(() => {
        if (isConnected && address && walletTokens.length === 0 && !isSyncing) {
            handleSyncWallet();
        }
    }, [isConnected, address]);

    // Auto-refresh prices every 60 seconds
    useEffect(() => {
        if (!autoRefresh || !isConnected || holdings.length === 0) return;

        const interval = setInterval(() => {
            console.log('[Auto-Refresh] Refreshing prices...');
            handleSyncWallet();
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [autoRefresh, isConnected, holdings.length]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Total Balance Card */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-3xl shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>

                {/* Collapse/Expand Button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute top-4 right-4 z-20 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all backdrop-blur-sm"
                    title={isExpanded ? "Reduce wallet" : "Expand wallet"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className={`w-5 h-5 text-white transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                </button>

                <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white/80">
                            <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                            <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white/80 text-sm font-medium uppercase tracking-wider">Total Balance</span>
                    </div>
                    <div className="text-5xl font-black text-white mb-4">
                        ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={handleSyncWallet}
                            disabled={isSyncing || !isConnected}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${isConnected
                                ? 'bg-white text-purple-600 hover:bg-white/90 shadow-lg'
                                : 'bg-white/20 text-white/50 cursor-not-allowed'
                                }`}
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Syncing... {syncProgress}%
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

                        {/* Auto-refresh toggle */}
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={`inline-flex items-center gap-2 px-4 py-3 rounded-full font-medium text-sm transition-all ${autoRefresh
                                ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                : 'bg-white/10 text-white/60 border border-white/20'
                                }`}
                            title={autoRefresh ? 'Auto-refresh enabled (60s)' : 'Auto-refresh disabled'}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                            </svg>
                            {autoRefresh ? 'Auto' : 'Manual'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible Assets Section */}
            {isExpanded && (
                <>
                    {/* Portfolio Metrics */}
                    <PortfolioMetrics metrics={metrics} lastUpdate={lastUpdate} />

                    {/* Filters */}
                    <PortfolioFilters
                        sortBy={sortBy}
                        filterBy={filterBy}
                        searchQuery={searchQuery}
                        onSortChange={setSortBy}
                        onFilterChange={setFilterBy}
                        onSearchChange={setSearchQuery}
                    />

                    {/* Assets List */}
                    <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-xl animate-fade-in">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Your Assets</h3>
                            <span className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
                                {holdings.length} {holdings.length === 1 ? 'token' : 'tokens'}
                            </span>
                        </div>

                        <div className="divide-y divide-slate-700/30">
                            {filteredHoldings.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-400 font-medium mb-2">
                                        {isSyncing ? 'Scanning blockchain...' : searchQuery ? 'No tokens match your search' : 'No assets found'}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {!isConnected ? 'Connect your wallet to get started' : searchQuery ? 'Try a different search term' : 'Click "Sync Wallet" to scan your assets'}
                                    </p>
                                </div>
                            ) : (
                                filteredHoldings.map((token, idx) => {
                                    const tokenMetrics = calculateTokenMetrics(token);
                                    const value = tokenMetrics.currentValue;
                                    const priceChange = token.priceChange24h || 0;
                                    const isPositive = priceChange >= 0;

                                    return (
                                        <div
                                            key={token.address || idx}
                                            className="p-4 hover:bg-slate-700/20 transition-all duration-200 group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Token Icon */}
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {token.iconUrl ? (
                                                        <img src={token.iconUrl} alt={token.symbol} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        token.symbol.slice(0, 2).toUpperCase()
                                                    )}
                                                </div>

                                                {/* Token Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold text-white text-lg truncate">{token.symbol}</h4>
                                                        <span className="text-slate-400 text-sm truncate">{token.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm">
                                                        <span className="text-slate-400">
                                                            {(token.holdings || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })} {token.symbol}
                                                        </span>
                                                        <span className="text-slate-500">•</span>
                                                        <span className="text-slate-300">
                                                            ${(token.priceUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Value & PnL */}
                                                <div className="text-right">
                                                    <div className="font-bold text-white text-lg mb-1">
                                                        {formatCurrency(value)}
                                                    </div>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {/* 24h Change */}
                                                        <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor(priceChange)}`}>
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                                className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`}
                                                            >
                                                                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                                                            </svg>
                                                            {formatPercent(Math.abs(priceChange))}
                                                        </div>

                                                        {/* PnL if available */}
                                                        {(token.entryPrice || token.avgBuyPrice) && (
                                                            <>
                                                                <span className="text-slate-600">|</span>
                                                                <div className={`text-sm font-medium ${getChangeColor(tokenMetrics.pnl)}`}>
                                                                    PnL: {formatPercent(tokenMetrics.pnlPercent)}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`https://dexscreener.com/base/${token.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-colors"
                                                        title="View on DexScreener"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300">
                                                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                                                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                                                        </svg>
                                                    </a>
                                                    <a
                                                        href={`https://basescan.org/token/${token.address}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg transition-colors"
                                                        title="View on BaseScan"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300">
                                                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Charts Section (if there are holdings) */}
                    {holdings.length > 0 && (
                        <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 p-6 backdrop-blur-xl animate-fade-in">
                            <PortfolioCharts tokens={holdings} totalValue={totalValue} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PortfolioDashboard;
