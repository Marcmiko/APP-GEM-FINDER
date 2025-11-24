
import { parseEther, createPublicClient, createWalletClient, http, custom, Address } from 'viem';
import { base } from 'viem/chains';

declare global {
    interface Window {
        ethereum?: any;
    }
}

// Uniswap V2 Router on Base (using Uniswap V2 for broad compatibility with new tokens)
// Note: Many new tokens on Base launch on Uniswap V2 or V3.
// Ideally we'd check the pool version, but for a simple "Flash Buy", V2 is a safe default for many "degen" tokens.
// If it's V3, this might fail. We can add V3 support later or use a router aggregator.
const UNISWAP_V2_ROUTER_ADDRESS = '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24';
const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';

const UNISWAP_V2_ROUTER_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactETHForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

export const executeSwap = async (
    tokenAddress: string,
    amountInEth: string,
    slippagePercent: number = 5 // Default 5% for new tokens
) => {
    if (!window.ethereum) throw new Error("No wallet found");

    const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
    });

    const [account] = await walletClient.requestAddresses();

    const amountInWei = parseEther(amountInEth);
    const path = [WETH_ADDRESS, tokenAddress] as `0x${string}`[];
    const to = account;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20); // 20 minutes

    // Calculate min amount out (simplified for now, ideally fetch quote)
    // For "Flash Buy", we often set minAmountOut to 0 or very low to ensure execution (high slippage)
    // But strictly, we should calculate it.
    // For this MVP, we'll use 0 to prioritize execution speed (User beware!)
    const amountOutMin = 0n;

    try {
        const hash = await walletClient.writeContract({
            address: UNISWAP_V2_ROUTER_ADDRESS,
            abi: UNISWAP_V2_ROUTER_ABI,
            functionName: 'swapExactETHForTokens',
            args: [amountOutMin, path, to, deadline],
            value: amountInWei,
            account,
            chain: base
        });
        return hash;
    } catch (error) {
        console.error("Swap failed:", error);
        throw error;
    }
}

export const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // Native USDC on Base

const ERC20_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "spender", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }],
        "name": "allowance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
] as const;

const UNISWAP_V2_ROUTER_SWAP_TOKENS_ABI = [
    {
        "inputs": [
            { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
            { "internalType": "uint256", "name": "amountOutMin", "type": "uint256" },
            { "internalType": "address[]", "name": "path", "type": "address[]" },
            { "internalType": "address", "name": "to", "type": "address" },
            { "internalType": "uint256", "name": "deadline", "type": "uint256" }
        ],
        "name": "swapExactTokensForTokens",
        "outputs": [{ "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const checkAllowance = async (tokenAddress: string, owner: string, spender: string) => {
    if (!window.ethereum) throw new Error("No wallet found");
    const publicClient = createPublicClient({
        chain: base,
        transport: custom(window.ethereum)
    });
    // @ts-ignore
    const data = await publicClient.readContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [owner as Address, spender as Address]
    });
    return data;
};

export const approveToken = async (tokenAddress: string, spender: string, amount: bigint) => {
    if (!window.ethereum) throw new Error("No wallet found");
    const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
    });
    const [account] = await walletClient.requestAddresses();

    const hash = await walletClient.writeContract({
        address: tokenAddress as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender as Address, amount],
        account,
        chain: base
    });
    return hash;
};

export const executeTokenSwap = async (
    tokenInAddress: string,
    tokenOutAddress: string,
    amountIn: bigint,
    slippagePercent: number = 5
) => {
    if (!window.ethereum) throw new Error("No wallet found");
    const walletClient = createWalletClient({
        chain: base,
        transport: custom(window.ethereum)
    });
    const [account] = await walletClient.requestAddresses();

    // Path: TokenIn -> WETH -> TokenOut (if TokenIn is not WETH)
    // For USDC -> Token, usually USDC -> WETH -> Token
    let path: Address[];
    if (tokenInAddress.toLowerCase() === WETH_ADDRESS.toLowerCase()) {
        path = [tokenInAddress as Address, tokenOutAddress as Address];
    } else {
        path = [tokenInAddress as Address, WETH_ADDRESS as Address, tokenOutAddress as Address];
    }

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    const amountOutMin = 0n; // High slippage for sniper

    try {
        const hash = await walletClient.writeContract({
            address: UNISWAP_V2_ROUTER_ADDRESS,
            abi: UNISWAP_V2_ROUTER_SWAP_TOKENS_ABI,
            functionName: 'swapExactTokensForTokens',
            args: [amountIn, amountOutMin, path, account, deadline],
            account,
            chain: base
        });
        return hash;
    } catch (error) {
        console.error("Token swap failed:", error);
        throw error;
    }
};
