import { createPublicClient, createWalletClient, http, custom, parseEther, formatEther, type PublicClient, type WalletClient, type Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Contract ABIs (simplified for frontend use)
const GFT_TOKEN_ABI = [
    { inputs: [], name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'transfer', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], name: 'allowance', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }
] as const;

const TOKEN_GATE_ABI = [
    { inputs: [], name: 'gemAnalysisCost', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'advancedFilterCost', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'purchaseGemAnalysis', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }], name: 'canPurchaseAnalysis', outputs: [{ type: 'bool' }], stateMutability: 'view', type: 'function' },
    { inputs: [{ name: 'user', type: 'address' }], name: 'getUserStats', outputs: [{ type: 'uint256' }, { type: 'uint256' }], stateMutability: 'view', type: 'function' }
] as const;

const TOKEN_SALE_ABI = [
    { inputs: [], name: 'rate', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' },
    { inputs: [], name: 'buyTokens', outputs: [], stateMutability: 'payable', type: 'function' }
] as const;

// Contract addresses
export const GFT_TOKEN_ADDRESS = (process.env.VITE_GFT_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
export const TOKEN_GATE_ADDRESS = (process.env.VITE_TOKEN_GATE_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;
export const TOKEN_SALE_ADDRESS = (process.env.VITE_TOKEN_SALE_ADDRESS || '0x0000000000000000000000000000000000000000') as Address;

export interface TokenBalance {
    balance: string;
    formattedBalance: string;
}

export class TokenService {
    private publicClient: PublicClient;
    private walletClient: WalletClient | null = null;

    constructor() {
        this.publicClient = createPublicClient({
            chain: baseSepolia, // Default to testnet
            transport: http()
        });
    }

    async initialize(provider: any) {
        if (provider) {
            this.walletClient = createWalletClient({
                chain: baseSepolia,
                transport: custom(provider)
            });
        }
    }

    async getBalance(address: string): Promise<TokenBalance | null> {
        try {
            const balance = await this.publicClient.readContract({
                address: GFT_TOKEN_ADDRESS,
                abi: GFT_TOKEN_ABI,
                functionName: 'balanceOf',
                args: [address as Address]
            });

            return {
                balance: balance.toString(),
                formattedBalance: parseFloat(formatEther(balance)).toFixed(1)
            };
        } catch (e) {
            console.error('Failed to get balance', e);
            return null;
        }
    }

    async getAnalysisCost(): Promise<string | null> {
        try {
            const cost = await this.publicClient.readContract({
                address: TOKEN_GATE_ADDRESS,
                abi: TOKEN_GATE_ABI,
                functionName: 'gemAnalysisCost'
            });
            return formatEther(cost);
        } catch (e) {
            return null;
        }
    }

    async canPurchaseAnalysis(address: string): Promise<boolean> {
        try {
            return await this.publicClient.readContract({
                address: TOKEN_GATE_ADDRESS,
                abi: TOKEN_GATE_ABI,
                functionName: 'canPurchaseAnalysis',
                args: [address as Address]
            });
        } catch (e) {
            return false;
        }
    }

    async purchaseGemAnalysis(): Promise<boolean> {
        if (!this.walletClient) return false;

        try {
            const [address] = await this.walletClient.getAddresses();
            const cost = await this.publicClient.readContract({
                address: TOKEN_GATE_ADDRESS,
                abi: TOKEN_GATE_ABI,
                functionName: 'gemAnalysisCost'
            });

            const allowance = await this.publicClient.readContract({
                address: GFT_TOKEN_ADDRESS,
                abi: GFT_TOKEN_ABI,
                functionName: 'allowance',
                args: [address, TOKEN_GATE_ADDRESS]
            });

            if (allowance < cost) {
                const hash = await this.walletClient.writeContract({
                    address: GFT_TOKEN_ADDRESS,
                    abi: GFT_TOKEN_ABI,
                    functionName: 'approve',
                    args: [TOKEN_GATE_ADDRESS, cost],
                    account: address
                });
                await this.publicClient.waitForTransactionReceipt({ hash });
            }

            const hash = await this.walletClient.writeContract({
                address: TOKEN_GATE_ADDRESS,
                abi: TOKEN_GATE_ABI,
                functionName: 'purchaseGemAnalysis',
                account: address
            });
            await this.publicClient.waitForTransactionReceipt({ hash });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getSaleRate(): Promise<number | null> {
        try {
            const rate = await this.publicClient.readContract({
                address: TOKEN_SALE_ADDRESS,
                abi: TOKEN_SALE_ABI,
                functionName: 'rate'
            });
            return Number(rate);
        } catch (e) {
            return null;
        }
    }

    async buyTokens(ethAmount: string): Promise<boolean> {
        if (!this.walletClient) return false;
        try {
            const [address] = await this.walletClient.getAddresses();
            const hash = await this.walletClient.writeContract({
                address: TOKEN_SALE_ADDRESS,
                abi: TOKEN_SALE_ABI,
                functionName: 'buyTokens',
                value: parseEther(ethAmount),
                account: address
            });
            await this.publicClient.waitForTransactionReceipt({ hash });
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
}

export const tokenService = new TokenService();
