import React from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';

const BookmarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
    </svg>
);


interface SavedProjectsPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const SavedProjectsPage: React.FC<SavedProjectsPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    return (
        <>
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                    Your <span className="bg-gradient-to-r from-pink-500 to-yellow-400 text-transparent bg-clip-text">Saved Projects</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-400">
                    A list of all the tokens you're keeping an eye on. Projects you unsave will be removed from this list.
                </p>
            </div>

            <div className="mt-12 md:mt-16">
                {savedTokens.length === 0 ? (
                    <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                        <BookmarkIcon className="w-16 h-16 mx-auto text-slate-500" />
                        <h3 className="mt-4 text-2xl font-bold text-white">Your Watchlist is Empty</h3>
                        <p className="mt-2 text-slate-400">
                            You haven't saved any projects yet. Go to one of the other pages and click the bookmark icon on any token to add it here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {savedTokens.map((token) => (
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
