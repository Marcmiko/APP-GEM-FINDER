import React from 'react';

const AILoadingAnimation: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="relative w-48 h-48">
                {/* Outer Rotating Ring */}
                <div className="absolute inset-0 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>

                {/* Middle Pulse Ring */}
                <div className="absolute inset-4 border-2 border-purple-500/30 rounded-full animate-ping"></div>

                {/* Inner Core */}
                <div className="absolute inset-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.456-2.454L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </div>

                {/* Satellite Orbs */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.8)] animate-bounce delay-75"></div>
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 bg-pink-400 rounded-full shadow-[0_0_10px_rgba(244,114,182,0.8)] animate-bounce delay-150"></div>
                <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_10px_rgba(192,132,252,0.8)] animate-bounce delay-300"></div>
            </div>

            <div className="mt-12 text-center space-y-4">
                <h3 className="text-3xl font-black text-white tracking-widest uppercase animate-pulse">
                    AI Scanning Base Mainnet
                </h3>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-200"></span>
                </div>
                <p className="text-slate-400 text-lg font-medium max-w-sm mx-auto">
                    Retrieving on-chain data and analyzing whale movements...
                </p>
            </div>

            {/* Background Glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            </div>
        </div>
    );
};

export default AILoadingAnimation;
