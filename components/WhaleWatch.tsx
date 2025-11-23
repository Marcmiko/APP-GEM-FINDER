
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWhaleAlerts, WhaleAlert } from '../services/WhaleWatchService';

const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 01.75.75v5.25a.75.75 0 01-1.5 0V4.81L8.03 17.03a.75.75 0 01-1.06-1.06L19.19 3.75h-3.44a.75.75 0 010-1.5zm-10.5 4.5a1.5 1.5 0 00-1.5 1.5v10.5a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5V10.5a.75.75 0 011.5 0v8.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V8.25a3 3 0 013-3h8.25a.75.75 0 010 1.5H5.25z" clipRule="evenodd" />
    </svg>
);

const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);

const WhaleWatch: React.FC = () => {
    const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            setLoading(true);
            const data = await getWhaleAlerts();
            setAlerts(data);
            setLoading(false);
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    const handleShare = async (alert: WhaleAlert) => {
        const shareData = {
            title: `Whale Alert: ${alert.tokenSymbol} on Base!`,
            text: `🚨 WHALE ALERT 🚨\n${alert.message}\nFound on Base Gem Finder.`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
            // alert('Alert copied to clipboard!'); // Optional: toast would be better but alert is fine for MVP
        }
    };

    if (loading && alerts.length === 0) {
        return (
            <div className="p-6 bg-gray-900/50 rounded-xl border border-gray-800 animate-pulse">
                <div className="h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-800/50 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🐋 Whale Watch <span className="text-xs font-normal text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">Live on Base</span>
                </h2>
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            </div>

            <div className="max-h-[400px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <AnimatePresence>
                    {alerts.map((alert, index) => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 transition-colors flex items-center gap-3 group cursor-pointer"
                        >
                            <div className={`p-2 rounded-full ${alert.type === 'BUY' ? 'bg-green-500/20 text-green-400' :
                                alert.type === 'SELL' ? 'bg-red-500/20 text-red-400' :
                                    alert.type === 'LIQUIDITY_ADD' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-purple-500/20 text-purple-400'
                                }`}>
                                {alert.type === 'BUY' && '💰'}
                                {alert.type === 'SELL' && '📉'}
                                {alert.type === 'LIQUIDITY_ADD' && '💧'}
                                {alert.type === 'VOLUME_SPIKE' && '📊'}
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-200 text-sm">{alert.tokenSymbol}</h3>
                                    <span className="text-xs text-gray-500">{getTimeAgo(alert.timestamp)}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5 group-hover:text-gray-300 transition-colors">
                                    {alert.message}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {alert.url && (
                                    <a
                                        href={alert.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="View on DexScreener"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" />
                                    </a>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleShare(alert);
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Share Alert"
                                >
                                    <ShareIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {alerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No major movements detected recently.
                    </div>
                )}
            </div>
        </div>
    );
};

function getTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

export default WhaleWatch;
