import React from 'react';

interface SniperFiltersProps {
    minLiquidity: number;
    setMinLiquidity: (value: number) => void;
    maxAgeHours: number;
    setMaxAgeHours: (value: number) => void;
    minBuyPressure: number;
    setMinBuyPressure: (value: number) => void;
    honeypotCheck: boolean;
    setHoneypotCheck: (value: boolean) => void;
}

const SniperFilters: React.FC<SniperFiltersProps> = ({
    minLiquidity,
    setMinLiquidity,
    maxAgeHours,
    setMaxAgeHours,
    minBuyPressure,
    setMinBuyPressure,
    honeypotCheck,
    setHoneypotCheck
}) => {
    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <span className="mr-2">🎯</span> Sniper Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Min Liquidity Filter */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Min Liquidity</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                            type="number"
                            value={minLiquidity}
                            onChange={(e) => setMinLiquidity(Number(e.target.value))}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-8 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Max Age Filter */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Max Age (Hours)</label>
                    <input
                        type="range"
                        min="1"
                        max="72"
                        value={maxAgeHours}
                        onChange={(e) => setMaxAgeHours(Number(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <div className="text-right text-xs text-indigo-400 font-bold">{maxAgeHours}h</div>
                </div>

                {/* Min Buy Pressure Filter */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">Min Buy Pressure</label>
                    <div className="flex items-center space-x-4">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={minBuyPressure}
                            onChange={(e) => setMinBuyPressure(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <span className="text-sm font-bold text-green-400 w-12">{minBuyPressure}%</span>
                    </div>
                </div>

                {/* Honeypot Check Toggle */}
                <div className="flex items-center justify-between bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Honeypot Check</span>
                        <span className="text-xs text-slate-500">Simulate Transaction</span>
                    </div>
                    <button
                        onClick={() => setHoneypotCheck(!honeypotCheck)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${honeypotCheck ? 'bg-indigo-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${honeypotCheck ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SniperFilters;
