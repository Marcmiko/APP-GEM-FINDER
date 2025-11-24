
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    coinbaseWallet,
    walletConnectWallet,
    metaMaskWallet,
    rainbowWallet,
} from '@rainbow-me/rainbowkit/wallets';

const projectId = 'YOUR_PROJECT_ID'; // Get one at https://cloud.walletconnect.com

export const config = getDefaultConfig({
    appName: 'Gem Finder AI',
    projectId,
    chains: [base],
    ssr: false,
    wallets: [
        {
            groupName: 'Recommended',
            wallets: [
                coinbaseWallet,
                metaMaskWallet,
                rainbowWallet,
                walletConnectWallet,
            ],
        },
    ],
});
