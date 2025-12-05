import { Token } from '../types';

export interface PortfolioMetrics {
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    change24h: number;
    change24hPercent: number;
    bestPerformer: Token | null;
    worstPerformer: Token | null;
    topGainers: Token[];
    topLosers: Token[];
}

export interface TokenMetrics {
    currentValue: number;
    pnl: number;
    pnlPercent: number;
    change24h: number;
    change24hPercent: number;
}

/**
 * Calculate metrics for a single token
 */
export function calculateTokenMetrics(token: Token): TokenMetrics {
    const currentValue = (token.holdings || 0) * (token.priceUsd || 0);
    const entryPrice = token.entryPrice || token.avgBuyPrice || token.priceUsd || 0;
    const entryValue = (token.holdings || 0) * entryPrice;

    const pnl = currentValue - entryValue;
    const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;

    const change24h = currentValue * ((token.priceChange24h || 0) / 100);
    const change24hPercent = token.priceChange24h || 0;

    return {
        currentValue,
        pnl,
        pnlPercent,
        change24h,
        change24hPercent,
    };
}

/**
 * Calculate overall portfolio metrics
 */
export function calculatePortfolioMetrics(tokens: Token[]): PortfolioMetrics {
    const validTokens = tokens.filter(t => (t.holdings || 0) > 0 && (t.priceUsd || 0) > 0);

    let totalValue = 0;
    let totalEntryValue = 0;
    let total24hChange = 0;

    const tokensWithMetrics = validTokens.map(token => {
        const metrics = calculateTokenMetrics(token);
        totalValue += metrics.currentValue;
        totalEntryValue += metrics.currentValue - metrics.pnl;
        total24hChange += metrics.change24h;

        return { token, metrics };
    });

    const totalPnL = totalValue - totalEntryValue;
    const totalPnLPercent = totalEntryValue > 0 ? (totalPnL / totalEntryValue) * 100 : 0;
    const change24hPercent = totalValue > 0 ? (total24hChange / (totalValue - total24hChange)) * 100 : 0;

    // Sort by 24h change for top performers
    const sortedByChange = [...tokensWithMetrics].sort((a, b) =>
        b.metrics.change24hPercent - a.metrics.change24hPercent
    );

    const topGainers = sortedByChange
        .filter(t => t.metrics.change24hPercent > 0)
        .slice(0, 3)
        .map(t => t.token);

    const topLosers = sortedByChange
        .filter(t => t.metrics.change24hPercent < 0)
        .slice(-3)
        .reverse()
        .map(t => t.token);

    return {
        totalValue,
        totalPnL,
        totalPnLPercent,
        change24h: total24hChange,
        change24hPercent,
        bestPerformer: topGainers[0] || null,
        worstPerformer: topLosers[0] || null,
        topGainers,
        topLosers,
    };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 2): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Get color class based on value
 */
export function getChangeColor(value: number): string {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-slate-400';
}
