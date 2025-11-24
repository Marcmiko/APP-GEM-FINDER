
import React, { useState } from 'react';
import { Token } from '../types';
import TokenCard from './TokenCard';
import LoadingState from './LoadingState';
import { useScanContext } from '../context/ScanContext';

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface TokenAnalyzerPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

import TokenDetailModal from './TokenDetailModal';

const TokenAnalyzerPage: React.FC<TokenAnalyzerPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const { tokenAnalyzer, analyzeToken } = useScanContext();
    const { tokens, sources, isLoading, error } = tokenAnalyzer;
    const [query, setQuery] = useState('');
    const [selectedToken, setSelectedToken] = useState<Token | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            analyzeToken(query);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                    Token <span className="bg-gradient-to-r from-orange-400 to-red-500 text-transparent bg-clip-text">Deep Analyzer</span>
                </h1>
                <p className="mt-4 text-lg text-slate-400">
                    Enter a contract address, name, or ticker to get a comprehensive AI report.
                </p>
            </div>

            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-16">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g. 0x123... or $TOSHI"
                        className="w-full bg-slate-800/80 border border-slate-600 text-white text-lg rounded-full py-4 pl-6 pr-16 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 shadow-xl transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!query.trim() || isLoading}
                        className="absolute right-2 p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                        <SearchIcon className="w-6 h-6" />
                    </button>
                </div>
            </form>

            {isLoading ? (
                <div className="mt-8">
                    <LoadingState />
                    <p className="text-center text-slate-400 mt-4">Investigating {query}...</p>
                </div>
            ) : error ? (
                <div className="text-center text-red-400 bg-red-900/20 border border-red-900/50 p-6 rounded-xl">
                    <p className="font-semibold">Analysis Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            ) : tokens.length > 0 ? (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-6">
                        {tokens.map((token) => {
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

                    {sources.length > 0 && (
                        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Sources Verified</h4>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {sources.map((source, index) => (
                                    source.web && (
                                        <li key={index}>
                                            <a
                                                href={source.web.uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-400 hover:text-indigo-300 text-xs truncate block"
                                            >
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-500">
                    <p>Ready to audit. Enter a token above.</p>
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
        </div>
    );
};

export default TokenAnalyzerPage;
