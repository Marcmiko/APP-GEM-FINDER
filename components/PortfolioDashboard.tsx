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
    walletTokens: Token[];
    onWalletSync: (tokens: Token[]) => void;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ walletTokens, onWalletSync }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [isExpanded, setIsExpanded] = useState(true);
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { addAlert } = useAlerts();

    // Filter out tokens with 0 holdings for display
    const holdings = walletTokens.filter(t => (t.holdings || 0) > 0);

    const totalValue = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * (t.priceUsd || 0)), 0);

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

                            addressesToFetchPrice.push(token.address);
                        }
                    }
                });
            }

            setSyncProgress(80);

            // 4. Multi-tier price fetching
            if (addressesToFetchPrice.length > 0) {
                try {
                    console.log('📊 Fetching prices for', addressesToFetchPrice.length, 'tokens...');

                    // Import DexScreener service
                    const { getPairsByAddress, searchDexScreener } = await import('../services/dexScreenerService');

                    // TIER 1: Try DexScreener by address
                    const pairs = await getPairsByAddress(addressesToFetchPrice);
                    console.log('💰 DexScreener returned', pairs.length, 'pairs by address');

                    // Create price map from DexScreener pairs
                    const priceMap: Record<string, number> = {};
                    pairs.forEach(pair => {
                        if (pair.baseToken?.address && pair.priceUsd) {
                            const addr = pair.baseToken.address.toLowerCase();
                            const price = parseFloat(pair.priceUsd);
                            if (price > 0) {
                                priceMap[addr] = price;
                            }
                        }
                    });

                    console.log('💵 Price map from addresses:', Object.keys(priceMap).length, 'entries');

                    // TIER 2: Try GeckoTerminal/CoinGecko for missing tokens
                    const tokensWithoutPrice = heldTokens.filter(t => {
                        const addr = t.address?.toLowerCase();
                        return addr && !priceMap[addr];
                    });

                    if (tokensWithoutPrice.length > 0) {
                        console.log('🦎 Trying GeckoTerminal/CoinGecko for', tokensWithoutPrice.length, 'tokens...');
                        const { getTokenPrices } = await import('../services/geckoTerminalService');
                        const missingAddresses = tokensWithoutPrice.map(t => t.address);
                        const geckoPrice = await getTokenPrices(missingAddresses);

                        Object.keys(geckoPrice).forEach(addr => {
                            if (geckoPrice[addr] > 0) {
                                priceMap[addr.toLowerCase()] = geckoPrice[addr];
                                console.log(`🦎 GeckoTerminal found price for ${addr}: $${geckoPrice[addr]}`);
                            }
                        });
                    }

                    // TIER 3: For remaining tokens, search by symbol on DexScreener
                    const stillMissingPrice = heldTokens.filter(t => {
                        const addr = t.address?.toLowerCase();
                        return addr && !priceMap[addr];
                    });

                    if (stillMissingPrice.length > 0) {
                        console.log('🔍 Searching by symbol for', stillMissingPrice.length, 'tokens...');

                        for (const token of stillMissingPrice) {
                            try {
                                const searchResults = await searchDexScreener(token.symbol);
                                if (searchResults.length > 0) {
                                    // Take the first result (usually most liquid)
                                    const firstPair = searchResults[0];
                                    const price = parseFloat(firstPair.priceUsd);
                                    if (price > 0) {
                                        priceMap[token.address.toLowerCase()] = price;
                                        console.log(`🔎 Found ${token.symbol} by search: $${price.toFixed(6)}`);
                                    }
                                }
                            } catch (err) {
                                // Ignore individual search errors
                            }
                        }
                    }

                    // TIER 4: Hardcoded fallback for ETH
                    const ethToken = heldTokens.find(t => t.symbol === 'ETH' || t.name === 'Ethereum');
                    if (ethToken && !priceMap[ethToken.address?.toLowerCase()]) {
                        try {
                            // Fetch current ETH price from CoinGecko simple API
                            const ethPriceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
                            const ethPriceData = await ethPriceRes.json();
                            if (ethPriceData?.ethereum?.usd) {
                                priceMap['eth'] = ethPriceData.ethereum.usd;
                                console.log(`⚡ ETH price from CoinGecko: $${ethPriceData.ethereum.usd}`);
                            }
                        } catch (err) {
                            console.warn('Failed to fetch ETH price, using fallback');
                            priceMap['eth'] = 3500; // Fallback ETH price
                        }
                    }

                    // Update prices in heldTokens
                    let pricesUpdated = 0;
                    heldTokens.forEach(t => {
                        const addr = t.address?.toLowerCase();
                        const isEth = t.symbol === 'ETH' || t.name === 'Ethereum';

                        if (addr && priceMap[addr]) {
                            t.priceUsd = priceMap[addr];
                            pricesUpdated++;
                            console.log(`✅ ${t.symbol}: $${t.priceUsd.toFixed(6)}`);
                        } else if (isEth && priceMap['eth']) {
                            t.priceUsd = priceMap['eth'];
                            pricesUpdated++;
                            console.log(`✅ ${t.symbol}: $${t.priceUsd.toFixed(2)}`);
                        } else {
                            console.warn(`❌ No price for ${t.symbol} (${t.address})`);
                        }
                    });

                    console.log(`📈 Updated ${pricesUpdated}/${heldTokens.length} token prices`);

                    if (pricesUpdated < heldTokens.length / 2) {
                        addAlert(`Synced ${heldTokens.length} tokens. Only ${pricesUpdated} prices found (some tokens may be too new)`, 'warning');
                    } else if (pricesUpdated < heldTokens.length) {
                        addAlert(`Synced ${heldTokens.length} tokens. Prices found for ${pricesUpdated} tokens.`, 'info');
                    }
                } catch (priceError) {
                    console.error('❌ Price fetching failed:', priceError);
                    addAlert('Warning: Unable to fetch token prices', 'warning');
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
            addAlert(`Wallet synced! Found ${heldTokens.length} assets.`, 'success');

        } catch (error) {
            console.error('Error syncing wallet:', error);
            addAlert(`Failed to sync wallet: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncProgress(0), 1000);
        }
    };

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
                </div>
            </div>

            {/* Collapsible Assets Section */}
            {isExpanded && (
                <>
                    {/* Assets List */}
                    <div className="bg-slate-800/50 rounded-3xl border border-slate-700/50 overflow-hidden backdrop-blur-xl animate-fade-in">
                        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Your Assets</h3>
                            <span className="text-sm text-slate-400 bg-slate-700/50 px-3 py-1 rounded-full">
                                {holdings.length} {holdings.length === 1 ? 'token' : 'tokens'}
                            </span>
                        </div>

                        <div className="divide-y divide-slate-700/30">
                            {holdings.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-400 font-medium mb-2">
                                        {isSyncing ? 'Scanning blockchain...' : 'No assets found'}
                                    </p>
                                    <p className="text-slate-500 text-sm">
                                        {!isConnected ? 'Connect your wallet to get started' : 'Click "Sync Wallet" to scan your assets'}
                                    </p>
                                </div>
                            ) : (
                                holdings.map((token, idx) => {
                                    const value = (token.holdings || 0) * (token.priceUsd || 0);
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
                                                        <span>{token.symbol?.substring(0, 2)}</span>
                                                    )}
                                                </div>

                                                {/* Token Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-2 mb-1">
                                                        <h4 className="text-white font-bold text-lg">{token.symbol}</h4>
                                                        <span className="text-slate-500 text-sm truncate">{token.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-400 text-sm">
                                                            ${token.priceUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                        </span>
                                                        {priceChange !== 0 && (
                                                            <span className={`text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {isPositive ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Holdings */}
                                                <div className="text-right">
                                                    <div className="text-white font-bold text-lg mb-1">
                                                        {token.holdings?.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                    </div>
                                                    <div className="text-slate-400 text-sm">
                                                        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
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
