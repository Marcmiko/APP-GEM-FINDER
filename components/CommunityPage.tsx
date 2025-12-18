import React, { useState } from 'react';
import { Token } from '../types';
import { analyzeSpecificToken } from '../services/geminiService';
import TokenCard from './TokenCard';

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122z" />
    </svg>
);

const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.817 4.423a2.89 2.89 0 00-1.634 0L4.504 6.338A2.89 2.89 0 003 9.17v11.83A.75.75 0 003.75 21.75h16.5a.75.75 0 00.75-.75V9.17a2.89 2.89 0 00-1.504-2.832l-6.679-1.915zM20.25 9.17v11.08H3.75V9.17a1.39 1.39 0 01.724-1.362l6.678-1.915a1.39 1.39 0 01.796 0l6.678 1.915a1.39 1.39 0 01.724 1.362z" />
    </svg>
);

const BoltIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" />
    </svg>
);

interface CommunityPageProps {
    savedTokens: Token[];
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ savedTokens, onSave, onUnsave }) => {
    const [submission, setSubmission] = useState('');
    const [analyzedToken, setAnalyzedToken] = useState<Token | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submission.trim()) return;

        setIsLoading(true);
        setError(null);
        setAnalyzedToken(null);

        try {
            const result = await analyzeSpecificToken(submission);
            if (result.tokens.length > 0) {
                setAnalyzedToken(result.tokens[0]);
            } else {
                setError("Token not found. Please try a different symbol or address.");
            }
        } catch (err) {
            setError("Failed to analyze token. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section: Vision & Goal */}
            <section className="relative overflow-hidden rounded-3xl bg-slate-800/50 border border-white/5 p-8 md:p-12">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                        Our Vision: <span className="text-indigo-400">Collective Intelligence</span>
                    </h1>
                    <p className="text-lg text-slate-300 leading-relaxed mb-8">
                        MARCMIKO Intelligence isn't just a tool; it's an ecosystem designed to democratize web3 alpha.
                        Our goal is to combine state-of-the-art AI analysis with human intuition to find the next generation
                        of "Gems" before the crowd.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <RocketIcon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Empowering Hunters</h3>
                                <p className="text-sm text-slate-400">Tools to identify and analyze tokens with surgical precision.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <BoltIcon className="w-6 h-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold mb-1">Real-Time Alpha</h3>
                                <p className="text-sm text-slate-400">Processing millions of data points to deliver actionable insights.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Community & Rewards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="p-8 rounded-3xl bg-slate-800/30 border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <UsersIcon className="w-8 h-8 text-indigo-400" />
                        <h2 className="text-2xl font-black text-white">The Community</h2>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        We are building a community of elite "Gem Hunters". By sharing your discoveries, you help
                        the entire ecosystem grow. Collective intelligence is stronger than any single algorithm.
                    </p>
                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                        <h4 className="text-indigo-300 font-bold mb-2">Why join us?</h4>
                        <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                            <li>Access to exclusive AI-vetted lists</li>
                            <li>Early signals from other top hunters</li>
                            <li>A platform to validate your own thesis</li>
                        </ul>
                    </div>
                </section>

                <section className="p-8 rounded-3xl bg-slate-800/30 border border-white/5 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
                            <span className="text-amber-500 font-black">$</span>
                        </div>
                        <h2 className="text-2xl font-black text-white">Crypto Rewards</h2>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        That's why we're launching a native crypto token to reward our contributors.
                        Top hunters who find successful gems will be rewarded with tokens, creating a
                        true "Scan-to-Earn" economy.
                    </p>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex-1">
                            <p className="text-xs text-amber-500/70 font-bold uppercase tracking-widest">Coming Soon</p>
                            <p className="text-white font-bold">$MARC Governance & Rewards</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase">
                            Phase 2
                        </div>
                    </div>
                </section>
            </div>

            {/* Gem Submission Section */}
            <section className="space-y-8">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <h2 className="text-3xl font-black text-white">Share a New Gem</h2>
                    <p className="text-slate-400">
                        Found something interesting? Enter the symbol or address below to get an instant AI analysis and score.
                        The best projects will be shared with the entire community.
                    </p>
                </div>

                <div className="max-w-xl mx-auto">
                    <form onSubmit={handleSubmit} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
                        <div className="relative flex items-center bg-slate-900 rounded-2xl p-2 border border-white/10">
                            <input
                                type="text"
                                value={submission}
                                onChange={(e) => setSubmission(e.target.value)}
                                placeholder="Enter Symbol or Address (e.g. BRETT, 0x...)"
                                className="flex-1 bg-transparent border-none focus:ring-0 text-white px-4 py-3 placeholder:text-slate-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Analyzing...</span>
                                    </div>
                                ) : 'Analyze Gem'}
                            </button>
                        </div>
                    </form>
                    {error && <p className="mt-4 text-center text-rose-400 text-sm font-medium">{error}</p>}
                </div>

                {/* Analysis Result */}
                {analyzedToken && (
                    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-500">
                        <div className="text-center mb-8">
                            <span className="px-4 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                                AI Analysis Complete
                            </span>
                        </div>
                        <TokenCard
                            token={analyzedToken}
                            isSaved={savedTokens.some(t => t.address === analyzedToken.address)}
                            onSave={() => onSave(analyzedToken)}
                            onUnsave={() => onUnsave(analyzedToken)}
                        />
                    </div>
                )}
            </section>

            {/* Top Community Gems (Placeholder for now) */}
            <section className="space-y-6 pt-12 border-t border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-white">Top Shared Projects</h2>
                        <p className="text-slate-400 text-sm">Most promising tokens shared by the community this week.</p>
                    </div>
                </div>

                <div className="bg-slate-800/20 rounded-3xl p-12 border border-dashed border-white/10 text-center">
                    <p className="text-slate-500 font-medium">Community feed will go live after the $MARC token launch.</p>
                </div>
            </section>
        </div>
    );
};

export default CommunityPage;
