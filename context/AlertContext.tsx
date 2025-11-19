import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Token } from '../types';

interface AlertContextType {
    watchedTokens: string[];
    toggleAlert: (tokenAddress: string) => void;
    isAlertActive: (tokenAddress: string) => boolean;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [watchedTokens, setWatchedTokens] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('watchedTokens');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    useEffect(() => {
        localStorage.setItem('watchedTokens', JSON.stringify(watchedTokens));
    }, [watchedTokens]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Mock Monitoring Loop (In a real app, this would fetch new data)
    useEffect(() => {
        const interval = setInterval(() => {
            if (watchedTokens.length === 0) return;

            // Here we would fetch the latest price for watchedTokens
            // For this demo, we'll just log that we are "monitoring"
            console.log(`Monitoring ${watchedTokens.length} tokens for alerts...`);

            // Example: Randomly trigger an alert for testing (1% chance per minute)
            /*
            if (Math.random() < 0.01) {
               new Notification("Gem Alert! 🚨", {
                   body: "One of your watched tokens is moving fast!",
                   icon: "/gem-logo.png"
               });
            }
            */
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [watchedTokens]);

    const toggleAlert = (tokenAddress: string) => {
        setWatchedTokens(prev => {
            if (prev.includes(tokenAddress)) {
                return prev.filter(t => t !== tokenAddress);
            } else {
                // Request permission if not granted yet
                if ('Notification' in window && Notification.permission !== 'granted') {
                    Notification.requestPermission();
                }
                return [...prev, tokenAddress];
            }
        });
    };

    const isAlertActive = (tokenAddress: string) => watchedTokens.includes(tokenAddress);

    return (
        <AlertContext.Provider value={{ watchedTokens, toggleAlert, isAlertActive }}>
            {children}
        </AlertContext.Provider>
    );
};

export const useAlerts = () => {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlerts must be used within an AlertProvider');
    }
    return context;
};
