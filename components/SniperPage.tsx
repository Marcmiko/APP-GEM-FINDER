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
    const { gemFinder } = useScanContext();
    const [isSniping, setIsSniping] = useState(false);
    const [sniperTokens, setSniperTokens] = useState<Token[]>([]);

    // Filter States
    const [minLiquidity, setMinLiquidity] = useState(5000);
    const [maxAgeHours, setMaxAgeHours] = useState(24);
    const [minBuyPressure, setMinBuyPressure] = useState(60);
    const [honeypotCheck, setHoneypotCheck] = useState(true);

    // Simulate finding new tokens when sniping is active
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isSniping) {
            // Initial load from context if available
            if (gemFinder.tokens.length > 0 && sniperTokens.length === 0) {
                setSniperTokens(gemFinder.tokens);
            }

            interval = setInterval(() => {
                // In a real app, this would fetch new listings
                // For demo, we'll just shuffle or re-verify existing tokens to simulate updates
                // or potentially add a "mock" new token if we had a generator
                console.log("Sniping... scanning for new blocks");
            }, 3000);
        }

        return () => clearInterval(interval);
    }, [isSniping, gemFinder.tokens]);

    // Apply filters
    const filteredTokens = (sniperTokens.length > 0 ? sniperTokens : gemFinder.tokens).filter(token => {
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

                <button
                    onClick={() => setIsSniping(!isSniping)}
                    className={`mt-4 md:mt-0 px-8 py-3 rounded-full font-bold text-lg transition-all duration-300 shadow-lg flex items-center ${isSniping
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
                        {isSniping ? "Scanning the mempool for new opportunities." : "Start the sniper to find gems."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTokens.map(token => {
                        const isSaved = savedTokens.some(saved => saved.address === token.address);
                        return (
                            <div key={token.address} className="relative">
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
