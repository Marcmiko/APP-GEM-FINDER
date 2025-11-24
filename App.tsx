
import React, { useState } from 'react';
import Header from './components/Header';
import GemFinderPage from './components/GemFinderPage';
import NewProjectsPage from './components/NewProjectsPage';
import AnalystPicksPage from './components/AnalystPicksPage';
import SocialTrendsPage from './components/SocialTrendsPage';
import SavedProjectsPage from './components/SavedProjectsPage';
import TokenAnalyzerPage from './components/TokenAnalyzerPage';
import SniperPage from './components/SniperPage';

import Footer from './components/Footer';
import { Token, Page } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ScanProvider } from './context/ScanContext';
import { AlertProvider } from './context/AlertContext';

// Web3 Imports
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';

const queryClient = new QueryClient();

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

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <ScanProvider>
            <AlertProvider>
              <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500/30">
                <Header
                  activePage={activePage}
                  setActivePage={setActivePage}
                  savedCount={savedTokens.length}
                />
                <main className="pt-24 pb-8">
                  {activePage === 'gem-finder' && (
                    <GemFinderPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'ai-sniper' && (
                    <SniperPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'new-projects' && (
                    <NewProjectsPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'analyst-picks' && (
                    <AnalystPicksPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'social-trends' && (
                    <SocialTrendsPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'token-analyzer' && (
                    <TokenAnalyzerPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                    />
                  )}
                  {activePage === 'saved-projects' && (
                    <SavedProjectsPage
                      savedTokens={savedTokens}
                      onSave={handleSaveToken}
                      onUnsave={handleUnsaveToken}
                      onUpdateTokens={handleUpdateTokens}
                    />
                  )}

                </main>
                <Footer />
              </div>
            </AlertProvider>
          </ScanProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
