import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { tokenService } from '../services/tokenService';

export const TokenBalance: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [balance, setBalance] = useState<string>('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            loadBalance();
        }
    }, [isConnected, address]);

    const loadBalance = async () => {
        if (!address) return;

        setLoading(true);
        try {
            const balanceData = await tokenService.getBalance(address);
            if (balanceData) {
                setBalance(balanceData.formattedBalance);
            }
        } catch (error) {
            console.error('Failed to load balance:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-400">GFT Balance</span>
                    <span className="text-sm font-semibold text-white">
                        {loading ? '...' : parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};
