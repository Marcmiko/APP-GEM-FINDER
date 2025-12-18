
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Token, GroundingChunk, ScanResult } from '../types';
import { findGems, getAnalystPicks, findSocialTrends, analyzeSpecificToken } from '../services/geminiService';

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
  analystPicks: PageState;
  socialTrends: PageState;
  tokenAnalyzer: PageState;
  scanGemFinder: (forceRefresh?: boolean) => Promise<void>;
  scanAnalystPicks: (forceRefresh?: boolean) => Promise<void>;
  scanSocialTrends: (forceRefresh?: boolean) => Promise<void>;
  analyzeToken: (query: string) => Promise<void>;
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
  const [analystPicks, setAnalystPicks] = useState<PageState>(initialPageState);
  const [socialTrends, setSocialTrends] = useState<PageState>(initialPageState);
  const [tokenAnalyzer, setTokenAnalyzer] = useState<PageState>(initialPageState);

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

    setter(prev => {
      let newHistory = prev.history;
      if (prev.tokens.length > 0 && prev.scanTime) {
        newHistory = [{ timestamp: prev.scanTime, tokens: prev.tokens, sources: prev.sources }, ...prev.history];
      }

      return {
        ...prev,
        isLoading: true,
        error: null,
        history: newHistory
      };
    });

    try {
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



  const scanAnalystPicks = useCallback((forceRefresh = true) =>
    performScan(setAnalystPicks, getAnalystPicks, forceRefresh),
    []);

  const scanSocialTrends = useCallback((forceRefresh = true) =>
    performScan(setSocialTrends, findSocialTrends, forceRefresh),
    []);

  const analyzeToken = useCallback(async (query: string) => {
    setTokenAnalyzer(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      // Do not clear previous result while loading
    }));

    try {
      const { tokens, sources } = await analyzeSpecificToken(query);
      setTokenAnalyzer(prev => ({
        ...prev,
        tokens,
        sources,
        scanTime: new Date(),
        isLoading: false,
        hasScanned: true,
        history: prev.tokens.length > 0 && prev.scanTime
          ? [{ timestamp: prev.scanTime, tokens: prev.tokens, sources: prev.sources }, ...prev.history]
          : prev.history
      }));
    } catch (err) {
      console.error("Analysis failed:", err);
      setTokenAnalyzer(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Analysis failed',
      }));
    }
  }, []);

  return (
    <ScanContext.Provider
      value={{
        gemFinder,
        analystPicks,
        socialTrends,
        tokenAnalyzer,
        scanGemFinder,
        scanAnalystPicks,
        scanSocialTrends,
        analyzeToken
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
