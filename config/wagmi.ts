
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

const projectId = 'f5281b195c2a7472e1b59d1afc9223d7'; // Get one at https://cloud.walletconnect.com

export const config = getDefaultConfig({
    appName: 'MARCMIKO',
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
