import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

// Connection quality monitoring
export const useConnectionQuality = () => {
  const checkNetworkSpeed = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      // Test with a small query to Supabase
      await supabase.from('tournaments').select('id').limit(1);
      
      const latency = Date.now() - startTime;
      
      // Categorize connection quality
      let quality: 'excellent' | 'good' | 'fair' | 'poor';
      if (latency < 100) quality = 'excellent';
      else if (latency < 300) quality = 'good';
      else if (latency < 800) quality = 'fair';
      else quality = 'poor';

      return { latency, quality };
    } catch (error) {
      return { latency: Infinity, quality: 'poor' as const };
    }
  }, []);

  return useQuery({
    queryKey: ['network-quality'],
    queryFn: checkNetworkSpeed,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Check every minute
    refetchIntervalInBackground: false,
  });
};

// Optimized profile fetching with batching
export const useOptimizedProfiles = (userIds: string[]) => {
  return useQuery({
    queryKey: ['profiles', 'batch', userIds.sort()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, full_name, skill_level')
        .in('user_id', userIds);

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    enabled: userIds.length > 0,
  });
};

// Smart cache warming based on user behavior
export const useCacheWarming = () => {
  const queryClient = useQueryClient();

  const warmCache = useMemo(() => ({
    // Warm tournament data based on user's recent activity
    tournaments: async () => {
      try {
        // Active tournaments
        await queryClient.prefetchQuery({
          queryKey: ['tournaments', 'list', 'registration_open'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('tournaments')
              .select('*')
              .eq('status', 'registration_open')
              .limit(10);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 5,
        });

        // Upcoming tournaments
        await queryClient.prefetchQuery({
          queryKey: ['tournaments', 'list', 'upcoming'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('tournaments')
              .select('*')
              .eq('status', 'upcoming')
              .limit(10);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 5,
        });
      } catch (error) {
        console.error('Failed to warm tournament cache:', error);
      }
    },

    // Warm player rankings
    rankings: async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['player-rankings', 'top'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('player_rankings')
              .select(`
                player_id,
                elo_points,
                spa_points,
                profiles(display_name, full_name)
              `)
              .order('elo_points', { ascending: false })
              .limit(50);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 15, // 15 minutes
        });
      } catch (error) {
        console.error('Failed to warm rankings cache:', error);
      }
    },

    // Warm user's recent activity
    userActivity: async (userId: string) => {
      try {
        // Recent matches
        await queryClient.prefetchQuery({
          queryKey: ['matches', 'recent', userId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('matches')
              .select('*')
              .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
              .order('created_at', { ascending: false })
              .limit(10);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 3, // 3 minutes
        });

        // Recent challenges
        await queryClient.prefetchQuery({
          queryKey: ['challenges', 'recent', userId],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('challenges')
              .select('*')
              .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
              .order('created_at', { ascending: false })
              .limit(10);
            if (error) throw error;
            return data;
          },
          staleTime: 1000 * 60 * 3, // 3 minutes
        });
      } catch (error) {
        console.error('Failed to warm user activity cache:', error);
      }
    },
  }), [queryClient]);

  return warmCache;
};

// Network-aware data fetching
export const useNetworkAwareQuery = <TData,>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options: {
    highQualityOptions?: any;
    lowQualityOptions?: any;
  } = {}
) => {
  const { data: networkQuality } = useConnectionQuality();

  const isLowQuality = networkQuality?.quality === 'poor' || networkQuality?.quality === 'fair';

  return useQuery({
    queryKey,
    queryFn,
    // Adjust options based on network quality
    staleTime: isLowQuality ? 1000 * 60 * 10 : 1000 * 60 * 5,
    gcTime: isLowQuality ? 1000 * 60 * 60 : 1000 * 60 * 30,
    refetchOnWindowFocus: !isLowQuality,
    refetchOnReconnect: true,
    retry: isLowQuality ? 1 : 3,
    retryDelay: isLowQuality ? 2000 : 1000,
    ...options.highQualityOptions,
    ...(isLowQuality ? options.lowQualityOptions : {}),
  });
};

// Performance monitoring
export const usePerformanceMonitoring = () => {
  const measureQueryPerformance = useCallback((queryKey: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log performance metrics
    console.log(`Query ${queryKey} took ${duration.toFixed(2)}ms`);

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'query_performance', {
        query_key: queryKey,
        duration_ms: Math.round(duration),
        category: duration > 1000 ? 'slow' : duration > 500 ? 'medium' : 'fast'
      });
    }

    return duration;
  }, []);

  const measureComponentRender = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (duration > 16) { // Longer than one frame at 60fps
      console.warn(`Component ${componentName} rendered slowly: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }, []);

  return { measureQueryPerformance, measureComponentRender };
};

// Optimistic updates utility
export const useOptimisticMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  optimisticUpdate: (variables: TVariables) => void,
  rollbackUpdate: (variables: TVariables) => void,
  onSuccessUpdate?: (data: TData, variables: TVariables) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries();

      // Apply optimistic update
      optimisticUpdate(variables);

      // Return context for potential rollback
      return { variables };
    },
    onError: (error, variables) => {
      // Rollback the optimistic update
      rollbackUpdate(variables);
      console.error('Optimistic mutation failed:', error);
    },
    onSuccess: (data, variables) => {
      // Apply final update if needed
      onSuccessUpdate?.(data, variables);
    },
  });
};