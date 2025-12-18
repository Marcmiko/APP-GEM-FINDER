import React, { useState, useEffect, useRef } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import SniperFilters from './SniperFilters';
import { useScanContext } from '../context/ScanContext';
import { getNewPools } from '../services/geckoTerminalService';
import { useAccount } from 'wagmi';
import { tokenService } from '../services/tokenService';
import { TokenSaleModal } from './TokenSaleModal';
import FlashTradeModal from './FlashTradeModal';
import TokenDetailModal from './TokenDetailModal';
import { motion, AnimatePresence } from 'framer-motion';

interface SniperPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const SniperPage: React.FC<SniperPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { analystPicks } = useScanContext();
    const [isSniping, setIsSniping] = useState(false);
    const [sniperTokens, setSniperTokens] = useState<Token[]>([]);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [scannedCount, setScannedCount] = useState(0);

    // Filter States
    const [minLiquidity, setMinLiquidity] = useState(15000);
    const [maxAgeHours, setMaxAgeHours] = useState(24);
    const [minBuyPressure, setMinBuyPressure] = useState(45);
    const [honeypotCheck, setHoneypotCheck] = useState(true);

    // Live Scanned Counter Simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSniping) {
            interval = setInterval(() => {
                setScannedCount(prev => prev + Math.floor(Math.random() * 5) + 1);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isSniping]);

    // Real-time sniping logic
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchNewTokens = async () => {
            try {
                const newTokens = await getNewPools();
                setSniperTokens(prev => {
                    const existingAddresses = new Set(prev.map(t => t.address));
                    const uniqueNewTokens = newTokens.filter(t => !existingAddresses.has(t.address));

                    if (uniqueNewTokens.length > 0) {
                        uniqueNewTokens.sort((a, b) => (b.gemScore || 0) - (a.gemScore || 0));
                        return [...uniqueNewTokens, ...prev].slice(0, 50);
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Sniper error:", error);
            }
        };

        if (isSniping) {
            fetchNewTokens();
            interval = setInterval(fetchNewTokens, 15000);
        }

        return () => clearInterval(interval);
    }, [isSniping]);

    // Apply filters
    const filteredTokens = sniperTokens.filter(token => {
        if (!token.creationDate) return false;
        const createdTime = new Date(token.creationDate).getTime();
        if (isNaN(createdTime)) return false;
        const tokenAgeHours = (Date.now() - createdTime) / (1000 * 60 * 60);

        return (
            token.liquidity >= minLiquidity &&
            tokenAgeHours <= maxAgeHours &&
            tokenAgeHours >= 0 &&
            token.buyPressure >= minBuyPressure
        );
    });

    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const { isConnected, address } = useAccount();

    const handleStartSniping = async () => {
        if (!isConnected || !address) {
            alert("Please connect your wallet first!");
            return;
        }

        const canSnipe = await tokenService.canPurchaseAnalysis(address);
        if (!canSnipe) {
            setIsPurchaseModalOpen(true);
            return;
        }

        setIsSniping(!isSniping);
    };

    const handleFlashBuy = (token: Token) => {
        setSelectedToken(token);
        setIsTradeModalOpen(true);
    };

    return (
        <div className="relative min-h-[80vh] container mx-auto px-4 py-8 mt-20 overflow-hidden">
            {/* Radar Background Decor */}
            <AnimatePresence>
                {isSniping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
                    >
                        <div className="relative w-[800px] h-[800px] border border-indigo-500/10 rounded-full">
                            <div className="absolute inset-0 border border-indigo-500/5 rounded-full scale-75"></div>
                            <div className="absolute inset-0 border border-indigo-500/5 rounded-full scale-50"></div>
                            <div className="absolute inset-0 border border-indigo-500/5 rounded-full scale-25"></div>
                            <div className="absolute inset-0 animate-radar radar-gradient rounded-full"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectedToken && (
                <FlashTradeModal
                    token={selectedToken}
                    isOpen={isTradeModalOpen}
                    onClose={() => setIsTradeModalOpen(false)}
                />
            )}
            <TokenSaleModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
            />

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter flex items-center italic">
                                AI SNIPER
                                <span className="ml-3 px-3 py-1 bg-amber-500 text-black text-xs font-black rounded italic border border-amber-400 uppercase tracking-widest">
                                    Exclusive
                                </span>
                            </h1>
                            {isSniping && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                    </span>
                                    <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest">Live Scanning</span>
                                </div>
                            )}
                        </div>
                        <p className="text-slate-400 mt-2 font-medium">Real-time Base network surveillance. <span className="text-amber-500 font-bold">GFT Required.</span></p>
                    </div>

                    <div className="flex flex-col items-end gap-3 mt-6 md:mt-0">
                        {isSniping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-2xl flex items-center gap-4 shadow-xl"
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Tokens Scanned</span>
                                    <span className="text-xl font-mono font-bold text-indigo-400">{scannedCount.toLocaleString()}</span>
                                </div>
                                <div className="w-px h-8 bg-slate-700"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">New Targets</span>
                                    <span className="text-xl font-mono font-bold text-rose-400">{filteredTokens.length}</span>
                                </div>
                            </motion.div>
                        )}

                        <div className="flex items-center space-x-4">
                            {sniperTokens.length > 0 && (
                                <button
                                    onClick={() => {
                                        setSniperTokens([]);
                                        setScannedCount(0);
                                    }}
                                    className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                                >
                                    Reset Feed
                                </button>
                            )}
                            <button
                                onClick={handleStartSniping}
                                className={`group relative px-10 py-4 rounded-full font-black text-xl transition-all duration-500 shadow-2xl overflow-hidden ${isSniping
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/40'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/40'
                                    }`}
                            >
                                <span className={`absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000`}></span>
                                <div className="relative flex items-center gap-3">
                                    {isSniping ? (
                                        <>
                                            <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></span>
                                            ABORT SNIPE
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl mt-0.5">⚡</span>
                                            ENGAGE SNIPER
                                        </>
                                    )}
                                </div>
                            </button>
                        </div>
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

                <div className="mt-8">
                    {filteredTokens.length === 0 ? (
                        <div className="relative py-32 flex flex-col items-center justify-center bg-slate-800/20 backdrop-blur-sm rounded-3xl border border-slate-700/50 border-dashed overflow-hidden">
                            {isSniping && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute inset-0 animate-radar radar-gradient opacity-20"></div>
                                </div>
                            )}
                            <div className="text-7xl mb-6 relative">
                                📡
                                {isSniping && <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500"></span>
                                </span>}
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">
                                {isSniping ? "Searching for Targets..." : "System Standby"}
                            </h3>
                            <p className="text-slate-500 mt-3 font-medium max-w-sm text-center">
                                {isSniping
                                    ? "Our AI is currently monitoring the Base mempool for high-velocity launches meeting your criteria."
                                    : "Engage the sniper to begin real-time surveillance of the Base ecosystem."}
                            </p>
                            {isSniping && (
                                <div className="mt-10 flex gap-1.5">
                                    {[0, 1, 2].map(i => (
                                        <div key={i} className={`w-2 h-2 bg-indigo-500 rounded-full animate-bounce`} style={{ animationDelay: `${i * 150}ms` }}></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredTokens.map((token, index) => {
                                    const isSaved = savedTokens.some(saved => saved.address === token.address);
                                    return (
                                        <motion.div
                                            key={`${token.address}-${index}`}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            className="relative group"
                                        >
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                            <TokenCard
                                                token={token}
                                                isSaved={isSaved}
                                                onSave={onSave}
                                                onUnsave={onUnsave}
                                                onFlashBuy={handleFlashBuy}
                                                isLive={true}
                                                onViewDetails={() => setSelectedToken(token)}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedToken && !isTradeModalOpen && (
                <TokenDetailModal
                    token={selectedToken}
                    isOpen={!!selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </div>
    );
};

export default SniperPage;
