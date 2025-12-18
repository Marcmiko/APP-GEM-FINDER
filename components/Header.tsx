import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useScanContext } from '../context/ScanContext';

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

const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122z" />
    </svg>
);

const WalletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" />
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
    isExclusive?: boolean;
}> = ({ page, activePage, setActivePage, children, badgeCount, isLoading, icon, isExclusive }) => {
    const isActive = page === activePage;
    return (
        <button
            onClick={() => setActivePage(page)}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 whitespace-nowrap group
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
            {isExclusive && (
                <span className="ml-1 px-1 py-0.5 text-[8px] font-black rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 tracking-widest uppercase">
                    PRO
                </span>
            )}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, savedCount }) => {
    const { gemFinder, newProjects, analystPicks, socialTrends, tokenAnalyzer } = useScanContext();

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            {/* Glass Background */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shadow-2xl"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex items-center justify-between h-20">
                    {/* Logo Area */}
                    <div className="flex items-center space-x-3 flex-shrink-0 group cursor-pointer" onClick={() => setActivePage('gem-finder')}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <DiamondIcon className="w-8 h-8 text-indigo-400 relative z-10 transform group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-white">
                                MARCMIKO
                            </span>
                            <span className="text-[9px] font-bold text-indigo-400 tracking-[0.2em] uppercase">
                                Intelligence
                            </span>
                        </div>
                    </div>

                    {/* Navigation - Scrollable Container */}
                    <div className="flex-1 max-w-5xl mx-4 md:mx-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center space-x-1 p-1 w-max mx-auto">
                            <NavItem page="gem-finder" activePage={activePage} setActivePage={setActivePage} isLoading={gemFinder.isLoading} icon={<DiamondIcon className="w-4 h-4" />} isExclusive={true}>
                                Gem Finder
                            </NavItem>
                            <NavItem page="ai-sniper" activePage={activePage} setActivePage={setActivePage} icon={<SniperIcon className="w-4 h-4" />} isExclusive={true}>
                                <span className="flex items-center gap-1.5">
                                    Sniper
                                    <span className="flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                    </span>
                                </span>
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
                            <NavItem page="community" activePage={activePage} setActivePage={setActivePage} icon={<UsersIcon className="w-4 h-4" />}>
                                Community
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
