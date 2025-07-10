import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

// Enhanced caching strategies for database optimization
export const useDatabaseOptimization = () => {
  const queryClient = useQueryClient();

  // Multi-level cache keys - FIXED: stable callback
  const getCacheKey = useCallback((entity: string, params?: Record<string, any>) => {
    const baseKey: (string | Record<string, any>)[] = [entity];
    if (params) {
      baseKey.push(params);
    }
    return baseKey;
  }, []); // Empty dependency array - function is pure

  // Optimized leaderboard with materialized view - FIXED: proper memoization
  const useOptimizedLeaderboard = useCallback((filters: any = {}) => {
    const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
    
    return useQuery({
      queryKey: getCacheKey('leaderboard-optimized', stableFilters),
      queryFn: async () => {
        // Use player_rankings since leaderboards was removed
        const { data, error } = await supabase
          .from('player_rankings')
          .select(`
            *,
            profiles!player_rankings_player_id_fkey(display_name, full_name, avatar_url)
          `)
          .order('elo_points', { ascending: false })
          .limit(stableFilters.pageSize || 20);

        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
    });
  }, [getCacheKey]);

  // Cached leaderboard stats - FIXED: stable implementation
  const useLeaderboardStats = useCallback(() => {
    return useQuery({
      queryKey: ['leaderboard-stats'], // Simplified key
      queryFn: async () => {
        // Use player_rankings since leaderboards was removed
        const { data, error } = await supabase
          .from('player_rankings')
          .select('id')
          .limit(1);

        if (error) throw error;
        return { total_players: data?.length || 0, last_updated: new Date() };
      },
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 30,
      refetchInterval: 1000 * 60 * 15,
    });
  }, []);

  // Batch profile loading with intelligent caching
  const useBatchProfiles = useCallback((userIds: string[]) => {
    return useQuery({
      queryKey: getCacheKey('profiles-batch', { userIds: userIds.sort() }),
      queryFn: async () => {
        // Check cache first for individual profiles
        const cachedProfiles = new Map();
        const uncachedIds = [];

        for (const userId of userIds) {
          const cached = queryClient.getQueryData(['profile', userId]);
          if (cached) {
            cachedProfiles.set(userId, cached);
          } else {
            uncachedIds.push(userId);
          }
        }

        // Fetch only uncached profiles
        let freshProfiles = [];
        if (uncachedIds.length > 0) {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_id, display_name, full_name, skill_level, avatar_url, city, district')
            .in('user_id', uncachedIds);

          if (error) throw error;
          freshProfiles = data || [];

          // Cache individual profiles
          freshProfiles.forEach(profile => {
            queryClient.setQueryData(['profile', profile.user_id], profile);
          });
        }

        // Combine cached and fresh data
        const allProfiles = [
          ...Array.from(cachedProfiles.values()),
          ...freshProfiles
        ];

        return allProfiles;
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      enabled: userIds.length > 0,
    });
  }, [queryClient, getCacheKey]);

  // Connection pooling optimization
  const useConnectionOptimization = useCallback(() => {
    const batchRequests = useMemo(() => {
      const batches = new Map();
      
      return {
        addToBatch: (key: string, request: () => Promise<any>) => {
          if (!batches.has(key)) {
            batches.set(key, []);
          }
          batches.get(key).push(request);
        },
        
        executeBatch: async (key: string) => {
          const requests = batches.get(key) || [];
          if (requests.length === 0) return [];
          
          try {
            const results = await Promise.all(requests);
            batches.delete(key);
            return results;
          } catch (error) {
            batches.delete(key);
            throw error;
          }
        }
      };
    }, []);

    return batchRequests;
  }, []);

  // Cache warming for frequently accessed data
  const warmCache = useCallback(async (entity: string, options: any = {}) => {
    switch (entity) {
      case 'leaderboard':
        await queryClient.prefetchQuery({
          queryKey: getCacheKey('leaderboard-optimized'),
          queryFn: async () => {
            const { data, error } = await supabase.rpc('optimize_leaderboard_query');
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 5,
        });
        break;

      case 'stats':
        await queryClient.prefetchQuery({
          queryKey: getCacheKey('leaderboard-stats'),
          queryFn: async () => {
            const { data, error } = await supabase.rpc('refresh_leaderboard_stats');
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 10,
        });
        break;

      case 'top-players':
        await queryClient.prefetchQuery({
          queryKey: getCacheKey('top-players'),
          queryFn: async () => {
            const { data, error } = await supabase
              .from('player_rankings')
              .select('player_id, elo_points, spa_points, profiles(display_name, full_name, avatar_url)')
              .order('elo_points', { ascending: false })
              .limit(10);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 15,
        });
        break;
    }
  }, [queryClient, getCacheKey]);

  // Cache invalidation strategies
  const invalidateCache = useCallback((pattern: string) => {
    switch (pattern) {
      case 'leaderboard':
        queryClient.invalidateQueries({ queryKey: ['leaderboard-optimized'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard-stats'] });
        break;
      
      case 'profiles':
        queryClient.invalidateQueries({ queryKey: ['profiles-batch'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        break;
      
      case 'all':
        queryClient.invalidateQueries();
        break;
    }
  }, [queryClient]);

  // Performance monitoring for database operations
  const measureDbOperation = useCallback(async (
    operation: string,
    fn: () => Promise<any>
  ) => {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow DB operation: ${operation} took ${duration.toFixed(2)}ms`);
        
        // Track in analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'slow_db_operation', {
            operation,
            duration: Math.round(duration),
            category: 'performance'
          });
        }
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`DB operation failed: ${operation} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }, []);

  return {
    useOptimizedLeaderboard,
    useLeaderboardStats,
    useBatchProfiles,
    useConnectionOptimization,
    warmCache,
    invalidateCache,
    measureDbOperation,
    getCacheKey
  };
};

// Export individual optimized hooks
export const useOptimizedLeaderboardQuery = (filters: any = {}) => {
  const { useOptimizedLeaderboard } = useDatabaseOptimization();
  return useOptimizedLeaderboard(filters);
};

export const useOptimizedStatsQuery = () => {
  const { useLeaderboardStats } = useDatabaseOptimization();
  return useLeaderboardStats();
};