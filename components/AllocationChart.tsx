import React, { useMemo } from 'react';
import { Token } from '../types';
import { motion } from 'framer-motion';

interface AllocationChartProps {
    tokens: Token[];
}

const COLORS = [
    '#6366f1', // Indigo 500
    '#10b981', // Emerald 500
    '#f59e0b', // Amber 500
    '#ec4899', // Pink 500
    '#06b6d4', // Cyan 500
    '#8b5cf6', // Violet 500
    '#f43f5e', // Rose 500
    '#3b82f6', // Blue 500
    '#84cc16', // Lime 500
    '#a855f7', // Purple 500
];

const AllocationChart: React.FC<AllocationChartProps> = ({ tokens }) => {
    const data = useMemo(() => {
        // Filter tokens with value and sort by value desc
        const validTokens = tokens
            .filter(t => (t.priceUsd || 0) * (t.holdings || 0) > 0)
            .map(t => ({
                ...t,
                value: (t.priceUsd || 0) * (t.holdings || 0)
            }))
            .sort((a, b) => b.value - a.value);

        const totalValue = validTokens.reduce((sum, t) => sum + t.value, 0);

        if (totalValue === 0) return [];

        // Group small assets into "Others" if too many
        if (validTokens.length > 8) {
            const topTokens = validTokens.slice(0, 7);
            const otherTokens = validTokens.slice(7);
            const otherValue = otherTokens.reduce((sum, t) => sum + t.value, 0);

            return [
                ...topTokens.map((t, i) => ({
                    name: t.symbol,
                    value: t.value,
                    percent: (t.value / totalValue) * 100,
                    color: COLORS[i % COLORS.length]
                })),
                {
                    name: 'Others',
                    value: otherValue,
                    percent: (otherValue / totalValue) * 100,
                    color: '#64748b' // Slate 500
                }
            ];
        }

        return validTokens.map((t, i) => ({
            name: t.symbol,
            value: t.value,
            percent: (t.value / totalValue) * 100,
            color: COLORS[i % COLORS.length]
        }));
    }, [tokens]);

    // SVG Calculations
    const size = 200;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    let currentAngle = 0;

    if (data.length === 0) {
        return null; // Don't show if empty
    }

    return (
        <div className="bg-slate-800/30 backdrop-blur-md rounded-3xl border border-white/5 p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📊</span> Asset Allocation
            </h3>

            <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                        {data.map((item, index) => {
                            const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
                            const strokeDashoffset = -((currentAngle / 100) * circumference);
                            currentAngle += item.percent;

                            return (
                                <motion.circle
                                    key={item.name}
                                    cx={center}
                                    cy={center}
                                    r={radius}
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    initial={{ strokeDasharray: `0 ${circumference}` }}
                                    animate={{ strokeDasharray }}
                                    transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            );
                        })}
                    </svg>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xs text-slate-400 font-medium">Total</span>
                        <span className="text-lg font-bold text-white">
                            ${data.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                    {data.map((item) => (
                        <div key={item.name} className="flex items-center justify-between group bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                                <span className="text-sm text-slate-300 font-bold group-hover:text-white transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-white">
                                    {item.percent.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllocationChart;
