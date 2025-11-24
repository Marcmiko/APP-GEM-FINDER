import React from 'react';
import { Token, TechnicalIndicators } from '../types';

// --- ICONS (Reused/Shared) ---
// Ideally these should be in a shared icons file, but for now we redefine or import if possible.
// To save space and avoid duplication, I'll assume we can copy the icon definitions or better yet, 
// let's just use simple SVGs here for the modal to ensure it's self-contained or refactor later.
// For speed, I will use the same SVG paths.

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const VerifiedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);

const WarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.006a1 1 0 01-1 1h-.008a1 1 0 01-1-1V5z" clipRule="evenodd" /></svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" /></svg>
);

interface TokenDetailModalProps {
    token: Token;
    isOpen: boolean;
    onClose: () => void;
}

const TokenDetailModal: React.FC<TokenDetailModalProps> = ({ token, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(token.address);
        // Ideally show a toast here, but for now just copy
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in relative">

                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md z-10 p-6 border-b border-slate-800 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {token.iconUrl ? (
                            <img src={token.iconUrl} alt={token.symbol} className="w-16 h-16 rounded-full shadow-lg ring-2 ring-indigo-500/20" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-indigo-400 text-2xl shadow-inner ring-1 ring-white/5">
                                {token.symbol[0]}
                            </div>
                        )}
                        <div>
                            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                                {token.name}
                                <span className="text-slate-500 text-lg font-medium">({token.symbol})</span>
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                    ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(8) : token.priceUsd.toFixed(4)}
                                </span>
                                {token.priceChange24h !== undefined && (
                                    <span className={`px-2 py-0.5 rounded-lg text-sm font-bold ${token.priceChange24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                        {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Analysis & Info */}
                    <div className="space-y-6">
                        {/* AI Analysis */}
                        <div className="bg-indigo-500/5 rounded-2xl p-6 border border-indigo-500/10">
                            <h3 className="text-lg font-bold text-indigo-400 mb-3 flex items-center gap-2">
                                🤖 AI Analysis
                            </h3>
                            <p className="text-slate-300 leading-relaxed text-base">
                                {token.aiAnalysis || "No detailed AI analysis available for this token."}
                            </p>
                        </div>

                        {/* Key Drivers & Risks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5">
                                <h4 className="text-sm font-bold text-sky-400 mb-2 uppercase tracking-wider">Key Drivers</h4>
                                <p className="text-sm text-slate-300">{token.keyDrivers || "N/A"}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/5">
                                <h4 className="text-sm font-bold text-rose-400 mb-2 uppercase tracking-wider">Risks</h4>
                                <p className="text-sm text-slate-300">{token.risks || "N/A"}</p>
                            </div>
                        </div>

                        {/* Security Checks */}
                        <div className="bg-slate-800/30 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                🛡️ Security Audit
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <SecurityItem label="Renounced Ownership" isSecure={token.securityChecks.renouncedOwnership} />
                                <SecurityItem label="Liquidity Locked" isSecure={token.securityChecks.liquidityLocked} />
                                <SecurityItem label="No Mint Function" isSecure={token.securityChecks.noMintFunction} />
                                <SecurityItem label="No Blacklist" isSecure={token.securityChecks.noBlacklist} />
                                <SecurityItem label="No Proxy" isSecure={token.securityChecks.noProxy} />
                            </div>
                            {token.auditReport && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-400 text-sm">Overall Score</span>
                                        <span className={`text-lg font-bold ${getScoreColor(token.auditReport.overallScore)}`}>
                                            {token.auditReport.overallScore}/100
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${getScoreColorBg(token.auditReport.overallScore)}`}
                                            style={{ width: `${token.auditReport.overallScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Metrics & Contract */}
                    <div className="space-y-6">
                        {/* Metrics Grid */}
                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-lg font-bold text-white mb-4">Token Metrics</h3>
                            <div className="space-y-4">
                                <MetricRow label="Market Cap" value={token.marketCap ? `$${token.marketCap.toLocaleString()}` : 'N/A'} />
                                <MetricRow label="24h Volume" value={token.volume24h ? `$${token.volume24h.toLocaleString()}` : 'N/A'} />
                                <MetricRow label="Circulating Supply" value={token.circulatingSupply ? token.circulatingSupply.toLocaleString() : 'N/A'} />
                                <MetricRow label="Total Supply" value={token.totalSupply ? token.totalSupply.toLocaleString() : 'N/A'} />
                                <MetricRow label="Launch Date" value={token.creationDate ? new Date(token.creationDate).toLocaleDateString() : 'N/A'} />
                            </div>
                        </div>

                        {/* Buy Pressure */}
                        {token.buyPressure !== undefined && (
                            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-white">Buy Pressure</h3>
                                    <span className={`text-xl font-bold ${token.buyPressure > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {token.buyPressure}%
                                    </span>
                                </div>
                                <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${100 - token.buyPressure}%` }}></div>
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${token.buyPressure}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>Sellers</span>
                                    <span>Buyers</span>
                                </div>
                            </div>
                        )}

                        {/* Contract Address */}
                        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Contract Address</label>
                            <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/5">
                                <code className="text-indigo-300 font-mono text-sm truncate flex-1">
                                    {token.address}
                                </code>
                                <button
                                    onClick={handleCopyAddress}
                                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                >
                                    <CopyIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <a
                                href={`https://etherscan.io/token/${token.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
                            >
                                View on Explorer →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-mono font-medium">{value}</span>
    </div>
);

const SecurityItem: React.FC<{ label: string; isSecure: boolean }> = ({ label, isSecure }) => (
    <div className="flex items-center gap-2">
        {isSecure ? (
            <VerifiedIcon className="w-5 h-5 text-emerald-400" />
        ) : (
            <WarningIcon className="w-5 h-5 text-amber-400" />
        )}
        <span className={`text-sm ${isSecure ? 'text-slate-300' : 'text-amber-100'}`}>{label}</span>
    </div>
);

const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
};

const getScoreColorBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
};

export default TokenDetailModal;
