import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';

interface SwipeViewProps {
    tokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
    onTrade: (token: Token) => void;
    onScanAgain?: () => void;
    savedTokenAddresses: Set<string>;
}

const SwipeView: React.FC<SwipeViewProps> = ({ tokens, onSave, onUnsave, onTrade, onScanAgain, savedTokenAddresses }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    // Reset index if tokens change drastically (optional, but good for new searches)
    useEffect(() => {
        setCurrentIndex(0);
    }, [tokens]);

    if (currentIndex >= tokens.length) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 animate-fade-in">
                <div className="bg-slate-800/50 rounded-full p-6 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">All Caught Up!</h2>
                <p className="text-slate-400">You've swiped through all the tokens in this list.</p>
                <div className="flex space-x-4 mt-6">
                    <button
                        onClick={() => setCurrentIndex(0)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-colors"
                    >
                        Review Again
                    </button>
                    {onScanAgain && (
                        <button
                            onClick={onScanAgain}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-colors shadow-lg shadow-indigo-500/30"
                        >
                            Scan New Gems
                        </button>
                    )}
                </div>
            </div>
        );
    }

    const currentToken = tokens[currentIndex];
    const isSaved = savedTokenAddresses.has(currentToken.address);

    const handleSwipe = (dir: 'left' | 'right') => {
        if (isAnimating) return;

        setDirection(dir);
        setIsAnimating(true);

        // Action
        if (dir === 'right' && !isSaved) {
            onSave(currentToken);
        }
        // Left swipe just skips (or unsaves if we wanted, but usually just skip)

        // Animation delay
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setDirection(null);
            setIsAnimating(false);
        }, 300); // Match CSS transition duration
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto relative">
            {/* Stack Effect Background Cards */}
            {currentIndex + 1 < tokens.length && (
                <div className="absolute top-4 w-full scale-95 opacity-50 z-0 pointer-events-none">
                    <TokenCard
                        token={tokens[currentIndex + 1]}
                        isSaved={savedTokenAddresses.has(tokens[currentIndex + 1].address)}
                        onSave={() => { }}
                        onUnsave={() => { }}
                    />
                </div>
            )}

            {/* Active Card */}
            <div
                className={`w-full z-10 transition-all duration-500 ease-out transform ${direction === 'left' ? '-translate-x-[150%] -rotate-[20deg] opacity-0' :
                    direction === 'right' ? 'translate-x-[150%] rotate-[20deg] opacity-0' : 'hover:scale-[1.02]'
                    }`}
            >
                <TokenCard
                    token={currentToken}
                    isSaved={isSaved}
                    onSave={onSave}
                    onUnsave={onUnsave}
                />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-6 mt-8 z-20">
                <button
                    onClick={() => handleSwipe('left')}
                    className="w-16 h-16 rounded-full bg-slate-800 border-2 border-rose-500 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/20 transform hover:scale-110"
                    title="Pass"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <button
                    onClick={() => onTrade(currentToken)}
                    className="w-12 h-12 rounded-full bg-slate-800 border-2 border-indigo-500 text-indigo-500 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-900/20 transform hover:scale-110"
                    title="Trade / Swap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                    </svg>
                </button>

                <button
                    onClick={() => handleSwipe('right')}
                    className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-900/20 transform hover:scale-110"
                    title="Save / Like"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default SwipeView;
