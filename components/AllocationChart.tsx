import React from 'react';
import { Token } from '../types';

interface AllocationChartProps {
    tokens: Token[];
}

const AllocationChart: React.FC<AllocationChartProps> = ({ tokens }) => {
    const holdings = tokens.filter(t => (t.holdings || 0) > 0);

    if (holdings.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <p className="text-slate-400">No holdings to display</p>
            </div>
        );
    }

    const totalValue = holdings.reduce((sum, t) => sum + ((t.holdings || 0) * t.priceUsd), 0);

    // Calculate segments
    let cumulativePercent = 0;
    const segments = holdings.map((token, index) => {
        const value = (token.holdings || 0) * token.priceUsd;
        const percent = value / totalValue;
        const startPercent = cumulativePercent;
        cumulativePercent += percent;

        return {
            token,
            value,
            percent,
            startPercent,
            color: getColor(index)
        };
    });

    // Helper to get coordinates for a slice
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <h3 className="text-xl font-bold text-white mb-6">Allocation</h3>

            <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Pie Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
                        {segments.map((segment, i) => {
                            const [startX, startY] = getCoordinatesForPercent(segment.startPercent);
                            const [endX, endY] = getCoordinatesForPercent(segment.startPercent + segment.percent);

                            // If it's a full circle (single asset), draw a circle
                            if (segment.percent > 0.99) {
                                return (
                                    <circle key={segment.token.address} cx="0" cy="0" r="1" fill={segment.color} />
                                );
                            }

                            const largeArcFlag = segment.percent > 0.5 ? 1 : 0;

                            const pathData = [
                                `M 0 0`,
                                `L ${startX} ${startY}`,
                                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                `Z`
                            ].join(' ');

                            return (
                                <path
                                    key={segment.token.address}
                                    d={pathData}
                                    fill={segment.color}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                >
                                    <title>{`${segment.token.symbol}: ${(segment.percent * 100).toFixed(1)}%`}</title>
                                </path>
                            );
                        })}
                    </svg>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full">
                    <div className="space-y-3">
                        {segments.map((segment) => (
                            <div key={segment.token.address} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                                    <span className="text-slate-300 font-medium">{segment.token.symbol}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold">{(segment.percent * 100).toFixed(1)}%</div>
                                    <div className="text-xs text-slate-500">${segment.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple color palette generator
const getColor = (index: number) => {
    const colors = [
        '#6366f1', // Indigo
        '#ec4899', // Pink
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#3b82f6', // Blue
        '#8b5cf6', // Violet
        '#ef4444', // Red
        '#14b8a6', // Teal
    ];
    return colors[index % colors.length];
};

export default AllocationChart;
