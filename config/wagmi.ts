
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'wagmi';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    coinbaseWallet,
    walletConnectWallet,
    metaMaskWallet,
    rainbowWallet,
    trustWallet,
    ledgerWallet,
    phantomWallet,
    rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';

const projectId = 'f5281b195c2a7472e1b59d1afc9223d7'; // Get one at https://cloud.walletconnect.com

export const config = getDefaultConfig({
    appName: 'MARCMIKO GEM FINDER',
    projectId,
    chains: [base],
    ssr: false,
    appIcon: 'https://base-gem-finder.vercel.app/gem-logo.png', // Add your app icon here
    wallets: [
        {
            groupName: 'Recommended',
            wallets: [
                coinbaseWallet,
                walletConnectWallet,
                metaMaskWallet,
                rainbowWallet,
            ],
        },
        {
            groupName: 'Other',
            wallets: [
                trustWallet,
                ledgerWallet,
                phantomWallet,
                rabbyWallet,
            ],
        },
    ],
    transports: {
        [base.id]: http('https://base.llamarpc.com'),
    },
});
