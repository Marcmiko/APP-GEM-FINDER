import React from 'react';
import { motion } from 'framer-motion';
import { Token } from '../types';

interface PortfolioChartsProps {
    tokens: Token[];
    totalValue: number;
}

const PortfolioCharts: React.FC<PortfolioChartsProps> = ({ tokens, totalValue }) => {
    // --- DATA PREPARATION ---
    const allocationData = tokens.map(t => ({
        symbol: t.symbol,
        value: (t.holdings || 0) * (t.priceUsd || 0),
        color: getRandomColor(t.symbol)
    })).sort((a, b) => b.value - a.value);

    // Mock History Data (since we don't have a backend for historical portfolio value yet)
    const historyData = generateMockHistory(totalValue);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* ASSET ALLOCATION (Doughnut Chart) */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-xl">🍰</span> Asset Allocation
                </h3>
                <div className="flex items-center justify-center gap-8">
                    <div className="relative w-48 h-48">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                            {allocationData.map((item, index) => {
                                const total = allocationData.reduce((acc, curr) => acc + curr.value, 0);
                                const percentage = total > 0 ? (item.value / total) * 100 : 0;
                                const dashArray = 2 * Math.PI * 40; // r=40
                                const dashOffset = dashArray - (dashArray * percentage) / 100;
                                const rotation = allocationData.slice(0, index).reduce((acc, curr) => acc + (total > 0 ? (curr.value / total) * 360 : 0), 0);

                                return (
                                    <circle
                                        key={item.symbol}
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        fill="transparent"
                                        stroke={item.color}
                                        strokeWidth="12"
                                        strokeDasharray={dashArray}
                                        strokeDashoffset={dashOffset}
                                        transform={`rotate(${rotation} 50 50)`}
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                    >
                                        <title>{item.symbol}: {percentage.toFixed(1)}%</title>
                                    </circle>
                                );
                            })}
                            {/* Center Text */}
                            <text x="50" y="50" textAnchor="middle" dy="0.3em" className="fill-white text-[10px] font-bold">
                                {tokens.length} Assets
                            </text>
                        </svg>
                    </div>

                    {/* Legend */}
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {allocationData.map(item => (
                            <div key={item.symbol} className="flex items-center gap-2 text-xs">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span className="text-slate-300 font-medium w-12">{item.symbol}</span>
                                <span className="text-slate-500">{((item.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PORTFOLIO HISTORY (Line Chart) */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="text-xl">📈</span> Value History (7d)
                </h3>
                <div className="h-48 w-full flex items-end gap-1 relative pt-4">
                    {/* Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                        <div className="border-t border-slate-400 w-full"></div>
                        <div className="border-t border-slate-400 w-full"></div>
                        <div className="border-t border-slate-400 w-full"></div>
                        <div className="border-t border-slate-400 w-full"></div>
                    </div>

                    {/* Line Path */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                        <motion.path
                            d={createLinePath(historyData, 300, 192)} // Width approx, height 192px (h-48)
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                        />
                        {/* Area under curve */}
                        <motion.path
                            d={`${createLinePath(historyData, 300, 192)} L 300 192 L 0 192 Z`}
                            fill="url(#gradient)"
                            opacity="0.2"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>7 days ago</span>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
};

// --- UTILS ---

const getRandomColor = (seed: string) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#3b82f6', '#f59e0b', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const generateMockHistory = (currentValue: number) => {
    const data = [];
    let value = currentValue * 0.8; // Start 20% lower 7 days ago
    for (let i = 0; i < 7; i++) {
        value = value * (1 + (Math.random() * 0.1 - 0.03)); // Random daily change
        data.push(value);
    }
    data[6] = currentValue; // Ensure end matches current
    return data;
};

const createLinePath = (data: number[], width: number, height: number) => {
    // Simple SVG path generator
    // Note: In a real app, use width from ref. Here we approximate or use percentage coordinates.
    // Using percentage coordinates (0-100) for simplicity in SVG viewbox
    const max = Math.max(...data) * 1.1;
    const min = Math.min(...data) * 0.9;
    const range = max - min;

    // Map points to 0-100 coordinate space
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = range > 0 ? 100 - ((val - min) / range) * 100 : 50;
        return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
};

export default PortfolioCharts;
