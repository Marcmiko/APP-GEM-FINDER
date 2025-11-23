import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import SniperFilters from './SniperFilters';
import { useScanContext } from '../context/ScanContext';

interface SniperPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const SniperPage: React.FC<SniperPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { gemFinder, newProjects, analystPicks, scanGemFinder, scanNewProjects, scanAnalystPicks } = useScanContext();
    const [isSniping, setIsSniping] = useState(false);
    const [sniperTokens, setSniperTokens] = useState<Token[]>([]);
    const [scannedPool, setScannedPool] = useState<Token[]>([]);

    // Filter States
    const [minLiquidity, setMinLiquidity] = useState(5000);
    const [maxAgeHours, setMaxAgeHours] = useState(24);
    const [minBuyPressure, setMinBuyPressure] = useState(60);
    const [honeypotCheck, setHoneypotCheck] = useState(true);

    // Aggregate all available tokens into a pool
    useEffect(() => {
        const allTokens = [
            ...gemFinder.tokens,
            ...newProjects.tokens,
            ...analystPicks.tokens
        ];

        // Remove duplicates based on address
        const uniqueTokens = Array.from(new Map(allTokens.map(token => [token.address, token])).values());
        setScannedPool(uniqueTokens);
    }, [gemFinder.tokens, newProjects.tokens, analystPicks.tokens]);

    // Simulate finding new tokens when sniping is active
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isSniping) {
            // If we have no tokens in the pool, trigger scans to get data
            if (scannedPool.length === 0) {
                if (!gemFinder.hasScanned && !gemFinder.isLoading) scanGemFinder();
                if (!newProjects.hasScanned && !newProjects.isLoading) scanNewProjects();
                if (!analystPicks.hasScanned && !analystPicks.isLoading) scanAnalystPicks();
            }

            // Immediate burst: if we have tokens, show 1-2 immediately
            if (scannedPool.length > 0 && sniperTokens.length === 0) {
                const availableTokens = scannedPool.filter(
                    poolToken => !sniperTokens.some(st => st.address === poolToken.address)
                );
                if (availableTokens.length > 0) {
                    const initialBatch = availableTokens.slice(0, 2); // Show 2 immediately
                    setSniperTokens(initialBatch);
                }
            }

            interval = setInterval(() => {
                // Find a token from the pool that isn't in our sniper list yet
                const availableTokens = scannedPool.filter(
                    poolToken => !sniperTokens.some(st => st.address === poolToken.address)
                );

                if (availableTokens.length > 0) {
                    // Pick a random token to "discover"
                    const randomIndex = Math.floor(Math.random() * availableTokens.length);
                    const newToken = availableTokens[randomIndex];

                    // Add it to the top of the list with a "just now" effect
                    setSniperTokens(prev => [newToken, ...prev]);
                }
            }, 800); // "Find" a new token every 0.8 seconds (much faster)
        }

        return () => clearInterval(interval);
    }, [isSniping, scannedPool, sniperTokens, gemFinder, newProjects, analystPicks, scanGemFinder, scanNewProjects, scanAnalystPicks]);

    // Apply filters
    const filteredTokens = sniperTokens.filter(token => {
        const tokenAgeHours = (Date.now() - new Date(token.creationDate).getTime()) / (1000 * 60 * 60);

        return (
            token.liquidity >= minLiquidity &&
            tokenAgeHours <= maxAgeHours &&
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
