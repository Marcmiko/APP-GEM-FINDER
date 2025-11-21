
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Token } from '../types';

interface FantasyPosition {
    token: Token;
    amount: number; // Amount of tokens
    entryPrice: number;
    timestamp: number;
}

interface FantasyTransaction {
    id: string;
    type: 'BUY' | 'SELL';
    tokenSymbol: string;
    amountUsd: number;
    price: number;
    timestamp: number;
    pnl?: number; // Only for sells
}

interface FantasyContextType {
    balance: number;
    portfolio: FantasyPosition[];
    history: FantasyTransaction[];
    buyToken: (token: Token, amountUsd: number) => void;
    sellToken: (tokenAddress: string, amountPercentage: number) => void; // 0-100%
    resetAccount: () => void;
    portfolioValue: number;
    totalValue: number;
}

const FantasyContext = createContext<FantasyContextType | undefined>(undefined);

const INITIAL_BALANCE = 10000;

export const FantasyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [balance, setBalance] = useState<number>(() => {
        const saved = localStorage.getItem('fantasy_balance');
        return saved ? parseFloat(saved) : INITIAL_BALANCE;
    });

    const [portfolio, setPortfolio] = useState<FantasyPosition[]>(() => {
        const saved = localStorage.getItem('fantasy_portfolio');
        return saved ? JSON.parse(saved) : [];
    });

    const [history, setHistory] = useState<FantasyTransaction[]>(() => {
        const saved = localStorage.getItem('fantasy_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('fantasy_balance', balance.toString());
        localStorage.setItem('fantasy_portfolio', JSON.stringify(portfolio));
        localStorage.setItem('fantasy_history', JSON.stringify(history));
    }, [balance, portfolio, history]);

    const buyToken = (token: Token, amountUsd: number) => {
        if (amountUsd > balance) {
            alert("Insufficient virtual funds!");
            return;
        }

        const price = token.priceUsd || 0;
        if (price === 0) {
            alert("Cannot buy token with unknown price.");
            return;
        }

        const tokenAmount = amountUsd / price;

        setBalance(prev => prev - amountUsd);

        setPortfolio(prev => {
            const existing = prev.find(p => p.token.address === token.address);
            if (existing) {
                // Average entry price
                const totalCost = (existing.amount * existing.entryPrice) + amountUsd;
                const newAmount = existing.amount + tokenAmount;
                return prev.map(p => p.token.address === token.address ? {
                    ...p,
                    amount: newAmount,
                    entryPrice: totalCost / newAmount
                } : p);
            } else {
                return [...prev, {
                    token,
                    amount: tokenAmount,
                    entryPrice: price,
                    timestamp: Date.now()
                }];
            }
        });

        setHistory(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'BUY',
            tokenSymbol: token.symbol,
            amountUsd,
            price,
            timestamp: Date.now()
        }, ...prev]);
    };

    const sellToken = (tokenAddress: string, amountPercentage: number) => {
        const position = portfolio.find(p => p.token.address === tokenAddress);
        if (!position) return;

        const sellAmount = position.amount * (amountPercentage / 100);
        const currentPrice = position.token.priceUsd || position.entryPrice; // In real app, fetch fresh price
        const sellValueUsd = sellAmount * currentPrice;
        const costBasis = sellAmount * position.entryPrice;
        const pnl = sellValueUsd - costBasis;

        setBalance(prev => prev + sellValueUsd);

        setPortfolio(prev => {
            if (amountPercentage >= 100) {
                return prev.filter(p => p.token.address !== tokenAddress);
            }
            return prev.map(p => p.token.address === tokenAddress ? {
                ...p,
                amount: p.amount - sellAmount
            } : p);
        });

        setHistory(prev => [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'SELL',
            tokenSymbol: position.token.symbol,
            amountUsd: sellValueUsd,
            price: currentPrice,
            timestamp: Date.now(),
            pnl
        }, ...prev]);
    };

    const resetAccount = () => {
        setBalance(INITIAL_BALANCE);
        setPortfolio([]);
        setHistory([]);
    };

    const portfolioValue = portfolio.reduce((acc, pos) => {
        // Note: In a real app we need live prices. Here we use the stored token price (which might be stale)
        // or we should update it. For now, we use the stored token price.
        return acc + (pos.amount * (pos.token.priceUsd || 0));
    }, 0);

    const totalValue = balance + portfolioValue;

    return (
        <FantasyContext.Provider value={{
            balance,
            portfolio,
            history,
            buyToken,
            sellToken,
            resetAccount,
            portfolioValue,
            totalValue
        }}>
            {children}
        </FantasyContext.Provider>
    );
};

export const useFantasy = () => {
    const context = useContext(FantasyContext);
    if (context === undefined) {
        throw new Error('useFantasy must be used within a FantasyProvider');
    }
    return context;
};
