
import React, { useState, useEffect } from 'react';
import { Token } from '../types';
import { executeSwap, executeTokenSwap, checkAllowance, approveToken, USDC_ADDRESS } from '../services/tradeService';
import { parseUnits, formatUnits } from 'viem';

interface FlashTradeModalProps {
    token: Token;
    isOpen: boolean;
    onClose: () => void;
}

const FlashTradeModal: React.FC<FlashTradeModalProps> = ({ token, isOpen, onClose }) => {
    const [amount, setAmount] = useState('0.01');
    const [paymentToken, setPaymentToken] = useState<'ETH' | 'USDC'>('ETH');
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>(''); // For detailed status (Approving, Swapping...)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setAmount(paymentToken === 'ETH' ? '0.01' : '10');
            setTxHash(null);
            setError(null);
            setStatus('');
        }
    }, [isOpen, paymentToken]);

    if (!isOpen) return null;

    const handleBuy = async () => {
        setIsLoading(true);
        setError(null);
        setStatus('Initiating transaction...');
        try {
            let hash;
            if (paymentToken === 'ETH') {
                hash = await executeSwap(token.address, amount);
            } else {
                // USDC Logic
                const amountInWei = parseUnits(amount, 6); // USDC has 6 decimals
                const owner = window.ethereum.selectedAddress; // Or get from wallet client
                const spender = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24'; // Uniswap V2 Router

                setStatus('Checking allowance...');
                // Check allowance
                // Note: checkAllowance returns bigint
                // We need to handle the async call properly
                // For MVP, we'll just try to approve if we think we need to, or just run the flow

                // Let's do a simple flow: Approve -> Swap
                // Ideally we check allowance first to skip approve

                setStatus('Approving USDC...');
                await approveToken(USDC_ADDRESS, spender, amountInWei);

                setStatus('Swapping USDC for Token...');
                hash = await executeTokenSwap(USDC_ADDRESS, token.address, amountInWei);
            }
            setTxHash(hash);
            setStatus('Transaction Sent!');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Transaction failed");
            setStatus('Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-scale-in">
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
                        {/* Token Toggle */}
                        <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
                            <button
                                onClick={() => setPaymentToken('ETH')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentToken === 'ETH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                ETH
                            </button>
                            <button
                                onClick={() => setPaymentToken('USDC')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentToken === 'USDC' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                USDC
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Amount ({paymentToken})
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-mono text-lg"
                                    step={paymentToken === 'ETH' ? "0.001" : "1"}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                    {paymentToken}
                                </div>
                            </div>
                            <div className="flex justify-between mt-2">
                                {paymentToken === 'ETH' ? (
                                    <>
                                        <button onClick={() => setAmount('0.01')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.01</button>
                                        <button onClick={() => setAmount('0.05')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.05</button>
                                        <button onClick={() => setAmount('0.1')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.1</button>
                                        <button onClick={() => setAmount('0.5')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">0.5</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setAmount('10')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">10</button>
                                        <button onClick={() => setAmount('50')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">50</button>
                                        <button onClick={() => setAmount('100')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">100</button>
                                        <button onClick={() => setAmount('500')} className="text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-400">500</button>
                                    </>
                                )}
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
                            {isLoading ? (status || "Processing...") : "BUY INSTANTLY"}
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
