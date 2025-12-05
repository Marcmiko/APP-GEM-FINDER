import { useState, useEffect } from 'react';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

interface PriceCacheOptions {
    ttl?: number; // Time to live in milliseconds (default: 30000ms = 30s)
    storageKey?: string;
}

/**
 * Hook for caching prices with TTL
 */
export function usePriceCache<T = Record<string, number>>(
    options: PriceCacheOptions = {}
) {
    const { ttl = 30000, storageKey = 'price_cache' } = options;

    const [cache, setCache] = useState<CacheEntry<T> | null>(() => {
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as CacheEntry<T>;
                // Check if cache is still valid
                if (Date.now() - parsed.timestamp < ttl) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load price cache:', e);
        }
        return null;
    });

    const setData = (data: T) => {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        setCache(entry);

        try {
            localStorage.setItem(storageKey, JSON.stringify(entry));
        } catch (e) {
            console.warn('Failed to save price cache:', e);
        }
    };

    const getData = (): T | null => {
        if (!cache) return null;

        const age = Date.now() - cache.timestamp;
        if (age > ttl) {
            // Cache expired
            clearData();
            return null;
        }

        return cache.data;
    };

    const clearData = () => {
        setCache(null);
        try {
            localStorage.removeItem(storageKey);
        } catch (e) {
            console.warn('Failed to clear price cache:', e);
        }
    };

    const getAge = (): number | null => {
        if (!cache) return null;
        return Date.now() - cache.timestamp;
    };

    const isExpired = (): boolean => {
        if (!cache) return true;
        return Date.now() - cache.timestamp > ttl;
    };

    return {
        data: cache?.data || null,
        setData,
        getData,
        clearData,
        getAge,
        isExpired,
        timestamp: cache?.timestamp || null,
    };
}
