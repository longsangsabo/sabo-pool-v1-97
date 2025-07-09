import { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

interface OptimizationConfig {
  debounceMs?: number;
  cacheSize?: number;
  enableMemoization?: boolean;
}

export const useTournamentOptimizations = (config: OptimizationConfig = {}) => {
  const { 
    debounceMs = 300, 
    cacheSize = 50, 
    enableMemoization = true 
  } = config;

  const [cache, setCache] = useState<Map<string, any>>(new Map());

  // Debounced form validation
  const debouncedValidation = useCallback(
    debounce((validator: () => boolean) => {
      return validator();
    }, debounceMs),
    [debounceMs]
  );

  // Debounced auto-save
  const debouncedAutoSave = useCallback(
    debounce((saveFunction: () => void) => {
      saveFunction();
    }, debounceMs * 2), // Auto-save less frequently
    [debounceMs]
  );

  // Cache management
  const getCachedValue = useCallback((key: string) => {
    return cache.get(key);
  }, [cache]);

  const setCachedValue = useCallback((key: string, value: any) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      
      // Remove oldest entries if cache is full
      if (newCache.size >= cacheSize) {
        const firstKey = newCache.keys().next().value;
        newCache.delete(firstKey);
      }
      
      newCache.set(key, value);
      return newCache;
    });
  }, [cacheSize]);

  // Memoized calculations
  const memoizeCalculation = useCallback((key: string, calculator: () => any) => {
    if (!enableMemoization) {
      return calculator();
    }

    const cached = getCachedValue(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = calculator();
    setCachedValue(key, result);
    return result;
  }, [enableMemoization, getCachedValue, setCachedValue]);

  // Performance monitoring
  const measurePerformance = useCallback((label: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${label} took ${end - start} milliseconds`);
    }
    
    return result;
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  return {
    debouncedValidation,
    debouncedAutoSave,
    getCachedValue,
    setCachedValue,
    memoizeCalculation,
    measurePerformance,
    clearCache,
    cacheSize: cache.size
  };
};

export default useTournamentOptimizations;