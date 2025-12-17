import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { tokenService } from '../services/tokenService';
import { useAccount, useConnect } from 'wagmi';
import { parseEther } from 'viem';

interface TokenSaleModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TokenSaleModal: React.FC<TokenSaleModalProps> = ({ isOpen, onClose }) => {
    const { isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const [rate, setRate] = useState<number>(100000);
    const [ethAmount, setEthAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadRate();
        }
    }, [isOpen]);

    const loadRate = async () => {
        const currentRate = await tokenService.getSaleRate();
        if (currentRate) setRate(currentRate);
    };

    const handleBuy = async () => {
        if (!ethAmount || parseFloat(ethAmount) <= 0) return;
        setIsLoading(true);
        setError(null);

        try {
            const result = await tokenService.buyTokens(ethAmount);
            if (result) {
                setSuccess(`Successfully purchased ${parseFloat(ethAmount) * rate} GFT!`);
                setEthAmount('');
                setTimeout(() => {
                    onClose();
                    setSuccess(null);
                }, 3000);
            } else {
                setError("Transaction failed. Please check your ETH balance.");
            }
        } catch (e) {
            setError("Purchase failed. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const gftAmount = ethAmount ? (parseFloat(ethAmount) * rate).toLocaleString() : '0';

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-800">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white mb-2">
                                    💎 Buy GemFinder Token (GFT)
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-400 mb-4">
                                        Purchase GFT directly from the official sale contract.
                                        <br />
                                        <span className="text-yellow-400 text-xs">Note: DEX trading (Uniswap) is not yet active. Use this form to buy.</span>
                                    </p>

                                    <div className="bg-gray-800/50 p-4 rounded-lg mb-4 border border-gray-700">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Rate</span>
                                            <span className="text-indigo-400 font-bold">1 ETH = {rate.toLocaleString()} GFT</span>
                                        </div>

                                        <label className="block text-xs text-gray-500 mb-1">You Pay (ETH)</label>
                                        <input
                                            type="number"
                                            value={ethAmount}
                                            onChange={(e) => setEthAmount(e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white mb-3 focus:outline-none focus:border-indigo-500"
                                            placeholder="0.01"
                                        />

                                        <label className="block text-xs text-gray-500 mb-1">You Receive (GFT)</label>
                                        <div className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white font-mono">
                                            {gftAmount}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mb-4 p-2 bg-red-900/30 border border-red-800/50 rounded text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div className="mb-4 p-2 bg-green-900/30 border border-green-800/50 rounded text-green-400 text-sm">
                                            {success}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-3">
                                    {!isConnected ? (
                                        <button
                                            onClick={() => connect({ connector: connectors[0] })}
                                            className="w-full rounded-md bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                        >
                                            Connect Wallet
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="inline-flex justify-center w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleBuy}
                                            disabled={isLoading || !ethAmount}
                                        >
                                            {isLoading ? 'Processing...' : 'Confirm Purchase'}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-700 bg-transparent px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 focus:outline-none"
                                        onClick={onClose}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
