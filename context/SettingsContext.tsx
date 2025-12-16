
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AppConfig } from '../config/config';

interface Settings {
  brandName: string;
}

interface SettingsContextType {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<Settings>(() => {
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        return JSON.parse(storedSettings);
      }
    } catch (error) {
      console.error('Error reading settings from localStorage', error);
    }
    return { brandName: AppConfig.brandName };
  });

  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings to localStorage', error);
    }
  }, [settings]);

  const setSettings = (newSettings: Partial<Settings>) => {
    setSettingsState(prevSettings => ({...prevSettings, ...newSettings}));
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
