
import React from 'react';
import { Page } from '../types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useScanContext } from '../context/ScanContext';
import { useSettings } from '../context/SettingsContext';

// --- ICONS ---
const DiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.001 2.003c.87-.002 1.66.495 2.03 1.25l7.108 14.218c.367.734.363 1.61-.01 2.34a2.122 2.122 0 01-1.84 1.189H4.713a2.122 2.122 0 01-1.84-1.189 2.124 2.124 0 01-.01-2.34L10.03 3.253a2.123 2.123 0 011.97-1.25zm0 2.27L6.08 18.75h11.84L12.001 4.273z" />
    </svg>
);

const SpinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
    </svg>
);

const SniperIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 6a6 6 0 100 12 6 6 0 000-12zm-3 6a3 3 0 116 0 3 3 0 01-6 0z" clipRule="evenodd" />
    </svg>
);

const NewIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
    </svg>
);

const AnalystIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

const TrendingIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 01.968-.432l5.942 2.28a.75.75 0 01.431.97l-2.28 5.941a.75.75 0 11-1.4-.537l1.63-4.251-1.086.483a6 6 0 00-2.742 2.742l-.921 2.763a.75.75 0 01-1.422-.474l.921-2.763a4.5 4.5 0 012.056-2.056l2.763-.921-4.251 1.63a.75.75 0 01-.537-1.402l5.941-2.28z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75 1.886 0 3.66.535 5.18 1.467a.75.75 0 01-.79 1.278A8.22 8.22 0 0012 3.75a8.25 8.25 0 00-8.25 8.25c0 2.89 1.495 5.438 3.75 6.95a.75.75 0 11-.832 1.25A9.72 9.72 0 012.25 12z" clipRule="evenodd" />
    </svg>
);

const WalletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" />
    </svg>
);

const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.85C8.001 6.234 7.058 6.78 6.234 7.507L4.15 6.41c-.893-.444-1.952-.185-2.446.702-.494.887-.186 1.952.702 2.446l2.083 1.033c-.283.945-.487 1.933-.598 2.952L2.81 14.93c-1.002.24-1.623 1.25-1.383 2.262.24 1.012 1.25 1.623 2.262 1.383l2.581-.645c.825.727 1.768 1.274 2.818 1.658l-.174 2.089c-.151.904.532 1.73 1.45 1.85.917.12 1.73-.532 1.85-1.45l.174-2.089c1.05-.384 2.023-.93 2.818-1.658l2.581.645c1.012.24 2.022-.37 2.262-1.383.24-1.012-.37-2.022-1.383-2.262l-2.083-.52c-.11-.98-.315-1.933-.598-2.952l2.083-1.033c.887-.494 1.195-1.559.702-2.446-.494-.887-1.559-1.195-2.446-.702l-2.084 1.033c-.825-.727-1.768-1.274-2.818-1.658l.174-2.09c.151-.904-.532-1.73-1.45-1.85a1.88 1.88 0 00-.233 0zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
    </svg>
);

interface HeaderProps {
    activePage: Page;
    setActivePage: (page: Page) => void;
    savedCount: number;
}

const NavItem: React.FC<{
    page: Page;
    activePage: Page;
    setActivePage: (page: Page) => void;
    children: React.ReactNode;
    badgeCount?: number;
    isLoading?: boolean;
    icon?: React.ReactNode;
}> = ({ page, activePage, setActivePage, children, badgeCount, isLoading, icon }) => {
    const isActive = page === activePage;
    return (
        <button
            onClick={() => setActivePage(page)}
            className={`relative flex items-center gap-1 px-2 py-2 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap group
                ${isActive
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
        >
            {icon && <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{icon}</span>}
            <span>{children}</span>
            {isLoading && (
                <SpinIcon className="w-3 h-3 animate-spin text-indigo-200" />
            )}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'}`}>
                    {badgeCount}
                </span>
            )}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, savedCount }) => {
    const { gemFinder, newProjects, analystPicks, socialTrends, tokenAnalyzer } = useScanContext();
    const { settings } = useSettings();

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shadow-2xl"></div>

            <div className="container mx-auto px-4 relative">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Area */}
                    <div className="flex items-center space-x-3 flex-shrink-0 group cursor-pointer" onClick={() => setActivePage('gem-finder')}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <DiamondIcon className="w-8 h-8 text-indigo-400 relative z-10 transform group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-white">
                                {settings.brandName}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-400 tracking-[0.2em] uppercase">
                                Intelligence
                            </span>
                        </div>
                    </div>

                    {/* Navigation - Scrollable Container */}
                    <div className="flex-1 max-w-5xl mx-4 md:mx-8 overflow-x-auto no-scrollbar mask-fade-sides">
                        <div className="flex items-center space-x-1 p-1 w-max mx-auto">
                            <NavItem page="gem-finder" activePage={activePage} setActivePage={setActivePage} isLoading={gemFinder.isLoading} icon={<DiamondIcon className="w-4 h-4" />}>
                                Gem Finder
                            </NavItem>
                            <NavItem page="ai-sniper" activePage={activePage} setActivePage={setActivePage} icon={<SniperIcon className="w-4 h-4" />}>
                                Sniper
                            </NavItem>
                            <NavItem page="new-projects" activePage={activePage} setActivePage={setActivePage} isLoading={newProjects.isLoading} icon={<NewIcon className="w-4 h-4" />}>
                                New
                            </NavItem>
                            <NavItem page="analyst-picks" activePage={activePage} setActivePage={setActivePage} isLoading={analystPicks.isLoading} icon={<AnalystIcon className="w-4 h-4" />}>
                                Analyst
                            </NavItem>
                            <NavItem page="social-trends" activePage={activePage} setActivePage={setActivePage} isLoading={socialTrends.isLoading} icon={<TrendingIcon className="w-4 h-4" />}>
                                Trends
                            </NavItem>
                            <NavItem page="token-analyzer" activePage={activePage} setActivePage={setActivePage} isLoading={tokenAnalyzer.isLoading} icon={<SearchIcon className="w-4 h-4" />}>
                                Analyzer
                            </NavItem>
                            <NavItem page="saved-projects" activePage={activePage} setActivePage={setActivePage} badgeCount={savedCount} icon={<WalletIcon className="w-4 h-4" />}>
                                Portfolio
                            </NavItem>
                             <NavItem page="settings" activePage={activePage} setActivePage={setActivePage} icon={<SettingsIcon className="w-4 h-4" />}>
                                Settings
                            </NavItem>
                        </div>
                    </div>

                    {/* Wallet Connect */}
                    <div className="flex-shrink-0">
                        <ConnectButton
                            showBalance={false}
                            chainStatus={{ smallScreen: 'none', largeScreen: 'icon' }}
                            accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
