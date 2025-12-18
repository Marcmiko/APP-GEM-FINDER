
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';

const projectId = 'f5281b195c2a7472e1b59d1afc9223d7';

export const config = getDefaultConfig({
    appName: 'MARCMIKO GEM FINDER',
    projectId,
    chains: [base],
    ssr: false,
});
