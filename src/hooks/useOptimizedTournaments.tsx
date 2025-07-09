import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Enhanced React Query configuration for tournaments
const TOURNAMENT_QUERY_KEYS = {
  all: ['tournaments'] as const,
  lists: () => [...TOURNAMENT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: TournamentFilters) => [...TOURNAMENT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TOURNAMENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TOURNAMENT_QUERY_KEYS.details(), id] as const,
  registrations: (id: string) => [...TOURNAMENT_QUERY_KEYS.detail(id), 'registrations'] as const,
  stats: () => [...TOURNAMENT_QUERY_KEYS.all, 'stats'] as const,
};

interface TournamentFilters {
  status?: string;
  search?: string;
  city?: string;
  sortBy?: 'date' | 'participants' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedTournaments {
  tournaments: any[];
  totalCount: number;
  hasNextPage: boolean;
  nextCursor?: number;
}

// Optimized tournament list with pagination
export const useOptimizedTournaments = (filters: TournamentFilters = {}) => {
  return useInfiniteQuery({
    queryKey: TOURNAMENT_QUERY_KEYS.list(filters),
    queryFn: async ({ pageParam = 0 }: { pageParam: number }) => {
      const PAGE_SIZE = 20;
      const offset = pageParam * PAGE_SIZE;

      // Use the optimized database function if available
      let query = supabase
        .from('tournaments')
        .select(`
          *,
          current_participants,
          tournament_registrations(count)
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply sorting
      const sortColumn = filters.sortBy === 'participants' ? 'current_participants' : 
                        filters.sortBy === 'status' ? 'status' : 'tournament_start';
      const ascending = filters.sortOrder === 'asc';
      
      query = query.order(sortColumn, { ascending });

      // Add pagination
      query = query.range(offset, offset + PAGE_SIZE - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        tournaments: data || [],
        totalCount: count || 0,
        hasNextPage: (data?.length || 0) === PAGE_SIZE,
        nextCursor: pageParam + 1
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaginatedTournaments) => 
      lastPage.hasNextPage ? lastPage.nextCursor : undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });
};

// Optimized single tournament query
export const useOptimizedTournament = (id: string) => {
  return useQuery({
    queryKey: TOURNAMENT_QUERY_KEYS.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournaments')
        .select(`
          *,
          tournament_registrations(
            id,
            player_id,
            registration_status,
            registration_date,
            profiles(
              display_name,
              full_name,
              skill_level
            )
          ),
          tournament_brackets(
            bracket_data,
            total_rounds,
            total_players
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    enabled: !!id,
  });
};

// Prefetch related tournament data
export const useTournamentPrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchTournament = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: TOURNAMENT_QUERY_KEYS.detail(id),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 5,
    });
  };

  const prefetchTournamentList = (filters: TournamentFilters = {}) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: TOURNAMENT_QUERY_KEYS.list(filters),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('tournaments')
          .select('*')
          .order('tournament_start', { ascending: true })
          .limit(20);
        
        if (error) throw error;
        return {
          tournaments: data || [],
          totalCount: data?.length || 0,
          hasNextPage: false,
          nextCursor: undefined
        };
      },
      initialPageParam: 0,
      staleTime: 1000 * 60 * 5,
    });
  };

  return { prefetchTournament, prefetchTournamentList };
};

// Optimized tournament registration mutation
export const useOptimizedTournamentRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tournamentId, action }: { tournamentId: string; action: 'register' | 'unregister' }) => {
      if (action === 'register') {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .insert({
            tournament_id: tournamentId,
            registration_status: 'confirmed'
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('tournament_registrations')
          .delete()
          .eq('tournament_id', tournamentId);

        if (error) throw error;
        return null;
      }
    },
    onSuccess: (data, variables) => {
      // Update tournament list cache
      queryClient.invalidateQueries({ queryKey: TOURNAMENT_QUERY_KEYS.lists() });
      
      // Update specific tournament cache
      queryClient.invalidateQueries({ 
        queryKey: TOURNAMENT_QUERY_KEYS.detail(variables.tournamentId) 
      });

      // Show success message
      toast.success(
        variables.action === 'register' 
          ? 'Đăng ký giải đấu thành công!' 
          : 'Hủy đăng ký thành công!'
      );
    },
    onError: (error) => {
      console.error('Tournament registration error:', error);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    },
  });
};

// Background sync for critical data
export const useTournamentBackgroundSync = () => {
  const queryClient = useQueryClient();

  const syncTournamentData = useMemo(() => {
    const sync = async () => {
      try {
        // Sync active tournaments
        await queryClient.refetchQueries({
          queryKey: TOURNAMENT_QUERY_KEYS.list({ status: 'registration_open' }),
          type: 'active'
        });

        // Sync ongoing tournaments
        await queryClient.refetchQueries({
          queryKey: TOURNAMENT_QUERY_KEYS.list({ status: 'ongoing' }),
          type: 'active'
        });
      } catch (error) {
        console.error('Background sync error:', error);
      }
    };

    // Setup interval for background sync
    const interval = setInterval(sync, 1000 * 60 * 2); // Every 2 minutes
    return () => clearInterval(interval);
  }, [queryClient]);

  return syncTournamentData;
};

// Performance tracking hook
export const useTournamentPerformanceTracking = () => {
  const trackQuery = (queryType: string, startTime: number) => {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log slow queries (>1 second)
    if (executionTime > 1000) {
      console.warn(`Slow tournament query detected: ${queryType} took ${executionTime}ms`);
    }

    // You could send this to analytics or performance monitoring
    // sendPerformanceMetric('tournament_query', { queryType, executionTime });
  };

  return { trackQuery };
};