
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Token } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import HistoryAccordion from './HistoryAccordion';
import Notification from './Notification';
import { useScanContext } from '../context/ScanContext';
import { tokenService } from '../services/tokenService';
import { TokenBalance } from './TokenBalance';

import SwipeView from './SwipeView';
import SwapModal from './SwapModal';

const TokenPurchaseModal = ({ isOpen, onClose, onBuy, isLoading }: any) => {
    if (!isOpen) return null;
    const [amount, setAmount] = useState('0.01');
    const [rate, setRate] = useState<number | null>(null);

    useEffect(() => {
        tokenService.getSaleRate().then(setRate);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-4">Get GemFinder Tokens</h3>
                <p className="text-slate-400 mb-6">
                    You need GFT tokens to use the AI Analysis features.
                    <br />
                    <span className="text-sm">Current Rate: 1 ETH = {rate || '...'} GFT</span>
                </p>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-slate-400 text-sm mb-2">ETH Amount</label>
                        <input
                            type="number"
                            step="0.001"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-400">You Receive:</span>
                        <span className="text-purple-400 font-bold">{rate ? (parseFloat(amount) * rate).toLocaleString() : '...'} GFT</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onBuy(amount)}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Purchasing...' : 'Buy Tokens'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a6 6 0 01-2.56 5.84m-2.56-5.84a6 6 0 017.38-5.84m-7.38 5.84L5.937 5.937m0 0a6 6 0 015.84-7.38m-5.84 7.38a6 6 0 017.38 5.84m-7.38-5.84L14.37 15.6" />
    </svg>
);

const RadarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
);

interface GemFinderPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

import TokenDetailModal from './TokenDetailModal';

const GemFinderPage: React.FC<GemFinderPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { gemFinder, scanGemFinder } = useScanContext();
    const { tokens, sources, isLoading, error, hasScanned, history } = gemFinder;
    const { address, isConnected } = useAccount();
    const [newGemsCount, setNewGemsCount] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [swapToken, setSwapToken] = useState<Token | null>(null);
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);
    const [analysisCost, setAnalysisCost] = useState<string>('10');

    useEffect(() => {
        tokenService.initialize(window.ethereum);
        tokenService.getAnalysisCost().then(cost => {
            if (cost) setAnalysisCost(cost);
        });
    }, []);

    const handleTrade = (token: Token) => {
        setSwapToken(token);
        setIsSwapModalOpen(true);
    };

    const handleManualScan = async () => {
        if (!isConnected || !address) {
            alert("Please connect your wallet first!");
            return;
        }

        const canPurchase = await tokenService.canPurchaseAnalysis(address);
        if (!canPurchase) {
            setIsPurchaseModalOpen(true);
            return;
        }

        try {
            const paid = await tokenService.purchaseGemAnalysis();
            if (paid) {
                setNewGemsCount(0);
                scanGemFinder(true);
            }
        } catch (e) {
            console.error("Payment failed", e);
        }
    };

    const handleBuyTokens = async (amount: string) => {
        setIsPurchasing(true);
        const success = await tokenService.buyTokens(amount);
        setIsPurchasing(false);
        if (success) {
            setIsPurchaseModalOpen(false);
            // Refresh balance would happen automatically via component update or can force reload
        }
    };

    const handleNotificationAction = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setNewGemsCount(0);
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (error) {
            return <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>;
        }
        if (hasScanned && tokens.length === 0) {
            return (
                <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <h3 className="text-2xl font-bold text-white">No Gems Found This Time</h3>
                    <p className="mt-2 text-slate-400">The AI is adhering to strict verification. Try scanning again in a few moments.</p>
                </div>
            );
        }
        if (!hasScanned) {
            return (
                <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <h3 className="mt-4 text-2xl font-bold text-white">Ready to find some gems?</h3>
                    <p className="mt-2 text-slate-400">Click the "Scan for Gems" button to start the AI analysis.</p>
                </div>
            );
        }
        if (viewMode === 'swipe') {
            return (
                <SwipeView
                    tokens={tokens}
                    onSave={onSave}
                    onUnsave={onUnsave}
                    onTrade={handleTrade}
                    onScanAgain={handleManualScan}
                    savedTokenAddresses={new Set(savedTokens.map(t => t.address))}
                />
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {tokens.map((token) => {
                    if (!token) return null;
                    const isSaved = savedTokens.some(saved => saved.address === token.address);
                    return (
                        <TokenCard
                            key={token.address}
                            token={token}
                            isSaved={isSaved}
                            onSave={onSave}
                            onUnsave={onUnsave}
                            onViewDetails={() => setSelectedToken(token)}
                        />
                    );
                })}
            </div>
        );
    }

    return (
        <>
            {newGemsCount > 0 && (
                <Notification
                    message={`${newGemsCount} new gem${newGemsCount > 1 ? 's' : ''} found!`}
                    actionText="Show Me"
                    onAction={handleNotificationAction}
                    onClose={() => setNewGemsCount(0)}
                />
            )}
            <div className="relative text-center max-w-4xl mx-auto py-16 md:py-24">
                {/* Dynamic Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px] -z-10"></div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
                    Discover the Next <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-gradient-x">100x Gem</span>
                </h1>
                <p className="mt-6 text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    AI-powered analysis for the Base ecosystem. <br />
                    <span className="text-indigo-400 font-semibold">Scan, Analyze, and Trade</span> with confidence.
                </p>

                <div className="mt-6 flex justify-center">
                    <TokenBalance />
                </div>

                <div className="mt-10 flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                        onClick={handleManualScan}
                        disabled={isLoading}
                        className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-900 font-bold text-lg rounded-full shadow-xl shadow-indigo-500/30 transform transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-50 to-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Scanning Base...
                            </span>
                        ) : hasScanned ? (
                            <>
                                <RadarIcon className="w-8 h-8 mr-2 text-indigo-300" />
                                Scan Again
                            </>
                        ) : (
                            <>
                                <RocketIcon className="w-7 h-7 mr-2 text-indigo-300" />
                                <div className="flex flex-col items-start">
                                    <span>Start Gem Scan</span>
                                    <span className="text-xs text-indigo-300/70 font-normal">Cost: {analysisCost} GFT</span>
                                </div>
                            </>
                        )}
                    </button>

                    {hasScanned && tokens.length > 0 && (
                        <div className="bg-slate-900/60 backdrop-blur-md p-1.5 rounded-full flex items-center border border-slate-700/50 shadow-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('swipe')}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${viewMode === 'swipe' ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Swipe 🔥
                            </button>
                        </div>
                    )}
                </div>
            </div>



            <div className="mt-12 md:mt-16">
                {renderContent()}

                {!isLoading && sources.length > 0 && (
                    <div className="mt-12 md:mt-16 max-w-3xl mx-auto">
                        <h3 className="text-xl font-bold text-center text-white mb-4">Data Sources</h3>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                            <ul className="space-y-2">
                                {sources.map((source, index) => (
                                    source.web && (
                                        <li key={index}>
                                            <a
                                                href={source.web.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-400 hover:text-indigo-300 text-sm truncate block"
                                                title={source.web.title || source.web.uri}
                                            >
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {history.length > 0 && (
                <div className="mt-16">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-white">Scan History</h2>
                        <p className="text-slate-400">Previously found gems from this session.</p>
                    </div>
                    <div className="max-w-7xl mx-auto space-y-4">
                        {history.map((scan, index) => (
                            <HistoryAccordion
                                key={index}
                                title={`Scan from ${scan.timestamp.toLocaleString()} (${scan.tokens.length} ${scan.tokens.length === 1 ? 'gem' : 'gems'} found)`}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                    {scan.tokens.map((token) => {
                                        const isSaved = savedTokens.some(saved => saved.address === token.address);
                                        return (
                                            <TokenCard
                                                key={`${scan.timestamp.toISOString()}-${token.address}`}
                                                token={token}
                                                isSaved={isSaved}
                                                onSave={onSave}
                                                onUnsave={onUnsave}
                                                onViewDetails={() => setSelectedToken(token)}
                                            />
                                        );
                                    })}
                                </div>
                            </HistoryAccordion>
                        ))}
                    </div>
                </div>
            )}

            <SwapModal
                isOpen={isSwapModalOpen}
                onClose={() => setIsSwapModalOpen(false)}
                tokenAddress={swapToken?.address || ''}
                initialOutputTokenAddress={swapToken?.address}
            />

            <TokenPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                onBuy={handleBuyTokens}
                isLoading={isPurchasing}
            />

            {/* Detail Modal */}
            {selectedToken && (
                <TokenDetailModal
                    token={selectedToken}
                    isOpen={!!selectedToken}
                    onClose={() => setSelectedToken(null)}
                />
            )}
        </>
    )
}

export default GemFinderPage;
