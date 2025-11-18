
import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Connecting to Base blockchain nodes...",
    "Scanning decentralized exchanges (DEXs)...",
    "Analyzing recent token deployments...",
    "Filtering for low market cap gems...",
    "Running AI-powered security checks...",
    "Evaluating tokenomics and holder distribution...",
    "Compiling potential gems... almost there!",
];

const LoadingState: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex(prevIndex => {
                if (prevIndex >= loadingMessages.length - 1) {
                    clearInterval(interval);
                    return prevIndex;
                }
                return prevIndex + 1;
            });
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-center p-8 space-y-4">
            <div className="relative inline-flex">
                <div className="w-16 h-16 bg-indigo-500 rounded-full"></div>
                <div className="w-16 h-16 bg-indigo-500 rounded-full absolute top-0 left-0 animate-ping"></div>
                <div className="w-16 h-16 bg-indigo-500 rounded-full absolute top-0 left-0 animate-pulse"></div>
            </div>
            <p className="text-lg font-medium text-slate-300 transition-opacity duration-500">
                {loadingMessages[messageIndex]}
            </p>
        </div>
    );
};

export default LoadingState;
