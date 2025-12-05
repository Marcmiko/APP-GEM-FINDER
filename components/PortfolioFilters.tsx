import React from 'react';
import { Token } from '../types';

export type SortOption = 'value' | 'name' | 'pnl' | 'change24h';
export type FilterOption = 'all' | 'gainers' | 'losers';

interface PortfolioFiltersProps {
    sortBy: SortOption;
    filterBy: FilterOption;
    searchQuery: string;
    onSortChange: (sort: SortOption) => void;
    onFilterChange: (filter: FilterOption) => void;
    onSearchChange: (query: string) => void;
}

const PortfolioFilters: React.FC<PortfolioFiltersProps> = ({
    sortBy,
    filterBy,
    searchQuery,
    onSortChange,
    onFilterChange,
    onSearchChange,
}) => {
    return (
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search by name or symbol..."
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 pl-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                    </div>
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Sort By</label>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="value">Value (High to Low)</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="pnl">PnL (High to Low)</option>
                        <option value="change24h">24h Change (High to Low)</option>
                    </select>
                </div>

                {/* Filter By */}
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Filter</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onFilterChange('all')}
                            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${filterBy === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => onFilterChange('gainers')}
                            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${filterBy === 'gainers'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            Gainers
                        </button>
                        <button
                            onClick={() => onFilterChange('losers')}
                            className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${filterBy === 'losers'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            Losers
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortfolioFilters;

/**
 * Apply filters and sorting to tokens
 */
export function applyFiltersAndSort(
    tokens: Token[],
    sortBy: SortOption,
    filterBy: FilterOption,
    searchQuery: string
): Token[] {
    let filtered = [...tokens];

    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
            (t) =>
                t.name.toLowerCase().includes(query) ||
                t.symbol.toLowerCase().includes(query)
        );
    }

    // Apply performance filter
    if (filterBy === 'gainers') {
        filtered = filtered.filter((t) => (t.priceChange24h || 0) > 0);
    } else if (filterBy === 'losers') {
        filtered = filtered.filter((t) => (t.priceChange24h || 0) < 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'value':
                const valueA = (a.holdings || 0) * (a.priceUsd || 0);
                const valueB = (b.holdings || 0) * (b.priceUsd || 0);
                return valueB - valueA;

            case 'name':
                return a.symbol.localeCompare(b.symbol);

            case 'pnl':
                const pnlA = ((a.holdings || 0) * (a.priceUsd || 0)) - ((a.holdings || 0) * (a.entryPrice || a.priceUsd || 0));
                const pnlB = ((b.holdings || 0) * (b.priceUsd || 0)) - ((b.holdings || 0) * (b.entryPrice || b.priceUsd || 0));
                return pnlB - pnlA;

            case 'change24h':
                return (b.priceChange24h || 0) - (a.priceChange24h || 0);

            default:
                return 0;
        }
    });

    return filtered;
}
