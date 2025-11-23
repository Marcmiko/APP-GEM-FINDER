
import React, { useState } from 'react';
import Header from './components/Header';
import GemFinderPage from './components/GemFinderPage';
import NewProjectsPage from './components/NewProjectsPage';
import AnalystPicksPage from './components/AnalystPicksPage';
import SocialTrendsPage from './components/SocialTrendsPage';
import SavedProjectsPage from './components/SavedProjectsPage';
import TokenAnalyzerPage from './components/TokenAnalyzerPage';
import SniperPage from './components/SniperPage';
import { Token } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ScanProvider } from './context/ScanContext';
import { AlertProvider } from './context/AlertContext';
import SentimentHeatmap from './components/SentimentHeatmap';

export type Page = 'gem-finder' | 'ai-sniper' | 'new-projects' | 'analyst-picks' | 'social-trends' | 'saved-projects' | 'token-analyzer' | 'heatmap';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('gem-finder');
  const [savedTokens, setSavedTokens] = useLocalStorage<Token[]>('savedTokens', []);

  const handleSaveToken = (tokenToSave: Token) => {
    setSavedTokens(prev => {
      if (prev.some(t => t.address === tokenToSave.address)) {
        return prev; // Already saved
      }
      // Store the current price as the entry price when saving
      return [...prev, { ...tokenToSave, entryPrice: tokenToSave.priceUsd }];
    });
  };

  const handleUnsaveToken = (tokenToUnsave: Token) => {
    setSavedTokens(prev => prev.filter(t => t.address !== tokenToUnsave.address));
  };

  const handleUpdateTokens = (updatedTokens: Token[]) => {
    setSavedTokens(prev => {
      return prev.map(existing => {
        const updated = updatedTokens.find(u => u.address === existing.address);
        if (updated) {
          // Preserve entryPrice, holdings, and avgBuyPrice from existing, update everything else
          return {
            ...updated,
            entryPrice: existing.entryPrice,
            holdings: existing.holdings,
            avgBuyPrice: existing.avgBuyPrice
          };
        }
        return existing;
      });
    });
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
          <main className="container mx-auto px-4 pt-24 pb-8 flex-grow">
            {activePage === 'gem-finder' && <GemFinderPage {...savedTokenProps} />}
            {activePage === 'ai-sniper' && <SniperPage {...savedTokenProps} />}
            {activePage === 'new-projects' && <NewProjectsPage {...savedTokenProps} />}
            {activePage === 'analyst-picks' && <AnalystPicksPage {...savedTokenProps} />}
            {activePage === 'social-trends' && <SocialTrendsPage {...savedTokenProps} />}
            {activePage === 'token-analyzer' && <TokenAnalyzerPage {...savedTokenProps} />}
            {activePage === 'saved-projects' && <SavedProjectsPage {...savedTokenProps} onUpdateTokens={handleUpdateTokens} />}
            {activePage === 'heatmap' && <SentimentHeatmap />}
          </main>
          <footer className="text-center py-8 border-t border-slate-800 mt-16 pb-24 md:pb-8">
            <p className="text-sm text-slate-500 mb-2">Disclaimer: This is not financial advice. Cryptocurrency investments are highly volatile. Do your own research.</p>
            <p className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-500 tracking-widest uppercase opacity-80">
              COOKED BY MARCMIKO
            </p>
          </footer>
        </div>
      </AlertProvider>
    </ScanProvider>
  );
};

export default App;
