import React from 'react';
import { PortfolioMetrics, formatCurrency, formatPercent, getChangeColor } from '../utils/portfolioCalculations';

interface PortfolioMetricsProps {
    metrics: PortfolioMetrics;
    lastUpdate: number | null;
}

const PortfolioMetricsComponent: React.FC<PortfolioMetricsProps> = ({ metrics, lastUpdate }) => {
    const formatLastUpdate = () => {
        if (!lastUpdate) return 'Never';
        const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ago`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total PnL */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">Total PnL</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                        <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.totalPnL)}`}>
                    {formatCurrency(metrics.totalPnL)}
                </div>
                <div className={`text-sm ${getChangeColor(metrics.totalPnLPercent)}`}>
                    {formatPercent(metrics.totalPnLPercent)}
                </div>
            </div>

            {/* 24h Change */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">24h Change</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.change24h)}`}>
                    {formatCurrency(metrics.change24h)}
                </div>
                <div className={`text-sm ${getChangeColor(metrics.change24hPercent)}`}>
                    {formatPercent(metrics.change24hPercent)}
                </div>
            </div>

            {/* Last Update */}
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-sm font-medium">Last Update</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                        <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="text-2xl font-bold text-white">
                    {formatLastUpdate()}
                </div>
                <div className="text-sm text-slate-400">
                    Auto-refresh: 60s
                </div>
            </div>

            {/* Top Performers */}
            {metrics.topGainers.length > 0 && (
                <div className="md:col-span-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-400">
                            <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-semibold">Top Gainers (24h)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {metrics.topGainers.map((token, idx) => (
                            <div key={token.address} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-bold">#{idx + 1}</span>
                                    <span className="font-semibold text-white">{token.symbol}</span>
                                </div>
                                <span className="text-green-400 font-bold">
                                    {formatPercent(token.priceChange24h || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Worst Performers */}
            {metrics.topLosers.length > 0 && (
                <div className="md:col-span-3 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                    <div className="flex items-center gap-2 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-400">
                            <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                        <span className="text-white font-semibold">Top Losers (24h)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {metrics.topLosers.map((token, idx) => (
                            <div key={token.address} className="flex items-center justify-between bg-slate-700/30 rounded-xl p-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 font-bold">#{idx + 1}</span>
                                    <span className="font-semibold text-white">{token.symbol}</span>
                                </div>
                                <span className="text-red-400 font-bold">
                                    {formatPercent(token.priceChange24h || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioMetricsComponent;
