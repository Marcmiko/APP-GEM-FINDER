
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Token, GroundingChunk, ScanResult } from '../types';
import { findGems, findNewProjects, getAnalystPicks, findSocialTrends } from '../services/geminiService';

interface PageState {
  tokens: Token[];
  sources: GroundingChunk[];
  isLoading: boolean;
  error: string | null;
  hasScanned: boolean;
  scanTime: Date | null;
  history: ScanResult[];
}

interface ScanContextType {
  gemFinder: PageState;
  newProjects: PageState;
  analystPicks: PageState;
  socialTrends: PageState;
  scanGemFinder: (forceRefresh?: boolean) => Promise<void>;
  scanNewProjects: (forceRefresh?: boolean) => Promise<void>;
  scanAnalystPicks: (forceRefresh?: boolean) => Promise<void>;
  scanSocialTrends: (forceRefresh?: boolean) => Promise<void>;
}

const initialPageState: PageState = {
  tokens: [],
  sources: [],
  isLoading: false,
  error: null,
  hasScanned: false,
  scanTime: null,
  history: [],
};

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export const ScanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gemFinder, setGemFinder] = useState<PageState>(initialPageState);
  const [newProjects, setNewProjects] = useState<PageState>(initialPageState);
  const [analystPicks, setAnalystPicks] = useState<PageState>(initialPageState);
  const [socialTrends, setSocialTrends] = useState<PageState>(initialPageState);

  // Helper to update state generically
  const updateState = (
    setter: React.Dispatch<React.SetStateAction<PageState>>,
    updates: Partial<PageState>
  ) => {
    setter((prev) => ({ ...prev, ...updates }));
  };

  const performScan = async (
    setter: React.Dispatch<React.SetStateAction<PageState>>,
    currentState: PageState,
    scanFn: (forceRefresh?: boolean) => Promise<{ tokens: Token[]; sources: GroundingChunk[] }>,
    forceRefresh: boolean = true
  ) => {
    // If we have data and we are just "revisiting" the tab without forcing, don't re-scan
    // But the user explicitly asked for concurrent background scanning, so usually we trigger this via button
    
    if (currentState.tokens.length > 0 && currentState.scanTime) {
        updateState(setter, {
            history: [{ timestamp: currentState.scanTime, tokens: currentState.tokens, sources: currentState.sources }, ...currentState.history]
        });
    }

    updateState(setter, { isLoading: true, error: null, hasScanned: true });

    try {
      const { tokens, sources } = await scanFn(forceRefresh);
      updateState(setter, {
        tokens,
        sources,
        scanTime: new Date(),
        isLoading: false,
      });
    } catch (err) {
      updateState(setter, {
        error: err instanceof Error ? err.message : 'Unknown error',
        isLoading: false,
      });
    }
  };

  const scanGemFinder = useCallback((forceRefresh = true) => 
    performScan(setGemFinder, gemFinder, () => findGems(undefined, undefined, forceRefresh), forceRefresh), 
  [gemFinder]);

  const scanNewProjects = useCallback((forceRefresh = true) => 
    performScan(setNewProjects, newProjects, findNewProjects, forceRefresh), 
  [newProjects]);

  const scanAnalystPicks = useCallback((forceRefresh = true) => 
    performScan(setAnalystPicks, analystPicks, getAnalystPicks, forceRefresh), 
  [analystPicks]);

  const scanSocialTrends = useCallback((forceRefresh = true) => 
    performScan(setSocialTrends, socialTrends, findSocialTrends, forceRefresh), 
  [socialTrends]);

  return (
    <ScanContext.Provider
      value={{
        gemFinder,
        newProjects,
        analystPicks,
        socialTrends,
        scanGemFinder,
        scanNewProjects,
        scanAnalystPicks,
        scanSocialTrends,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
};

export const useScanContext = () => {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScanContext must be used within a ScanProvider');
  }
  return context;
};
