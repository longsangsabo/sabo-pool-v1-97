import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { useQueryClient } from '@tanstack/react-query';

interface OptimizationConfig {
  debounceMs?: number;
  cacheSize?: number;
  enableMemoization?: boolean;
  enablePrefetch?: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  accessCount: number;
}

export const useTournamentOptimizations = (config: OptimizationConfig = {}) => {
  const { 
    debounceMs = 300, 
    cacheSize = 50, 
    enableMemoization = true,
    enablePrefetch = true
  } = config;

  const queryClient = useQueryClient();
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());
  const performanceMetrics = useRef({
    cacheHits: 0,
    cacheMisses: 0,
    averageCalculationTime: 0,
    totalCalculations: 0
  });

  // Enhanced cache management with LRU eviction
  const updateCache = useCallback((key: string, value: any) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      
      // Remove least recently used entries if cache is full
      if (newCache.size >= cacheSize) {
        let oldestKey = '';
        let oldestTime = Date.now();
        
        for (const [cacheKey, entry] of newCache.entries()) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            oldestKey = cacheKey;
          }
        }
        
        if (oldestKey) {
          newCache.delete(oldestKey);
        }
      }
      
      newCache.set(key, {
        data: value,
        timestamp: Date.now(),
        accessCount: 1
      });
      
      return newCache;
    });
  }, [cacheSize]);

  const getCachedValue = useCallback((key: string) => {
    const entry = cache.get(key);
    if (entry) {
      // Update access statistics
      entry.accessCount++;
      entry.timestamp = Date.now();
      performanceMetrics.current.cacheHits++;
      return entry.data;
    }
    performanceMetrics.current.cacheMisses++;
    return undefined;
  }, [cache]);

  // Debounced form validation with performance tracking
  const debouncedValidation = useCallback(
    debounce((validator: () => boolean, onComplete?: (result: boolean) => void) => {
      const start = performance.now();
      const result = validator();
      const end = performance.now();
      
      // Track validation performance
      const duration = end - start;
      performanceMetrics.current.totalCalculations++;
      performanceMetrics.current.averageCalculationTime = 
        (performanceMetrics.current.averageCalculationTime * (performanceMetrics.current.totalCalculations - 1) + duration) / 
        performanceMetrics.current.totalCalculations;
      
      onComplete?.(result);
      return result;
    }, debounceMs),
    [debounceMs]
  );

  // Enhanced auto-save with conflict resolution
  const debouncedAutoSave = useCallback(
    debounce((saveFunction: () => Promise<any>, onSuccess?: () => void, onError?: (error: any) => void) => {
      saveFunction()
        .then(result => {
          onSuccess?.();
          return result;
        })
        .catch(error => {
          console.error('Auto-save failed:', error);
          onError?.(error);
        });
    }, debounceMs * 2),
    [debounceMs]
  );

  // Smart memoization with performance monitoring
  const memoizeCalculation = useCallback((key: string, calculator: () => any) => {
    if (!enableMemoization) {
      return calculator();
    }

    const cached = getCachedValue(key);
    if (cached !== undefined) {
      return cached;
    }

    const start = performance.now();
    const result = calculator();
    const end = performance.now();
    
    // Only cache if calculation took significant time (> 5ms)
    if (end - start > 5) {
      updateCache(key, result);
    }
    
    return result;
  }, [enableMemoization, getCachedValue, updateCache]);

  // Performance monitoring with detailed metrics
  const measurePerformance = useCallback((label: string, fn: () => any) => {
    const start = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const result = fn();
    
    const end = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const duration = end - start;
    const memoryDelta = endMemory - startMemory;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance [${label}]:`, {
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        cacheHitRate: `${((performanceMetrics.current.cacheHits / 
          (performanceMetrics.current.cacheHits + performanceMetrics.current.cacheMisses)) * 100).toFixed(1)}%`
      });
    }
    
    return result;
  }, []);

  // Intelligent prefetching for tournament data
  const prefetchTournamentData = useCallback((tournamentId: string) => {
    if (!enablePrefetch) return;
    
    // Prefetch tournament details
    queryClient.prefetchQuery({
      queryKey: ['tournament', tournamentId],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
    
    // Prefetch related tournament registrations
    queryClient.prefetchQuery({
      queryKey: ['tournament', tournamentId, 'registrations'],
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  }, [enablePrefetch, queryClient]);

  // Batch operation optimization
  const batchOperations = useCallback(async <T,>(operations: (() => Promise<T>)[], batchSize = 3) => {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the server
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  }, []);

  // Smart cache cleanup
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    setCache(prevCache => {
      const newCache = new Map();
      
      for (const [key, entry] of prevCache.entries()) {
        if (now - entry.timestamp < maxAge) {
          newCache.set(key, entry);
        }
      }
      
      return newCache;
    });
  }, []);

  // Automatic cache cleanup
  useEffect(() => {
    const interval = setInterval(cleanupCache, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [cleanupCache]);

  // Get performance statistics
  const getPerformanceStats = useCallback(() => {
    const { cacheHits, cacheMisses, averageCalculationTime, totalCalculations } = performanceMetrics.current;
    const cacheHitRate = cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0;
    
    return {
      cacheHitRate: cacheHitRate.toFixed(1) + '%',
      cacheSize: cache.size,
      averageCalculationTime: averageCalculationTime.toFixed(2) + 'ms',
      totalCalculations,
      cacheEfficiency: cache.size > 0 ? 'Good' : 'Poor'
    };
  }, [cache.size]);

  return {
    // Core optimization functions
    debouncedValidation,
    debouncedAutoSave,
    getCachedValue,
    updateCache,
    memoizeCalculation,
    measurePerformance,
    
    // Advanced features
    prefetchTournamentData,
    batchOperations,
    cleanupCache,
    
    // Statistics and monitoring
    getPerformanceStats,
    cacheSize: cache.size,
    performanceMetrics: performanceMetrics.current
  };
};

export default useTournamentOptimizations;