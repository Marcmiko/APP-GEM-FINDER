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
            className={`relative flex items-center px-4 py-2 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap ${badgeCount ? 'pr-9' : ''} 
                ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
            {isLoading && (
                <SpinIcon className="ml-2 w-3 h-3 animate-spin text-white/70" />
            )}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold leading-none text-white bg-rose-500 rounded-full shadow-sm ring-2 ring-slate-800">
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
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl border-b border-white/5"></div>
            <div className="container mx-auto px-4 relative">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center space-x-3 flex-shrink-0 group cursor-pointer">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <DiamondIcon className="w-9 h-9 text-indigo-400 relative z-10 transform group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="flex flex-col">
                            <span className="hidden md:block text-xl font-extrabold text-white tracking-wider leading-none">Base Gem Finder</span>
                            <span className="hidden md:block text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">AI Powered</span>
                        </div>
                        <span className="md:hidden text-xl font-bold text-white tracking-wider">BGF</span>
                    </div>

                    {/* Wallet Connect */}
                    <div className="ml-4 hidden md:block"> {/* Added hidden md:block to hide on mobile by default */}
                        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-slate-300 hover:text-white focus:outline-none ml-4"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {/* You might want to add a hamburger icon here */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>

                    <div className="flex items-center p-1.5 bg-slate-800/50 backdrop-blur-md rounded-full border border-white/5 overflow-x-auto no-scrollbar max-w-[calc(100vw-120px)] shadow-xl shadow-black/20">
                        <NavItem page="gem-finder" activePage={activePage} setActivePage={setActivePage} isLoading={gemFinder.isLoading}>Gem Finder</NavItem>
                        <NavItem page="ai-sniper" activePage={activePage} setActivePage={setActivePage}>AI Sniper 🎯</NavItem>
                        <NavItem page="new-projects" activePage={activePage} setActivePage={setActivePage} isLoading={newProjects.isLoading}>New Listings</NavItem>
                        <NavItem page="analyst-picks" activePage={activePage} setActivePage={setActivePage} isLoading={analystPicks.isLoading}>Analyst</NavItem>
                        <NavItem page="social-trends" activePage={activePage} setActivePage={setActivePage} isLoading={socialTrends.isLoading}>Trends</NavItem>
                        <NavItem page="token-analyzer" activePage={activePage} setActivePage={setActivePage} isLoading={tokenAnalyzer.isLoading} icon={<SearchIcon className="w-4 h-4" />}>Analyzer</NavItem>

                        <NavItem page="saved-projects" activePage={activePage} setActivePage={setActivePage} badgeCount={savedCount}>Saved</NavItem>
                    </div>

                    <div className="hidden lg:flex flex-col items-end justify-center ml-4">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cooked by</span>
                        <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500">MARCMIKO</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
