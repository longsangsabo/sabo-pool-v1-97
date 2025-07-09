import { useState, useEffect, useCallback } from 'react';

interface ProgressiveLoadingOptions {
  initialDelay?: number;
  increment?: number;
  maxItems?: number;
}

export const useProgressiveLoading = <T extends any>(
  items: T[],
  options: ProgressiveLoadingOptions = {}
) => {
  const {
    initialDelay = 0,
    increment = 3,
    maxItems = items.length
  } = options;

  const [visibleCount, setVisibleCount] = useState(Math.min(increment, maxItems));
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (visibleCount >= maxItems || isLoading) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + increment, maxItems));
      setIsLoading(false);
    }, 100); // Small delay for smooth UX
  }, [visibleCount, maxItems, increment, isLoading]);

  const hasMore = visibleCount < maxItems;
  const visibleItems = items.slice(0, visibleCount);

  useEffect(() => {
    if (initialDelay > 0) {
      const timer = setTimeout(() => {
        setVisibleCount(Math.min(increment, maxItems));
      }, initialDelay);
      
      return () => clearTimeout(timer);
    }
  }, [initialDelay, increment, maxItems]);

  return {
    visibleItems,
    visibleCount,
    hasMore,
    isLoading,
    loadMore,
    totalItems: items.length
  };
};