import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import SniperFilters from './SniperFilters';
import { useScanContext } from '../context/ScanContext';
import { getNewPools } from '../services/geckoTerminalService';

interface SniperPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const SniperPage: React.FC<SniperPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { gemFinder, newProjects, analystPicks, scanGemFinder, scanNewProjects, scanAnalystPicks } = useScanContext();
    const [isSniping, setIsSniping] = useState(false);
    const [sniperTokens, setSniperTokens] = useState<Token[]>([]);
    // Filter States
    const [minLiquidity, setMinLiquidity] = useState(5000);
    const [maxAgeHours, setMaxAgeHours] = useState(24);
    const [minBuyPressure, setMinBuyPressure] = useState(60);
    const [honeypotCheck, setHoneypotCheck] = useState(true);

    // Real-time sniping logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchNewTokens = async () => {
            try {
                const newTokens = await getNewPools();

                // Filter out tokens we already have to avoid duplicates/re-renders
                // But since this is a "feed", maybe we just want to update the list?
                // Let's prepend new ones.

                setSniperTokens(prev => {
                    const existingAddresses = new Set(prev.map(t => t.address));
                    const uniqueNewTokens = newTokens.filter(t => !existingAddresses.has(t.address));

                    if (uniqueNewTokens.length > 0) {
                        // Sort new tokens by gem score (highest first)
                        uniqueNewTokens.sort((a, b) => (b.gemScore || 0) - (a.gemScore || 0));
                        return [...uniqueNewTokens, ...prev].slice(0, 50); // Keep last 50
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Sniper error:", error);
            }
        };

        if (isSniping) {
            // Initial fetch
            fetchNewTokens();

            // Poll every 15 seconds (GeckoTerminal rate limit is 30/min, so 15s is safe)
            interval = setInterval(fetchNewTokens, 15000);
        }

        return () => clearInterval(interval);
    }, [isSniping]);

    // Apply filters
    const filteredTokens = sniperTokens.filter(token => {
        // Safety check for valid creation date
        if (!token.creationDate) return false;

        const createdTime = new Date(token.creationDate).getTime();
        if (isNaN(createdTime)) return false;

        const tokenAgeHours = (Date.now() - createdTime) / (1000 * 60 * 60);

        // Strict check: must be within the max age limit
        // Also filter out tokens with suspiciously old creation dates (e.g. > 1 year) if they somehow got here
        // AAVE and others would fail this if their creation date is correct
        return (
            token.liquidity >= minLiquidity &&
            tokenAgeHours <= maxAgeHours &&
            tokenAgeHours >= 0 && // Future dates check
            token.buyPressure >= minBuyPressure
        );
    });

    return (
        <div className="container mx-auto px-4 py-8 mt-20">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center">
                        <span className="mr-3 text-4xl">🔭</span>
                        AI Sniper
                        <span className="ml-3 px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/30 uppercase tracking-widest">
                            Beta
                        </span>
                    </h1>
                    <p className="text-slate-400 mt-2">Real-time discovery of high-velocity token launches.</p>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    {sniperTokens.length > 0 && (
                        <button
                            onClick={() => setSniperTokens([])}
                            className="text-slate-400 hover:text-white text-sm font-bold px-4 py-2"
                        >
                            Clear Feed
                        </button>
                    )}
                    <button
                        onClick={() => setIsSniping(!isSniping)}
                        className={`px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 shadow-lg flex items-center ${isSniping
                            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30'
                            }`}
                    >
                        {isSniping ? (
                            <>
                                <span className="w-3 h-3 bg-white rounded-full mr-3 animate-ping"></span>
                                Stop Sniping
                            </>
                        ) : (
                            <>
                                <span className="mr-2">⚡</span>
                                Start Sniping
                            </>
                        )}
                    </button>
                </div>
            </div>

            <SniperFilters
                minLiquidity={minLiquidity}
                setMinLiquidity={setMinLiquidity}
                maxAgeHours={maxAgeHours}
                setMaxAgeHours={setMaxAgeHours}
                minBuyPressure={minBuyPressure}
                setMinBuyPressure={setMinBuyPressure}
                honeypotCheck={honeypotCheck}
                setHoneypotCheck={setHoneypotCheck}
            />

            {filteredTokens.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-slate-700/50 border-dashed">
                    <div className="text-6xl mb-4">📡</div>
                    <h3 className="text-xl font-bold text-white">Waiting for Targets...</h3>
                    <p className="text-slate-400 mt-2">
                        {isSniping ? "Scanning the mempool for new opportunities..." : "Start the sniper to find gems."}
                    </p>
                    {isSniping && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-0"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-300"></div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTokens.map((token, index) => {
                        const isSaved = savedTokens.some(saved => saved.address === token.address);
                        return (
                            <div key={`${token.address}-${index}`} className="relative animate-fade-in-up">
                                <div className="absolute -top-3 -right-3 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
                                    LIVE
                                </div>
                                <TokenCard
                                    token={token}
                                    isSaved={isSaved}
                                    onSave={onSave}
                                    onUnsave={onUnsave}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SniperPage;
