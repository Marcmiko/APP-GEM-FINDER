
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Gem Finder AI',
    projectId: 'YOUR_PROJECT_ID', // TODO: Get a real Project ID from WalletConnect
    chains: [base],
    ssr: false, // If your dApp uses server side rendering (SSR)
});
