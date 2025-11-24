
import React, { useState } from 'react';
import { Token, TechnicalIndicators } from '../types';
import { useAlerts } from '../context/AlertContext';


// --- ICONS ---
const VerifiedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);

const BellIcon: React.FC<React.SVGProps<SVGSVGElement> & { active: boolean }> = ({ active, ...props }) => (
    active ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    )
);
const WarningIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 100-2 1 1 0 000 2zm-1-8a1 1 0 011-1h.008a1 1 0 011 1v3.006a1 1 0 01-1 1h-.008a1 1 0 01-1-1V5z" clipRule="evenodd" /></svg>
);
const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
);
const BullIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
);
const BearIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
);
const WebsiteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-9-9 9 9 0 019-9m9 9a9 9 0 01-9 9m-9-9h18m-9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9-3 4.03-3 9 1.343 9 3 9z" />
    </svg>
);
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);
const CMCIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM10.21 8.21l1.59 1.59 1.59-1.59L15.3 10.12l-1.59 1.59 1.59 1.59-1.91 1.91-1.59-1.59-1.59 1.59-1.91-1.91 1.59-1.59-1.59-1.59 1.91-1.91z" />
    </svg>
);
const GeckoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
    </svg>
);
const TelegramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.06-.14-.04-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.39-.35-.01-1.02-.2-1.52-.35-.62-.18-1.1-.28-1.05-.59.02-.15.23-.3.63-.46 2.48-1.08 4.14-1.8 4.99-2.15 2.41-1.02 2.91-1.2 3.24-1.2.07 0 .24.02.35.1.09.08.12.18.13.25 0 .11.01.23.01.36z" />
    </svg>
);
const DiscordIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
);
const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375V17.25" /></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
);
const BookmarkIcon: React.FC<React.SVGProps<SVGSVGElement> & { saved: boolean }> = ({ saved, ...props }) => (
    saved ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
            <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
    )
);

// --- VERDICT ICONS ---
const VerdictStrongBuy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>);
const VerdictPotentialBuy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h13.5A2.25 2.25 0 0019 13.75v-7.5A2.25 2.25 0 0016.75 4H3.25zM10 6a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 6zM5 8.75a.75.75 0 000 1.5h10a.75.75 0 000-1.5H5z" /></svg>);
const VerdictMonitor: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18l.88-1.473a1.65 1.65 0 011.295-.976l1.507-.22a1.65 1.65 0 011.539 1.053l.493 1.285a1.65 1.65 0 01-.22 1.652l-1.042 1.256a1.65 1.65 0 01-1.652.22l-1.285-.493a1.65 1.65 0 01-1.053-1.54l.22-1.506a1.65 1.65 0 01.976-1.295l1.473-.88-.88 1.473a.165.165 0 00-.13.098l-.493 1.285a.165.165 0 00.022.165l1.042 1.256a.165.165 0 00.165.022l1.285-.493a.165.165 0 00.106-.153l-.22-1.507a.165.165 0 00-.098-.129l-1.473-.88c.32.13.609.313.86.54l1.473.88a1.651 1.651 0 011.295.976l.22 1.506a1.65 1.65 0 01-1.053 1.54l-1.285.493a1.65 1.65 0 01-1.652-.22l-1.042-1.256a1.65 1.65 0 01.22-1.652l.493-1.285a1.65 1.65 0 011.54-1.053l1.506.22a1.65 1.65 0 01.976 1.295l.88 1.473c.443.74.443 1.62 0 2.36l-.88 1.473a1.65 1.65 0 01-1.295.976l-1.506.22a1.65 1.65 0 01-1.54-1.053l-.493-1.285a1.65 1.65 0 01.22-1.652l1.042-1.256a1.65 1.65 0 011.652-.22l1.285.493a1.65 1.65 0 011.053 1.54l-.22 1.506a1.65 1.65 0 01-.976 1.295l-1.473-.88c-.74.443-1.62.443-2.36 0l-1.473-.88a1.65 1.65 0 01-.976-1.295l-.22-1.506a1.65 1.65 0 011.053-1.54l1.285-.493a1.65 1.65 0 011.652.22l1.042 1.256a1.65 1.65 0 01-.22 1.652l-.493 1.285a1.65 1.65 0 01-1.54 1.053l-1.506-.22a1.65 1.65 0 01-.976-1.295l-.88-1.473a1.651 1.651 0 010-2.36z" clipRule="evenodd" /></svg>);
const VerdictHighRisk: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path d="M11.983 1.904a.75.75 0 00-1.292-.752l-6.5 11.25a.75.75 0 00.645 1.102h4.817a.75.75 0 01.628.324l-2.5 4.5a.75.75 0 001.292.752l6.5-11.25a.75.75 0 00-.645-1.102h-4.817a.75.75 0 01-.628-.324l2.5-4.5z" /></svg>);
const VerdictAvoid: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>);
const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>);

const BuyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
    </svg>
);

const SellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29-.082.559-.213.786-.393l.879-.66a.75.75 0 00-.9-1.2l-.879.66a2.535 2.535 0 01-.786.393V6z" clipRule="evenodd" />
    </svg>
);



const ShareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.75 4.5a3 3 0 11.825 2.066l-8.421 4.679a3.002 3.002 0 010 1.51l8.421 4.679a3 3 0 11-.729 1.31l-8.421-4.678a3 3 0 110-4.132l8.421-4.679a3 3 0 01-.096-.755z" clipRule="evenodd" />
    </svg>
);


// --- PROPS & COMPONENTS ---
interface TokenCardProps {
    token: Token;
    isSaved: boolean;
    onSave: (token: Token) => void;
    onUnsave: (token: Token) => void;
    onFlashBuy?: (token: Token) => void;
    isLive?: boolean;
}

const TokenCard: React.FC<TokenCardProps> = ({ token, isSaved, onSave, onUnsave, onFlashBuy, isLive }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { addAlert } = useAlerts();

    const handleSaveToggle = () => {
        if (isSaved) {
            onUnsave(token);
            addAlert('Token removed from watchlist!', 'info');
        } else {
            onSave(token);
            addAlert('Token added to watchlist!', 'success');
        }
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(token.address);
        addAlert('Token address copied!', 'success');
    };

    const { style: verdictStyle, icon: verdictIcon } = getVerdictStyle(token.verdict);

    return (
        <div className="glass-card rounded-2xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 border border-white/5 hover:border-indigo-500/30 flex flex-col overflow-hidden group relative">
            {isLive && (
                <div className="absolute top-0 right-0 z-20">
                    <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg animate-pulse">
                        LIVE
                    </div>
                </div>
            )}
            <div className="p-5 flex items-start justify-between relative">
                {/* Background Gradient Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

                <div className="flex items-center space-x-4 z-10">
                    <div className="relative">
                        {token.iconUrl ? (
                            <img src={token.iconUrl} alt={`${token.symbol} icon`} className="w-12 h-12 rounded-full shadow-lg ring-2 ring-white/10" />
                        ) : (
                            <IconPlaceholder symbol={token.symbol} />
                        )}
                        {token.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-0.5">
                                <VerifiedIcon className="w-4 h-4 text-indigo-400" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {token.name}
                            <span className="text-slate-500 text-sm font-medium">({token.symbol})</span>
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                                ${token.priceUsd < 0.01 ? token.priceUsd.toFixed(6) : token.priceUsd.toFixed(4)}
                            </span>
                            {token.priceChange24h !== undefined && (
                                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${token.priceChange24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 z-10">
                    <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${verdictStyle}`}>
                        {verdictIcon}
                        <span>{token.verdict}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                        {onFlashBuy && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFlashBuy(token);
                                }}
                                className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all duration-300 border border-amber-500/20"
                                title="Flash Buy"
                            >
                                ⚡
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                isSaved ? onUnsave(token) : onSave(token);
                            }}
                            className={`p-2 rounded-xl transition-all duration-300 border ${isSaved
                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-400'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 border-white/5'
                                }`}
                        >
                            {isSaved ? <BookmarkIcon saved={true} className="w-5 h-5" /> : <BookmarkIcon saved={false} className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-all duration-300 border border-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-5 pb-5 border-t border-white/5 pt-5 bg-slate-900/30">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column - Analysis (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <AnalysisSection
                                        title="AI Analysis"
                                        content={token.aiAnalysis || 'No AI analysis available.'}
                                        icon={<BullIcon />}
                                        iconClass="text-indigo-400"
                                        bgClass="bg-indigo-500/5 border-indigo-500/10"
                                    />
                                </div>
                                <AnalysisSection
                                    title="Key Drivers"
                                    content={token.keyDrivers || 'No key drivers identified.'}
                                    icon={<InfoIcon />}
                                    iconClass="text-sky-400"
                                    bgClass="bg-sky-500/5 border-sky-500/10"
                                />
                                <AnalysisSection
                                    title="Risks"
                                    content={token.risks || 'No specific risks identified.'}
                                    icon={<WarningIcon />}
                                    iconClass="text-rose-400"
                                    bgClass="bg-rose-500/5 border-rose-500/10"
                                />
                            </div>

                            {token.technicalIndicators && <TechnicalSection indicators={token.technicalIndicators} />}
                            {token.buyPressure !== undefined && token.buyPressure !== null && <BuyPressureGauge pressure={token.buyPressure} />}
                        </div>

                        {/* Right Column - Stats & Security (5 cols) */}
                        <div className="lg:col-span-5 space-y-4">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2"></span>
                                    Token Metrics
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <MetricRow label="Market Cap" value={formatNumber(token.marketCap)} />
                                    <MetricRow label="24h Volume" value={formatNumber(token.volume24h)} />
                                    <MetricRow label="Circulating" value={formatNumber(token.circulatingSupply)} />
                                    <MetricRow label="Total Supply" value={formatNumber(token.totalSupply)} />
                                    <MetricRow label="Launch Date" value={new Date(token.creationDate).toLocaleDateString()} />
                                    <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                        <span className="text-slate-500 text-xs">Contract</span>
                                        <div className="flex items-center space-x-2 bg-slate-900/50 px-2 py-1 rounded-lg border border-white/5">
                                            <a href={`https://etherscan.io/token/${token.address}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-xs font-mono">
                                                {token.address.substring(0, 6)}...{token.address.substring(token.address.length - 4)}
                                            </a>
                                            <button onClick={handleCopyAddress} className="text-slate-500 hover:text-white transition-colors">
                                                <CopyIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {token.auditReport ? (
                                <AuditScorecard report={token.auditReport} score={token.auditReport.overallScore} />
                            ) : (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                                        Security Checks
                                    </h4>
                                    <div className="space-y-2">
                                        <SecurityCheck label="Renounced Ownership" isSecure={token.securityChecks.renouncedOwnership} />
                                        <SecurityCheck label="Liquidity Locked" isSecure={token.securityChecks.liquidityLocked} />
                                        <SecurityCheck label="No Mint Function" isSecure={token.securityChecks.noMintFunction} />
                                        <SecurityCheck label="No Blacklist" isSecure={token.securityChecks.noBlacklist} />
                                        <SecurityCheck label="No Proxy" isSecure={token.securityChecks.noProxy} />
                                    </div>
                                </div>
                            )}

                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                                    <ShareIcon className="w-3 h-3 mr-2" />
                                    Links
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {token.links.website && <LinkButton href={token.links.website} icon={<WebsiteIcon className="w-3.5 h-3.5" />} label="Web" />}
                                    {token.links.twitter && <LinkButton href={token.links.twitter} icon={<XIcon className="w-3.5 h-3.5" />} label="X" />}
                                    {token.links.telegram && <LinkButton href={token.links.telegram} icon={<TelegramIcon className="w-3.5 h-3.5" />} label="TG" />}
                                    {token.links.discord && <LinkButton href={token.links.discord} icon={<DiscordIcon className="w-3.5 h-3.5" />} label="Discord" />}
                                    {token.links.coinmarketcap && <LinkButton href={token.links.coinmarketcap} icon={<CMCIcon className="w-3.5 h-3.5" />} label="CMC" />}
                                    {token.links.coingecko && <LinkButton href={token.links.coingecko} icon={<GeckoIcon className="w-3.5 h-3.5" />} label="Gecko" />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
        case 'Strong Buy': return { style: "bg-green-500/10 text-green-400 border-green-500/30", icon: <VerdictStrongBuy className="w-5 h-5" /> };
        case 'Potential Buy': return { style: "bg-sky-500/10 text-sky-400 border-sky-500/30", icon: <VerdictPotentialBuy className="w-5 h-5" /> };
        case 'Monitor': return { style: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", icon: <VerdictMonitor className="w-5 h-5" /> };
        case 'High Risk': return { style: "bg-orange-500/10 text-orange-400 border-orange-500/30", icon: <VerdictHighRisk className="w-5 h-5" /> };
        case 'Avoid': return { style: "bg-red-500/10 text-red-400 border-red-500/30", icon: <VerdictAvoid className="w-5 h-5" /> };
        case 'New Listing': return { style: "bg-slate-700 text-slate-300 border-slate-600", icon: <InfoIcon className="w-5 h-5" /> };
        default: return { style: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: <BearIcon className="w-5 h-5" /> };
    }
}

const IconPlaceholder: React.FC<{ symbol?: string }> = ({ symbol }) => (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-indigo-400 text-xl flex-shrink-0 shadow-inner ring-1 ring-white/5">
        {symbol ? symbol.charAt(0).toUpperCase() : '?'}
    </div>
);

const AnalysisSection: React.FC<{ title: string; content: string; icon: React.ReactNode; iconClass: string; bgClass?: string }> = ({ title, content, icon, iconClass, bgClass }) => {
    if (content === 'N/A') return null;
    return (
        <div className={`rounded-xl p-4 border ${bgClass || 'bg-slate-800/50 border-white/5'}`}>
            <div className="flex items-center space-x-2 mb-2">
                <div className={`w-5 h-5 ${iconClass}`}>{icon}</div>
                <h4 className="text-sm font-bold text-white">{title}</h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{content}</p>
        </div>
    );
}

const MetricRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-medium font-mono">{value}</span>
    </div>
);

const LinkButton: React.FC<{ href: string; icon: React.ReactNode; label: string }> = ({ href, icon, label }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all border border-white/5 hover:border-white/10">
        {icon} <span>{label}</span>
    </a>
);

const TechnicalSection: React.FC<{ indicators?: TechnicalIndicators }> = ({ indicators }) => {
    if (!indicators || (!indicators.rsi && !indicators.macd)) return null;

    // RSI Color Logic
    const getRsiColor = (rsi: number) => {
        if (rsi >= 70) return 'bg-red-500'; // Overbought
        if (rsi <= 30) return 'bg-green-500'; // Oversold
        return 'bg-indigo-500'; // Neutral
    };

    // RSI Value Display Color
    const getRsiTextColor = (rsi: number) => {
        if (rsi >= 70) return 'text-red-400';
        if (rsi <= 30) return 'text-green-400';
        return 'text-indigo-400';
    }

    return (
        <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                    <path d="M15.5 2A1.5 1.5 0 0014 3.5v8a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v4a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-4A1.5 1.5 0 0010.5 6h-1zM3.5 10a1.5 1.5 0 00-1.5 1.5v.5a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-.5a1.5 1.5 0 00-1.5-1.5h-1z" />
                </svg>
                Technical Indicators
            </h4>
            <div className="grid grid-cols-1 gap-3">
                {indicators.rsi !== null && (
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400 font-medium">RSI (14)</span>
                            <span className={`font-mono font-bold ${getRsiTextColor(indicators.rsi)}`}>{indicators.rsi}</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                            <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${getRsiColor(indicators.rsi)}`}
                                style={{ width: `${Math.min(Math.max(indicators.rsi, 0), 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                            <span>Oversold (Buy)</span>
                            <span>Overbought (Sell)</span>
                        </div>
                    </div>
                )}

                {(indicators.macd || indicators.movingAverages) && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {indicators.macd && (
                            <div className="bg-slate-800 rounded px-2 py-1.5">
                                <span className="block text-[10px] text-slate-500 uppercase">MACD</span>
                                <span className="text-xs font-medium text-white truncate" title={indicators.macd}>{indicators.macd}</span>
                            </div>
                        )}
                        {indicators.movingAverages && (
                            <div className="bg-slate-800 rounded px-2 py-1.5">
                                <span className="block text-[10px] text-slate-500 uppercase">Trend (MA)</span>
                                <span className="text-xs font-medium text-white truncate" title={indicators.movingAverages}>{indicators.movingAverages}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const BuyPressureGauge: React.FC<{ pressure: number }> = ({ pressure }) => {
    // Pressure is 0-100 (percentage of buys)
    // 0 = All Sells (Red), 100 = All Buys (Green), 50 = Neutral
    const isBullish = pressure > 50;
    const colorClass = isBullish ? 'bg-emerald-500' : 'bg-rose-500';
    const textColor = isBullish ? 'text-emerald-400' : 'text-rose-400';
    const label = isBullish ? 'Buy Pressure' : 'Sell Pressure';

    return (
        <div className="mt-4 bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                    </svg>
                    24h Buy Pressure
                </h4>
                <span className={`text-sm font-bold ${textColor}`}>{pressure}% Buys</span>
            </div>

            <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden flex">
                {/* Sells Part (Red) */}
                <div
                    className="h-full bg-rose-500/80 transition-all duration-1000"
                    style={{ width: `${100 - pressure}%` }}
                ></div>
                {/* Buys Part (Green) */}
                <div
                    className="h-full bg-emerald-500/80 transition-all duration-1000"
                    style={{ width: `${pressure}%` }}
                ></div>

                {/* Center Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 transform -translate-x-1/2"></div>
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>Sellers Dominating</span>
                <span>Buyers Dominating</span>
            </div>
        </div>
    );
};

const SecurityCheck: React.FC<{ label: string; isSecure: boolean }> = ({ label, isSecure }) => {
    const Icon = isSecure ? VerifiedIcon : WarningIcon;
    const color = isSecure ? 'text-green-400' : 'text-amber-400';
    return (
        <div className="flex items-center space-x-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm text-slate-300">{label}</span>
        </div>
    );
};

const formatNumber = (num?: number | null) => {
    if (num === null || num === undefined) return 'N/A';
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
}

const AuditScorecard: React.FC<{ report: NonNullable<Token['auditReport']>, score: number }> = ({ report, score }) => {
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-green-400';
        if (s >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="mt-4 bg-slate-900/80 rounded-xl p-4 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-xl">🛡️</span> AI Audit Scorecard
                </h4>
                <div className={`px-3 py-1 rounded-full font-bold text-sm border ${getScoreColor(score)} border-current bg-opacity-10`}>
                    {score}/100
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-slate-800 rounded-lg">
                    <div className={`text-xs font-bold ${getScoreColor(report.securityScore)}`}>{report.securityScore}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Security</div>
                </div>
                <div className="text-center p-2 bg-slate-800 rounded-lg">
                    <div className={`text-xs font-bold ${getScoreColor(report.utilityScore)}`}>{report.utilityScore}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Utility</div>
                </div>
                <div className="text-center p-2 bg-slate-800 rounded-lg">
                    <div className={`text-xs font-bold ${getScoreColor(report.communityScore)}`}>{report.communityScore}</div>
                    <div className="text-[10px] text-slate-500 uppercase mt-1">Community</div>
                </div>
            </div>

            <div className="space-y-2">
                {report.redFlags.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                        <h5 className="text-xs font-bold text-red-400 mb-1 flex items-center gap-1">
                            <WarningIcon className="w-3 h-3" /> Red Flags
                        </h5>
                        <ul className="list-disc list-inside text-[10px] text-red-300/80 space-y-0.5">
                            {report.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                        </ul>
                    </div>
                )}
                {report.greenFlags.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                        <h5 className="text-xs font-bold text-green-400 mb-1 flex items-center gap-1">
                            <VerifiedIcon className="w-3 h-3" /> Green Flags
                        </h5>
                        <ul className="list-disc list-inside text-[10px] text-green-300/80 space-y-0.5">
                            {report.greenFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};



export default TokenCard;
