
import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import HistoryAccordion from './HistoryAccordion';
import Notification from './Notification';
import { useScanContext } from '../context/ScanContext';

import SwipeView from './SwipeView';
import SwapModal from './SwapModal';

const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.82m5.84-2.56a6 6 0 01-2.56 5.84m-2.56-5.84a6 6 0 017.38-5.84m-7.38 5.84L5.937 5.937m0 0a6 6 0 015.84-7.38m-5.84 7.38a6 6 0 017.38 5.84m-7.38-5.84L14.37 15.6" />
    </svg>
);

const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
    </svg>
);

interface GemFinderPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const GemFinderPage: React.FC<GemFinderPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { gemFinder, scanGemFinder } = useScanContext();
    const { tokens, sources, isLoading, error, hasScanned, history } = gemFinder;
    const [newGemsCount, setNewGemsCount] = useState(0);
    const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [swapToken, setSwapToken] = useState<Token | null>(null);

    const handleTrade = (token: Token) => {
        setSwapToken(token);
        setIsSwapModalOpen(true);
    };

    const handleManualScan = () => {
        setNewGemsCount(0);
        scanGemFinder(true);
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
                    <RocketIcon className="w-16 h-16 mx-auto text-indigo-400" />
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
                    return <TokenCard key={token.address} token={token} isSaved={isSaved} onSave={onSave} onUnsave={onUnsave} />;
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
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                    Discover the Next <span className="bg-gradient-to-r from-blue-400 to-indigo-600 text-transparent bg-clip-text">100x Gem</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-400">
                    Our AI scans Base DEXs via Google Grounding to find valid, tradeable tokens.
                </p>
                <div className="mt-8">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleManualScan}
                            disabled={isLoading}
                            className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 text-white font-bold text-lg rounded-full shadow-lg shadow-indigo-500/50 transform transition-all duration-300 hover:bg-indigo-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                        >
                            {isLoading ? (
                                'Scanning...'
                            ) : hasScanned ? (
                                <>
                                    <RefreshIcon className="w-6 h-6 mr-3 -ml-2" />
                                    Scan Again
                                </>
                            ) : (
                                'Scan for Gems Now'
                            )}
                        </button>

                        {hasScanned && tokens.length > 0 && (
                            <div className="bg-slate-800 p-1 rounded-full flex items-center border border-slate-700">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'grid' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewMode('swipe')}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${viewMode === 'swipe' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Swipe 🔥
                                </button>
                            </div>
                        )}
                    </div>
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
                                        return <TokenCard key={`${scan.timestamp.toISOString()}-${token.address}`} token={token} isSaved={isSaved} onSave={onSave} onUnsave={onUnsave} />;
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
        </>
    )
}

export default GemFinderPage;
