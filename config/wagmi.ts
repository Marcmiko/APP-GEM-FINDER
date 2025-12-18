
import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
    coinbaseWallet,
    walletConnectWallet,
    metaMaskWallet,
    rainbowWallet,
    trustWallet
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';

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
                trustWallet
            ],
        },
    ],
    {
        appName: 'MARCMIKO Intelligence',
        projectId,
    }
);

export const config = createConfig({
    connectors,
    chains: [base],
    ssr: false,
    transports: {
        [base.id]: http('https://mainnet.base.org'),
    },
});
