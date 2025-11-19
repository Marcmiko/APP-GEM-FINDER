
import React, { useState } from 'react';
import Header from './components/Header';
import GemFinderPage from './components/GemFinderPage';
import NewProjectsPage from './components/NewProjectsPage';
import AnalystPicksPage from './components/AnalystPicksPage';
import SocialTrendsPage from './components/SocialTrendsPage';
import SavedProjectsPage from './components/SavedProjectsPage';
import TokenAnalyzerPage from './components/TokenAnalyzerPage';
import { Token } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ScanProvider } from './context/ScanContext';
import { AlertProvider } from './context/AlertContext';

export type Page = 'gem-finder' | 'new-projects' | 'analyst-picks' | 'social-trends' | 'saved-projects' | 'token-analyzer';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('gem-finder');
  const [savedTokens, setSavedTokens] = useLocalStorage<Token[]>('savedTokens', []);

  const handleSaveToken = (tokenToSave: Token) => {
    setSavedTokens(prev => {
      if (prev.some(t => t.address === tokenToSave.address)) {
        return prev; // Already saved
      }
      return [...prev, tokenToSave];
    });
  };

  const handleUnsaveToken = (tokenToUnsave: Token) => {
    setSavedTokens(prev => prev.filter(t => t.address !== tokenToUnsave.address));
  };

  const savedTokenProps = {
    savedTokens,
    onSave: handleSaveToken,
    onUnsave: handleUnsaveToken,
  };

  return (
    <ScanProvider>
      <AlertProvider>
        <div className="min-h-screen bg-slate-900 text-gray-200">
          <Header activePage={activePage} setActivePage={setActivePage} savedCount={savedTokens.length} />
          <main className="container mx-auto px-4 py-8 md:py-12">
            {activePage === 'gem-finder' && <GemFinderPage {...savedTokenProps} />}
            {activePage === 'new-projects' && <NewProjectsPage {...savedTokenProps} />}
            {activePage === 'analyst-picks' && <AnalystPicksPage {...savedTokenProps} />}
            {activePage === 'social-trends' && <SocialTrendsPage {...savedTokenProps} />}
            {activePage === 'token-analyzer' && <TokenAnalyzerPage {...savedTokenProps} />}
            {activePage === 'saved-projects' && <SavedProjectsPage {...savedTokenProps} />}
          </main>
          <footer className="text-center py-6 border-t border-slate-800 mt-16">
            <p className="text-sm text-slate-500">Disclaimer: This is not financial advice. Cryptocurrency investments are highly volatile. Do your own research.</p>
          </footer>
        </div>
      </AlertProvider>
    </ScanProvider>
  );
};

export default App;
