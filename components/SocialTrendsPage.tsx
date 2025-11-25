
import React from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import HistoryAccordion from './HistoryAccordion';
import { useScanContext } from '../context/ScanContext';

const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
);

const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
    </svg>
);

interface SocialTrendsPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

import TokenDetailModal from './TokenDetailModal';

const SocialTrendsPage: React.FC<SocialTrendsPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { socialTrends, scanSocialTrends } = useScanContext();
    const { tokens, sources, isLoading, error, hasScanned, history } = socialTrends;
    const [selectedToken, setSelectedToken] = React.useState<Token | null>(null);

    const handleScan = () => {
        scanSocialTrends(true);
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
                    <h3 className="text-2xl font-bold text-white">Silence on the Waves</h3>
                    <p className="mt-2 text-slate-400">The AI couldn't find verifiable viral tokens on Base at this moment. Try again soon.</p>
                </div>
            );
        }
        if (!hasScanned) {
            return (
                <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <img src="/assets/social_fire.png" alt="Hype" className="w-24 h-24 mx-auto object-contain drop-shadow-2xl" />
                    <h3 className="mt-4 text-2xl font-bold text-white">Listen to the Hype</h3>
                    <p className="mt-2 text-slate-400">Scan X (Twitter) and Farcaster for tokens dominating the conversation right now.</p>
                </div>
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
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                    Social <span className="bg-gradient-to-r from-blue-400 to-sky-300 text-transparent bg-clip-text">Trends & Hype</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-400">
                    Real-time analysis of what's viral. Verified contracts only.
                </p>
                <div className="mt-8">
                    <button
                        onClick={handleScan}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-full shadow-lg shadow-blue-500/50 transform transition-all duration-300 hover:bg-blue-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                    >
                        {isLoading ? (
                            'Listening...'
                        ) : hasScanned ? (
                            <>
                                <RefreshIcon className="w-6 h-6 mr-3 -ml-2" />
                                Refresh Trends
                            </>
                        ) : (
                            'Scan Socials'
                        )}
                    </button>
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
                        <h2 className="text-3xl font-bold text-white">Trend History</h2>
                        <p className="text-slate-400">Previous social scans from this session.</p>
                    </div>
                    <div className="max-w-7xl mx-auto space-y-4">
                        {history.map((scan, index) => (
                            <HistoryAccordion
                                key={index}
                                title={`Trends from ${scan.timestamp.toLocaleString()} (${scan.tokens.length} ${scan.tokens.length === 1 ? 'trend' : 'trends'} found)`}
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

export default SocialTrendsPage;
