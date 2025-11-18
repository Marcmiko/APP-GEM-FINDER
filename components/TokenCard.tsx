
import React, { useState } from 'react';
import { Token, TechnicalIndicators } from '../types';

// --- ICONS ---
const VerifiedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);
const WarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.006a1 1 0 01-1 1h-.008a1 1 0 01-1-1V5z" clipRule="evenodd" /></svg>
);
const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
);
const BullIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
);
const BearIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
);
const WebsiteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9 9 9 0 019-9m9 9a9 9 0 01-9 9m-9-9h18m-9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9-3 4.03-3 9 1.343 9 3 9z" />
    </svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);
const CMCIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM10.21 8.21l1.59 1.59 1.59-1.59L15.3 10.12l-1.59 1.59 1.59 1.59-1.91 1.91-1.59-1.59-1.59 1.59-1.91-1.91 1.59-1.59-1.59-1.59 1.91-1.91z" />
    </svg>
);
const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" /></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
);
const BookmarkIcon: React.FC<React.SVGProps<SVGSVGElement> & { saved: boolean }> = ({ saved, ...props }) => (
    saved ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
    )
);

// --- VERDICT ICONS ---
const VerdictStrongBuy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>);
const VerdictPotentialBuy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 6a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 6zM5 8.75a.75.75 0 000 1.5h10a.75.75 0 000-1.5H5z" /></svg>);
const VerdictMonitor: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l.88-1.473a1.65 1.65 0 011.295-.976l1.507-.22a1.65 1.65 0 011.539 1.053l.493 1.285a1.65 1.65 0 01-.22 1.652l-1.042 1.256a1.65 1.65 0 01-1.652.22l-1.285-.493a1.65 1.65 0 01-1.053-1.54l.22-1.506a1.65 1.65 0 01.976-1.295l1.473-.88-.88 1.473a.165.165 0 00-.13.098l-.493 1.285a.165.165 0 00.022.165l1.042 1.256a.165.165 0 00.165.022l1.285-.493a.165.165 0 00.106-.153l-.22-1.507a.165.165 0 00-.098-.129l-1.473-.88c.32.13.609.313.86.54l1.473.88a1.651 1.651 0 011.295.976l.22 1.506a1.65 1.65 0 01-1.053 1.54l-1.285.493a1.65 1.65 0 01-1.652-.22l-1.042-1.256a1.65 1.65 0 01.22-1.652l.493-1.285a1.65 1.65 0 011.54-1.053l1.506.22a1.65 1.65 0 01.976 1.295l.88 1.473c.443.74.443 1.62 0 2.36l-.88 1.473a1.65 1.65 0 01-1.295.976l-1.506.22a1.65 1.65 0 01-1.54-1.053l-.493-1.285a1.65 1.65 0 01.22-1.652l1.042-1.256a1.65 1.65 0 011.652-.22l1.285.493a1.65 1.65 0 011.053 1.54l-.22 1.506a1.65 1.65 0 01-.976 1.295l-1.473-.88c-.74.443-1.62.443-2.36 0l-1.473-.88a1.65 1.65 0 01-.976-1.295l-.22-1.506a1.65 1.65 0 011.053-1.54l1.285-.493a1.65 1.65 0 011.652.22l1.042 1.256a1.65 1.65 0 01-.22 1.652l-.493 1.285a1.65 1.65 0 01-1.54 1.053l-1.506-.22a1.65 1.65 0 01-.976-1.295l-.88-1.473a1.651 1.651 0 010-2.36z" clipRule="evenodd" /></svg>);
const VerdictHighRisk: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M11.983 1.904a.75.75 0 00-1.292-.752l-6.5 11.25a.75.75 0 00.645 1.102h4.817a.75.75 0 01.628.324l-2.5 4.5a.75.75 0 001.292.752l6.5-11.25a.75.75 0 00-.645-1.102h-4.817a.75.75 0 01-.628-.324l2.5-4.5z" /></svg>);
const VerdictAvoid: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>);


// --- PROPS & COMPONENTS ---
interface TokenCardProps {
  token: Token;
  isSaved: boolean;
  onSave: (token: Token) => void;
  onUnsave: (token: Token) => void;
}

const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
        case 'Strong Buy': return { style: "bg-green-500/10 text-green-400 border-green-500/30", icon: <VerdictStrongBuy className="w-5 h-5" /> };
        case 'Potential Buy': return { style: "bg-sky-500/10 text-sky-400 border-sky-500/30", icon: <VerdictPotentialBuy className="w-5 h-5" /> };
        case 'Monitor': return { style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: <VerdictMonitor className="w-5 h-5" /> };
        case 'High Risk': return { style: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: <VerdictHighRisk className="w-5 h-5" /> };
        case 'Avoid': return { style: "bg-red-500/10 text-red-400 border-red-500/30", icon: <VerdictAvoid className="w-5 h-5" /> };
        case 'New Listing': return { style: "bg-slate-700 text-slate-300 border-slate-600", icon: <InfoIcon className="w-5 h-5" /> };
        default: return { style: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: <BearIcon className="w-5 h-5" /> };
    }
}

const IconPlaceholder: React.FC<{ symbol?: string }> = ({ symbol }) => (
    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-400 text-lg flex-shrink-0">
        {symbol ? symbol.charAt(0).toUpperCase() : '?'}
    </div>
);

const AnalysisSection: React.FC<{ title: string; content: string; icon: React.ReactNode; iconClass: string;}> = ({ title, content, icon, iconClass }) => {
    if (content === 'N/A') return null;
    return (
        <div>
            <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 ${iconClass}`}>{icon}</div>
                <h4 className="text-sm font-semibold text-slate-300">{title}</h4>
            </div>
            <p className="mt-1 pl-7 text-sm text-slate-400">{content}</p>
        </div>
    );
}

const TechnicalSection: React.FC<{ indicators?: TechnicalIndicators }> = ({ indicators }) => {
    if (!indicators || (!indicators.rsi && !indicators.macd)) return null;

    // RSI Color Logic
    const getRsiColor = (rsi: number) => {
        if (rsi >= 70) return 'bg-red-500'; // Overbought
        if (rsi <= 30) return 'bg-green-500'; // Oversold
        return 'bg-indigo-500'; // Neutral
    };
    
    // RSI Value Display Color
    const getRsiTextColor = (rsi: number) => {
        if (rsi >= 70) return 'text-red-400';
        if (rsi <= 30) return 'text-green-400';
        return 'text-indigo-400';
    }

    return (
        <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v8a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v4a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 0010.5 6h-1zM3.5 10a1.5 1.5 0 00-1.5 1.5v.5a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-.5a1.5 1.5 0 00-1.5-1.5h-1z" />
                </svg>
                Technical Indicators
            </h4>
            <div className="grid grid-cols-1 gap-3">
                {indicators.rsi !== null && (
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 font-medium">RSI (14)</span>
                            <span className={`font-mono font-bold ${getRsiTextColor(indicators.rsi)}`}>{indicators.rsi}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${getRsiColor(indicators.rsi)}`} 
                                style={{ width: `${Math.min(Math.max(indicators.rsi, 0), 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                            <span>Oversold (Buy)</span>
                            <span>Overbought (Sell)</span>
                        </div>
                    </div>
                )}
                
                {(indicators.macd || indicators.movingAverages) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {indicators.macd && (
                             <div className="bg-slate-800 rounded px-2 py-1.5">
                                <span className="block text-[10px] text-slate-500 uppercase">MACD</span>
                                <span className="text-xs font-medium text-white truncate" title={indicators.macd}>{indicators.macd}</span>
                            </div>
                        )}
                         {indicators.movingAverages && (
                             <div className="bg-slate-800 rounded px-2 py-1.5">
                                <span className="block text-[10px] text-slate-500 uppercase">Trend (MA)</span>
                                <span className="text-xs font-medium text-white truncate" title={indicators.movingAverages}>{indicators.movingAverages}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const SecurityCheck: React.FC<{ label: string; isSecure: boolean }> = ({ label, isSecure }) => {
    const Icon = isSecure ? VerifiedIcon : WarningIcon;
    const color = isSecure ? 'text-green-400' : 'text-amber-400';
    return (
        <div className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm text-slate-300">{label}</span>
        </div>
    );
};

const formatNumber = (num?: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, isSaved, onSave, onUnsave }) => {
  const [imgError, setImgError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const verdictStyle = getVerdictStyle(token.analysis?.verdict || 'N/A');
  const displayName = token.name || `${token.address.substring(0, 6)}...${token.address.substring(token.address.length - 4)}`;
  const displaySymbol = token.symbol || '???';

  const hasConvictionScore = token.convictionScore && token.convictionScore > 0;
  const score = hasConvictionScore ? token.convictionScore : token.gemScore;
  const scoreLabel = hasConvictionScore ? 'Conviction' : 'Gem Score';
  const scoreColorClass = hasConvictionScore ? 'text-purple-400' : 'text-indigo-400';

  const handleCopyAddress = () => {
    if (!token.address) return;
    navigator.clipboard.writeText(token.address).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
        console.error('Failed to copy address: ', err);
    });
  };

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
        onUnsave(token);
    } else {
        onSave(token);
    }
  };

  return (
    <div className="relative bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.02] hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20">
      <button 
        onClick={handleSaveToggle}
        title={isSaved ? "Unsave Project" : "Save Project"}
        aria-label={isSaved ? "Unsave this project" : "Save this project"}
        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10 p-1"
      >
          <BookmarkIcon saved={isSaved} className="w-6 h-6" />
      </button>

      <div>
        <div className="flex justify-between items-start gap-4">
            <div className="flex items-center space-x-3 min-w-0">
                {token.iconUrl && !imgError ? (
                    <img
                        src={token.iconUrl}
                        alt={`${token.name} icon`}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <IconPlaceholder symbol={token.symbol} />
                )}
                <div className="min-w-0">
                    <h3 className="text-xl font-bold text-white truncate" title={token.name || token.address}>{displayName}</h3>
                    <div className="flex items-center gap-2">
                        <p className="text-indigo-400 font-mono text-sm">${displaySymbol}</p>
                        <button 
                            onClick={handleCopyAddress}
                            title={isCopied ? "Copied!" : "Copy Address"}
                            aria-label={isCopied ? "Address copied to clipboard" : "Copy token address"}
                            className="text-slate-500 hover:text-white transition-colors duration-200"
                        >
                            {isCopied ? (
                                <CheckIcon className="w-4 h-4 text-green-400" />
                            ) : (
                                <CopyIcon className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            { score > 0 && 
              <div className="flex items-center space-x-2 bg-slate-700/50 px-3 py-1.5 rounded-full flex-shrink-0">
                  <div className="relative flex items-center justify-center">
                      <svg className="transform -rotate-90 w-10 h-10">
                          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-600" />
                          <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent"
                              strokeDasharray={100.5}
                              strokeDashoffset={100.5 - (score / 100) * 100.5}
                              className={scoreColorClass} />
                      </svg>
                      <span className="absolute text-sm font-bold text-white">{score}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300">{scoreLabel}</span>
              </div>
            }
        </div>
        
        <p className="mt-4 text-sm text-slate-300 italic border-l-2 border-indigo-500 pl-3">
          {token.analysis?.summary || "No summary provided by AI."}
        </p>

        <div className="mt-4 space-y-3">
             <AnalysisSection 
                title="Strengths (Bull Case)"
                content={token.analysis?.strengths || "No strengths analysis available."}
                iconClass="text-green-400"
                icon={<BullIcon />}
            />
            <AnalysisSection 
                title="Risks & Concerns (Bear Case)"
                content={token.analysis?.risks || "No risk analysis available."}
                iconClass="text-amber-400"
                icon={<BearIcon />}
            />
            
            {/* Technical Analysis Section */}
            <TechnicalSection indicators={token.technicalIndicators} />

             <div className={`p-3 rounded-lg border mt-3 ${verdictStyle.style}`}>
                <div className="flex items-center space-x-2">
                    {verdictStyle.icon}
                    <h4 className="text-sm font-bold">AI Verdict: {token.analysis?.verdict || 'Not Rated'}</h4>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Market Cap:</span> <span className="text-white font-medium">{formatNumber(token.marketCap)}</span></div>
            <div><span className="text-slate-500">Liquidity:</span> <span className="text-white font-medium">{formatNumber(token.liquidity)}</span></div>
            <div><span className="text-slate-500">Volume (24h):</span> <span className="text-white font-medium">{formatNumber(token.volume24h)}</span></div>
            <div><span className="text-slate-500">Holders:</span> <span className="text-white font-medium">{token.holders?.toLocaleString() || 'N/A'}</span></div>
            <div className="col-span-2"><span className="text-slate-500">Created:</span> <span className="text-white font-medium">{token.creationDate || 'N/A'}</span></div>
        </div>

        <div className="mt-6 border-t border-slate-700 pt-4 space-y-3">
          <SecurityCheck label="Liquidity Locked" isSecure={!!token.isLiquidityLocked} />
          <SecurityCheck label="Ownership Renounced" isSecure={!!token.isOwnershipRenounced} />
        </div>

        <div className="mt-4 border-t border-slate-700 pt-4 space-y-2">
            <a 
                href={`https://basescan.org/token/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors w-full bg-slate-700/50 hover:bg-slate-700 rounded-lg py-2 px-4"
            >
                <span>Basescan</span>
                <ExternalLinkIcon className="w-4 h-4" />
            </a>
            {token.websiteUrl && (
              <a 
                  href={token.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-sm text-slate-300 hover:text-white transition-colors w-full bg-slate-700/50 hover:bg-slate-700 rounded-lg py-2 px-4"
              >
                  <WebsiteIcon className="w-4 h-4" />
                  <span>Website</span>
              </a>
            )}
            {token.xUrl && (
              <a 
                  href={token.xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-sm text-sky-400 hover:text-sky-300 transition-colors w-full bg-slate-700/50 hover:bg-slate-700 rounded-lg py-2 px-4"
              >
                  <XIcon className="w-4 h-4" />
                  <span>X (Twitter)</span>
              </a>
            )}
            {token.coinMarketCapUrl && (
              <a 
                  href={token.coinMarketCapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-sm text-orange-400 hover:text-orange-300 transition-colors w-full bg-slate-700/50 hover:bg-slate-700 rounded-lg py-2 px-4"
              >
                  <CMCIcon className="w-4 h-4" />
                  <span>CoinMarketCap</span>
              </a>
            )}
        </div>
      </div>
    </div>
  );
};

export default TokenCard;
