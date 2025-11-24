
import React, { useState } from 'react';
import { Token } from '../types';
import { executeSwap } from '../services/tradeService';

interface FlashTradeModalProps {
    token: Token;
    isOpen: boolean;
    onClose: () => void;
}

const FlashTradeModal: React.FC<FlashTradeModalProps> = ({ token, isOpen, onClose }) => {
    const [amount, setAmount] = useState('0.01');
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleBuy = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const hash = await executeSwap(token.address, amount);
            setTxHash(hash);
        } catch (err: any) {
            setError(err.message || "Transaction failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-1 flex items-center">
                    Flash Buy <span className="ml-2 text-yellow-400">⚡</span>
                </h2>
                <p className="text-slate-400 mb-6">Buying {token.symbol} on Base</p>

                {txHash ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-green-400 mb-2">Transaction Sent!</h3>
                        <a
                            href={`https://basescan.org/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 underline"
                        >
                            View on Basescan
                        </a>
                        <button
                            onClick={onClose}
                            className="mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Amount (ETH)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-mono text-lg"
                                    step="0.001"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                    ETH
                                </div>
                            </div>
                            <div className="flex justify-between mt-2">
                                <button onClick={() => setAmount('0.01')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.01</button>
                                <button onClick={() => setAmount('0.05')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.05</button>
                                <button onClick={() => setAmount('0.1')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.1</button>
                                <button onClick={() => setAmount('0.5')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.5</button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleBuy}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <span className="animate-spin mr-2">⏳</span>
                            ) : (
                                <span className="mr-2">⚡</span>
                            )}
                            {isLoading ? "Confirming..." : "BUY INSTANTLY"}
                        </button>

                        <p className="text-center text-xs text-slate-500 mt-4">
                            High slippage (5%) enabled for speed. Use at your own risk.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default FlashTradeModal;
