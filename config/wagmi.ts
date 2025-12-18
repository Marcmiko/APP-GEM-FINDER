
import '@rainbow-me/rainbowkit/styles.css';
import {
    connectorsForWallets
} from '@rainbow-me/rainbowkit';
import {
    rainbowWallet,
    walletConnectWallet,
    coinbaseWallet,
    metaMaskWallet,
    trustWallet,
    ledgerWallet,
    phantomWallet,
    rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { base } from 'wagmi/chains';
import { http, createConfig } from 'wagmi';

const projectId = 'f5281b195c2a7472e1b59d1afc9223d7';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [
                coinbaseWallet,
                walletConnectWallet,
                metaMaskWallet,
                rainbowWallet,
                trustWallet,
            ],
        },
        {
            groupName: 'Other',
            wallets: [
                ledgerWallet,
                phantomWallet,
                rabbyWallet,
            ],
        },
    ],
    {
        appName: 'MARCMIKO GEM FINDER',
        projectId,
    }
);

export const config = createConfig({
    connectors,
    chains: [base],
    transports: {
        [base.id]: http(),
    },
});
