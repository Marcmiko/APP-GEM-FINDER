
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
    achievements: Achievement[];
    battleState: BattleState;
    startBattle: () => void;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt?: number;
}

export interface BattleState {
    isActive: boolean;
    opponentName: string;
    timeLeft: number; // seconds
    playerScore: number; // PnL %
    opponentScore: number; // PnL %
    opponentHistory: FantasyTransaction[];
    startTime: number;
}

const INITIAL_BATTLE_STATE: BattleState = {
    isActive: false,
    opponentName: '',
    timeLeft: 0,
    playerScore: 0,
    opponentScore: 0,
    opponentHistory: [],
    startTime: 0
};

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_buy', title: 'First Steps', description: 'Make your first trade.', icon: '🚀', unlocked: false },
    { id: 'profit_maker', title: 'In the Green', description: 'Close a trade with a profit.', icon: '📈', unlocked: false },
    { id: 'diversified', title: 'Diversified', description: 'Hold 5 or more different tokens.', icon: '🎨', unlocked: false },
    { id: 'big_spender', title: 'Whale Watch', description: 'Make a trade over $5,000.', icon: '🐋', unlocked: false },
    { id: 'diamond_hands', title: 'Diamond Hands', description: 'Reach a portfolio value of $15,000.', icon: '💎', unlocked: false },
    { id: 'rekt', title: 'Rekt', description: 'Drop below $5,000 total value.', icon: '💀', unlocked: false },
];

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

    const [achievements, setAchievements] = useState<Achievement[]>(() => {
        const saved = localStorage.getItem('fantasy_achievements');
        return saved ? JSON.parse(saved) : INITIAL_ACHIEVEMENTS;
    });

    const [battleState, setBattleState] = useState<BattleState>(INITIAL_BATTLE_STATE);

    // Battle Timer & Bot Logic
    useEffect(() => {
        if (!battleState.isActive) return;

        const interval = setInterval(() => {
            setBattleState(prev => {
                if (prev.timeLeft <= 0) {
                    clearInterval(interval);
                    return { ...prev, isActive: false };
                }

                // Simulate Opponent Moves (Randomly gain/lose score)
                // Bot makes a "trade" every ~10 seconds on average
                let newOpponentScore = prev.opponentScore;
                const shouldTrade = Math.random() > 0.9; // 10% chance per second
                if (shouldTrade) {
                    const change = (Math.random() * 4) - 1.5; // -1.5% to +2.5% swing
                    newOpponentScore += change;
                }

                return {
                    ...prev,
                    timeLeft: prev.timeLeft - 1,
                    opponentScore: newOpponentScore
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [battleState.isActive]);

    // Calculate Player Score (PnL %) during battle
    useEffect(() => {
        if (!battleState.isActive) return;

        const startBalance = INITIAL_BALANCE; // Simplified: Assume battle starts with fresh balance or snapshot
        // For now, we track PnL of the *current* session relative to when battle started
        // But since we don't have "session" PnL easily, we'll just use total PnL % of the account
        // Ideally, we'd snapshot value at startBattle.

        // Let's use a simplified metric: Total Account PnL %
        const currentTotalValue = balance + portfolio.reduce((acc, pos) => acc + (pos.amount * (pos.token.priceUsd || 0)), 0);
        const pnlPercent = ((currentTotalValue - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

        setBattleState(prev => ({ ...prev, playerScore: pnlPercent }));

    }, [balance, portfolio, battleState.isActive]);

    // Update Portfolio Prices Periodically
    useEffect(() => {
        const fetchPrices = async () => {
            if (portfolio.length === 0) return;

            const updatedPortfolio = await Promise.all(portfolio.map(async (pos) => {
                try {
                    // Fetch latest price from DexScreener
                    // Note: In a real app, we would batch this or use a more efficient endpoint
                    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${pos.token.address}`);
                    const data = await response.json();

                    if (data.pairs && data.pairs.length > 0) {
                        // Find the best pair (highest liquidity)
                        const bestPair = data.pairs.sort((a: any, b: any) => b.liquidity?.usd - a.liquidity?.usd)[0];
                        const newPrice = parseFloat(bestPair.priceUsd);

                        if (!isNaN(newPrice)) {
                            return {
                                ...pos,
                                token: {
                                    ...pos.token,
                                    priceUsd: newPrice,
                                    priceChange24h: bestPair.priceChange?.h24 || pos.token.priceChange24h,
                                    priceChange1h: bestPair.priceChange?.h1 || pos.token.priceChange1h
                                }
                            };
                        }
                    }
                    return pos;
                } catch (error) {
                    console.error(`Failed to update price for ${pos.token.symbol}`, error);
                    return pos;
                }
            }));

            // Only update state if prices actually changed to avoid unnecessary re-renders
            // Simple check: compare total value
            const oldTotal = portfolio.reduce((acc, p) => acc + (p.amount * (p.token.priceUsd || 0)), 0);
            const newTotal = updatedPortfolio.reduce((acc, p) => acc + (p.amount * (p.token.priceUsd || 0)), 0);

            if (Math.abs(newTotal - oldTotal) > 0.01) {
                setPortfolio(updatedPortfolio);
            }
        };

        const interval = setInterval(fetchPrices, 15000); // Update every 15 seconds
        fetchPrices(); // Initial fetch

        return () => clearInterval(interval);
    }, [portfolio.length]); // Re-run if portfolio size changes (added/removed token)

    const startBattle = () => {
        setBattleState({
            isActive: true,
            opponentName: 'AlphaBot 9000',
            timeLeft: 300, // 5 minutes
            playerScore: 0,
            opponentScore: 0,
            opponentHistory: [],
            startTime: Date.now()
        });
        // Optional: Reset account for fair battle?
        // resetAccount(); 
        // For now, we play with existing portfolio.
    };

    useEffect(() => {
        localStorage.setItem('fantasy_balance', balance.toString());
        localStorage.setItem('fantasy_portfolio', JSON.stringify(portfolio));
        localStorage.setItem('fantasy_history', JSON.stringify(history));
        localStorage.setItem('fantasy_achievements', JSON.stringify(achievements));
    }, [balance, portfolio, history, achievements]);

    const checkAchievements = (currentPortfolio: FantasyPosition[], currentHistory: FantasyTransaction[], currentBalance: number) => {
        const currentTotalValue = currentBalance + currentPortfolio.reduce((acc, pos) => acc + (pos.amount * (pos.token.priceUsd || 0)), 0);

        setAchievements(prev => {
            let hasChanges = false;
            const updated = prev.map(ach => {
                if (ach.unlocked) return ach;

                let unlocked = false;
                switch (ach.id) {
                    case 'first_buy':
                        if (currentHistory.some(tx => tx.type === 'BUY')) unlocked = true;
                        break;
                    case 'profit_maker':
                        if (currentHistory.some(tx => tx.type === 'SELL' && (tx.pnl || 0) > 0)) unlocked = true;
                        break;
                    case 'diversified':
                        if (currentPortfolio.length >= 5) unlocked = true;
                        break;
                    case 'big_spender':
                        if (currentHistory.some(tx => tx.amountUsd >= 5000)) unlocked = true;
                        break;
                    case 'diamond_hands':
                        if (currentTotalValue >= 15000) unlocked = true;
                        break;
                    case 'rekt':
                        if (currentTotalValue <= 5000) unlocked = true;
                        break;
                }

                if (unlocked) {
                    hasChanges = true;
                    return { ...ach, unlocked: true, unlockedAt: Date.now() };
                }
                return ach;
            });

            return hasChanges ? updated : prev;
        });
    };

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
        const newBalance = balance - amountUsd;

        setBalance(newBalance);

        let newPortfolio = [...portfolio];
        const existingIndex = newPortfolio.findIndex(p => p.token.address === token.address);

        if (existingIndex >= 0) {
            const existing = newPortfolio[existingIndex];
            const totalCost = (existing.amount * existing.entryPrice) + amountUsd;
            const newAmount = existing.amount + tokenAmount;
            newPortfolio[existingIndex] = {
                ...existing,
                amount: newAmount,
                entryPrice: totalCost / newAmount
            };
        } else {
            newPortfolio.push({
                token,
                amount: tokenAmount,
                entryPrice: price,
                timestamp: Date.now()
            });
        }
        setPortfolio(newPortfolio);

        const newHistory = [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'BUY' as const,
            tokenSymbol: token.symbol,
            amountUsd,
            price,
            timestamp: Date.now()
        }, ...history];
        setHistory(newHistory);

        checkAchievements(newPortfolio, newHistory, newBalance);
    };

    const sellToken = (tokenAddress: string, amountPercentage: number) => {
        const position = portfolio.find(p => p.token.address === tokenAddress);
        if (!position) return;

        const sellAmount = position.amount * (amountPercentage / 100);
        const currentPrice = position.token.priceUsd || position.entryPrice;
        const sellValueUsd = sellAmount * currentPrice;
        const costBasis = sellAmount * position.entryPrice;
        const pnl = sellValueUsd - costBasis;

        const newBalance = balance + sellValueUsd;
        setBalance(newBalance);

        let newPortfolio = [...portfolio];
        if (amountPercentage >= 100) {
            newPortfolio = newPortfolio.filter(p => p.token.address !== tokenAddress);
        } else {
            newPortfolio = newPortfolio.map(p => p.token.address === tokenAddress ? {
                ...p,
                amount: p.amount - sellAmount
            } : p);
        }
        setPortfolio(newPortfolio);

        const newHistory = [{
            id: Math.random().toString(36).substr(2, 9),
            type: 'SELL' as const,
            tokenSymbol: position.token.symbol,
            amountUsd: sellValueUsd,
            price: currentPrice,
            timestamp: Date.now(),
            pnl
        }, ...history];
        setHistory(newHistory);

        checkAchievements(newPortfolio, newHistory, newBalance);
    };

    const resetAccount = () => {
        setBalance(INITIAL_BALANCE);
        setPortfolio([]);
        setHistory([]);
        setAchievements(INITIAL_ACHIEVEMENTS);
    };

    const portfolioValue = portfolio.reduce((acc, pos) => {
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
            totalValue,
            achievements,
            battleState,
            startBattle
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
