import React, { useState, useCallback } from 'react';
import { getAnalystPicks } from '../services/geminiService';
import { Token, GroundingChunk, ScanResult } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import HistoryAccordion from './HistoryAccordion';

const CrystalBallIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M11.25 3.255a2.25 2.25 0 013.5 0 2.25 2.25 0 012.25 2.25c0 .546-.225 1.055-.598 1.43l-1.45 1.45a.75.75 0 01-1.06-1.06l1.22-1.22a.75.75 0 00-.53-1.28h-2.552a.75.75 0 00-.532 1.28l1.222 1.22a.75.75 0 01-1.06 1.06l-1.45-1.45A2.25 2.25 0 019 5.505a2.25 2.25 0 012.25-2.25z" />
    <path fillRule="evenodd" d="M12.96 11.41a3.375 3.375 0 10-5.92 1.487 3.374 3.374 0 005.92-1.487zm-1.474 3.75a.75.75 0 001.06-1.06l-1.05-1.05a.75.75 0 111.06-1.06l1.05 1.05a.75.75 0 001.06-1.06l-1.05-1.05a.75.75 0 111.06-1.06l1.05 1.05a.75.75 0 001.06-1.06l-1.05-1.05a3.375 3.375 0 10-5.908 1.517.75.75 0 001.06-1.06l-1.05-1.05a.75.75 0 111.06-1.06l1.05 1.05a.75.75 0 001.06-1.06l-1.05-1.05a.75.75 0 111.06-1.06l1.05 1.05a.75.75 0 001.06-1.06L14.48 9.34a3.375 3.375 0 00-4.028-4.028l-1.05 1.05a.75.75 0 001.06 1.06L11.52 6.36a.75.75 0 00-1.06 1.06l-1.05 1.05a.75.75 0 001.06 1.06l1.05-1.05a.75.75 0 001.06 1.06l-1.05 1.05a.75.75 0 001.06 1.06l1.05-1.05a.75.75 0 001.06 1.06l-1.05 1.05a.75.75 0 001.06 1.06l1.05-1.05a.75.75 0 001.06 1.06l-2.12 2.12a.75.75 0 000 1.06l2.12 2.12a.75.75 0 001.06 0l2.12-2.12a.75.75 0 000-1.06l-2.12-2.12a.75.75 0 00-1.06 0L12 12.02l.53.53a.75.75 0 001.06-1.06L12.02 10l.53.53a.75.75 0 001.06-1.06L12.02 8.94l.53.53a.75.75 0 101.06-1.06l-2.12-2.12a.75.75 0 00-1.06 0L9.36 7.41a.75.75 0 000 1.06l2.12 2.12a.75.75 0 001.06 0l.53-.53z" clipRule="evenodd" />
    <path d="M6 18a.75.75 0 00.75.75h10.5a.75.75 0 000-1.5H6.75a.75.75 0 00-.75.75z" />
  </svg>
);

const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-11.664 0l3.181-3.183a8.25 8.25 0 00-11.664 0l3.181 3.183" />
    </svg>
  );

interface AnalystPicksPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const AnalystPicksPage: React.FC<AnalystPicksPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const [tokens, setTokens] = useState<Token[]>([]);
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState<boolean>(false);
    const [history, setHistory] = useState<ScanResult[]>([]);
    const [scanTime, setScanTime] = useState<Date | null>(null);

    const handleScan = useCallback(async () => {
        if (tokens.length > 0 && scanTime) {
            setHistory(prev => [{ timestamp: scanTime, tokens, sources }, ...prev]);
        }

        setIsLoading(true);
        setError(null);
        setTokens([]);
        setSources([]);
        setHasScanned(true);

        try {
            const { tokens: foundTokens, sources: foundSources } = await getAnalystPicks();
            setTokens(foundTokens);
            setSources(foundSources);
            setScanTime(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while getting analyst picks.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [tokens, sources, scanTime]);

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
                    <h3 className="text-2xl font-bold text-white">No Strong Feelings Right Now</h3>
                    <p className="mt-2 text-slate-400">The analyst AI scanned the latest projects but didn't find any with a compelling enough narrative to feature. Check back soon for new insights!</p>
                </div>
            );
        }
        if (!hasScanned) {
            return (
                <div className="text-center py-16 px-6 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <CrystalBallIcon className="w-16 h-16 mx-auto text-purple-400" />
                    <h3 className="mt-4 text-2xl font-bold text-white">Consult the Analyst?</h3>
                    <p className="mt-2 text-slate-400">Click the button to get the AI's latest high-conviction, narrative-driven picks.</p>
                </div>
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
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
                    Analyst's <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">High-Conviction Picks</span>
                </h1>
                <p className="mt-4 text-lg md:text-xl text-slate-400">
                    High-risk, high-reward projects based on the AI's "gut feeling". These picks are chosen for their strong narrative and potential, not just on-chain metrics.
                </p>
                <div className="mt-8">
                    <button
                        onClick={handleScan}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center px-8 py-4 bg-purple-600 text-white font-bold text-lg rounded-full shadow-lg shadow-purple-500/50 transform transition-all duration-300 hover:bg-purple-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
                    >
                        {isLoading ? (
                            'Analyzing...'
                        ) : hasScanned ? (
                            <>
                                <RefreshIcon className="w-6 h-6 mr-3 -ml-2" />
                                Get New Picks
                            </>
                        ) : (
                            "Get Analyst's Picks"
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
                        <h2 className="text-3xl font-bold text-white">Pick History</h2>
                        <p className="text-slate-400">Previous analyst picks from this session.</p>
                    </div>
                    <div className="max-w-7xl mx-auto space-y-4">
                        {history.map((scan, index) => (
                            <HistoryAccordion
                                key={index}
                                title={`Picks from ${scan.timestamp.toLocaleString()} (${scan.tokens.length} ${scan.tokens.length === 1 ? 'pick' : 'picks'} found)`}
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
        </>
    )
}

export default AnalystPicksPage;