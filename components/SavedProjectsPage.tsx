import React from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import PortfolioDashboard from './PortfolioDashboard';

const BookmarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
);


interface SavedProjectsPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
    onUpdateTokens?: (tokens: Token[]) => void;
}

const SavedProjectsPage: React.FC<SavedProjectsPageProps> = ({ savedTokens, onSave, onUnsave, onUpdateTokens }) => {
    // Filter tokens for the watchlist (only those with 0 holdings)
    // Tokens with holdings are shown in the PortfolioDashboard
    const watchlistTokens = savedTokens.filter(t => !t.holdings || t.holdings === 0);

    return (
        <>
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                    Your <span className="bg-gradient-to-r from-pink-500 to-yellow-400 text-transparent bg-clip-text">Portfolio</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-400">
                    Track your holdings and watch your favorite gems.
                </p>
            </div>

            {/* Portfolio Dashboard */}
            {savedTokens.length > 0 && onUpdateTokens && (
                <div className="mb-16 animate-fade-in">
                    <PortfolioDashboard
                        savedTokens={savedTokens}
                        onUpdateTokens={onUpdateTokens}
                    />
                </div>
            )}

            {/* Watchlist Section */}
            <div className="mt-12 md:mt-16">
                <div className="flex items-center gap-4 mb-8">
                    <BookmarkIcon className="w-8 h-8 text-pink-500" />
                    <h2 className="text-3xl font-bold text-white">Watchlist</h2>
                    <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-sm font-medium">
                        {watchlistTokens.length}
                    </span>
                </div>

                {watchlistTokens.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                        <p className="text-slate-400">
                            {savedTokens.length > 0
                                ? "All your saved projects are in your portfolio!"
                                : "Your watchlist is empty. Go find some gems!"}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {watchlistTokens.map((token) => (
                            <TokenCard
                                key={token.address}
                                token={token}
                                isSaved={true}
                                onSave={onSave}
                                onUnsave={onUnsave}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default SavedProjectsPage;
