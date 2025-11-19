
import React from 'react';
import { Page } from '../App';
import { useScanContext } from '../context/ScanContext';

const DiamondIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.001 2.003c.87-.002 1.66.495 2.03 1.25l7.108 14.218c.367.734.363 1.61-.01 2.34a2.122 2.122 0 01-1.84 1.189H4.713a2.122 2.122 0 01-1.84-1.189 2.124 2.124 0 01-.01-2.34L10.03 3.253a2.123 2.123 0 011.97-1.25zm0 2.27L6.08 18.75h11.84L12.001 4.273z"/>
    </svg>
);

const SpinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" {...props}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
}> = ({ page, activePage, setActivePage, children, badgeCount, isLoading }) => {
    const isActive = page === activePage;
    return (
        <button
            onClick={() => setActivePage(page)}
            className={`relative flex items-center px-3 py-2 text-sm font-semibold rounded-md transition-all ${
                isActive 
                ? 'bg-indigo-600 text-white' 
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
        >
            {children}
            {isLoading && (
                <SpinIcon className="ml-2 w-3 h-3 animate-spin text-cyan-300" />
            )}
            {badgeCount !== undefined && badgeCount > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-pink-500 rounded-full">
                    {badgeCount}
                </span>
            )}
        </button>
    )
}

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage, savedCount }) => {
  const { gemFinder, newProjects, analystPicks, socialTrends } = useScanContext();

  return (
    <header className="bg-slate-900/60 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
             <DiamondIcon className="w-8 h-8 text-indigo-400"/>
            <span className="text-xl font-bold text-white tracking-wider">Base Gem Finder</span>
          </div>
          
          <div className="flex items-center space-x-1 p-1 bg-slate-800 rounded-lg overflow-x-auto no-scrollbar">
            <NavItem page="gem-finder" activePage={activePage} setActivePage={setActivePage} isLoading={gemFinder.isLoading}>Gem Finder</NavItem>
            <NavItem page="new-projects" activePage={activePage} setActivePage={setActivePage} isLoading={newProjects.isLoading}>New Listings</NavItem>
            <NavItem page="analyst-picks" activePage={activePage} setActivePage={setActivePage} isLoading={analystPicks.isLoading}>Analyst</NavItem>
            <NavItem page="social-trends" activePage={activePage} setActivePage={setActivePage} isLoading={socialTrends.isLoading}>Social Trends</NavItem>
            <NavItem page="saved-projects" activePage={activePage} setActivePage={setActivePage} badgeCount={savedCount}>Saved</NavItem>
          </div>
          
          <span
            className="hidden sm:block text-sm font-medium text-slate-400"
          >
            Powered by Marcmiko
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
