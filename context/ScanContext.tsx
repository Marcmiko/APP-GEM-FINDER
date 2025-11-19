
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
    // We pass the setter instead of current state to avoid stale closures in async functions
    scanFn: (forceRefresh?: boolean) => Promise<{ tokens: Token[]; sources: GroundingChunk[] }>,
    forceRefresh: boolean = true
  ) => {
    
    // Immediately set loading state to true.
    // Using functional update to access the VERY latest state for history preservation
    setter(prev => {
        // If we have previous data, save it to history before wiping for new scan (optional, or keep displaying it?)
        // Let's keep displaying old data while loading (better UX), but mark loading=true
        let newHistory = prev.history;
        if (prev.tokens.length > 0 && prev.scanTime) {
             newHistory = [{ timestamp: prev.scanTime, tokens: prev.tokens, sources: prev.sources }, ...prev.history];
        }
        
        return {
            ...prev,
            isLoading: true,
            error: null,
            history: newHistory
            // We do NOT reset tokens here so the UI doesn't flash empty.
        };
    });

    try {
      // This await allows the code to run in the background even if the component that called it unmounts
      const { tokens, sources } = await scanFn(forceRefresh);
      
      setter(prev => ({
        ...prev,
        tokens,
        sources,
        scanTime: new Date(),
        isLoading: false,
        hasScanned: true
      }));

    } catch (err) {
      console.error("Scan failed:", err);
      setter(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Unknown error occurred during scan',
        isLoading: false,
      }));
    }
  };

  const scanGemFinder = useCallback((forceRefresh = true) => 
    performScan(setGemFinder, findGems.bind(null, undefined, undefined), forceRefresh), 
  []);

  const scanNewProjects = useCallback((forceRefresh = true) => 
    performScan(setNewProjects, findNewProjects, forceRefresh), 
  []);

  const scanAnalystPicks = useCallback((forceRefresh = true) => 
    performScan(setAnalystPicks, getAnalystPicks, forceRefresh), 
  []);

  const scanSocialTrends = useCallback((forceRefresh = true) => 
    performScan(setSocialTrends, findSocialTrends, forceRefresh), 
  []);

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
