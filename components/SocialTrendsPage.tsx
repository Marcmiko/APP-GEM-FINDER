
import React from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import HistoryAccordion from './HistoryAccordion';
import { useScanContext } from '../context/ScanContext';

const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 018.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
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
                    <MegaphoneIcon className="w-16 h-16 mx-auto text-blue-400" />
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
