import React, { useState, useEffect } from 'react';
import { Page } from '../types';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useScanContext } from '../context/ScanContext';

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
            className={`relative flex items-center px-5 py-2.5 text-sm font-bold rounded-2xl transition-all duration-300 whitespace-nowrap ${badgeCount ? 'pr-10' : ''} 
                ${isActive
                    ? 'bg-slate-800 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
        >
            {icon && <span className={`mr-2 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400'}`}>{icon}</span>}
            <span className={isActive ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' : ''}>
                {children}
            </span>
            {isLoading && (
                <SpinIcon className="ml-2 w-3 h-3 animate-spin text-indigo-400" />
            )}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-sm">
                    {badgeCount}
                </span>
            )}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, savedCount }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { gemFinder, newProjects, analystPicks, socialTrends, tokenAnalyzer } = useScanContext();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className="absolute inset-0 glass-panel border-b-0"></div>
            <div className="container mx-auto px-4 relative">
                <div className="flex items-center justify-between h-24">
                    <div className="flex items-center space-x-4 flex-shrink-0 group cursor-pointer">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                            <DiamondIcon className="w-10 h-10 text-indigo-400 relative z-10 transform group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="hidden md:block text-2xl font-black text-white tracking-tight">
                                GEM<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">FINDER</span>
                            </span>
                            <span className="hidden md:block text-[10px] font-bold text-slate-500 tracking-[0.3em] uppercase">AI Powered Sniper</span>
                        </div>
                        <span className="md:hidden text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">GF</span>
                    </div>

                    {/* Navigation - Desktop & Mobile Scroll */}
                    <div className="flex-1 max-w-4xl mx-4 md:mx-8 overflow-x-auto no-scrollbar">
                        <div className="flex items-center p-1.5 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/5 w-max mx-auto">
                            <NavItem page="gem-finder" activePage={activePage} setActivePage={setActivePage} isLoading={gemFinder.isLoading}>Gem Finder</NavItem>
                            <NavItem page="ai-sniper" activePage={activePage} setActivePage={setActivePage}>Sniper</NavItem>
                            <NavItem page="new-projects" activePage={activePage} setActivePage={setActivePage} isLoading={newProjects.isLoading}>New</NavItem>
                            <NavItem page="analyst-picks" activePage={activePage} setActivePage={setActivePage} isLoading={analystPicks.isLoading}>Analyst</NavItem>
                            <NavItem page="social-trends" activePage={activePage} setActivePage={setActivePage} isLoading={socialTrends.isLoading}>Trends</NavItem>
                            <NavItem page="token-analyzer" activePage={activePage} setActivePage={setActivePage} isLoading={tokenAnalyzer.isLoading} icon={<SearchIcon className="w-4 h-4" />}>Analyzer</NavItem>
                            <NavItem page="saved-projects" activePage={activePage} setActivePage={setActivePage} badgeCount={savedCount}>Your Wallet</NavItem>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block">
                            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                        </div>

                        {/* Mobile Menu Toggle (if needed in future, currently nav is scrollable) */}
                        <div className="md:hidden">
                            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
