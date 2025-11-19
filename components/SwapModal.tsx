import React from 'react';
import { SwapWidget } from '@uniswap/widgets';
import '@uniswap/widgets/fonts.css';

interface SwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenAddress: string;
    initialInputTokenAddress?: string;
    initialOutputTokenAddress?: string;
}

// Base Chain ID
const CHAIN_ID = 8453;

// Public RPC Endpoint for Base
const JSON_RPC_URL = 'https://mainnet.base.org';

const SwapModal: React.FC<SwapModalProps> = ({
    isOpen,
    onClose,
    initialInputTokenAddress,
    initialOutputTokenAddress
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-[360px] bg-transparent rounded-2xl shadow-2xl animate-scale-up">
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="uniswap-widget-container">
                    <SwapWidget
                        jsonRpcUrlMap={{ [CHAIN_ID]: [JSON_RPC_URL] }}
                        defaultChainId={CHAIN_ID}
                        defaultInputTokenAddress={initialInputTokenAddress}
                        defaultOutputTokenAddress={initialOutputTokenAddress}
                        width="100%"
                        theme={{
                            primary: '#10B981', // Emerald 500
                            secondary: '#334155', // Slate 700
                            interactive: '#1E293B', // Slate 800
                            container: '#0F172A', // Slate 900
                            module: '#1E293B', // Slate 800
                            accent: '#10B981', // Emerald 500
                            outline: '#334155', // Slate 700
                            dialog: '#0F172A', // Slate 900
                            fontFamily: 'Inter',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

export default SwapModal;
