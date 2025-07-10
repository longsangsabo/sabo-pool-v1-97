
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useOptimizedLeaderboardQuery, useOptimizedStatsQuery } from './useDatabaseOptimization';

export interface LeaderboardEntry {
  id: string;
  username: string;
  full_name: string;
  current_rank: string;
  ranking_points: number;
  total_matches: number;
  avatar_url: string;
  elo: number;
  wins: number;
  losses: number;
  matches_played: number;
  win_rate: number;
  rank: number;
  last_played: string;
  streak: number;
  country: string;
  city: string;
  location?: string;
  bio: string;
  user_id: string;
}

export interface LeaderboardFilters {
  sortBy: 'elo' | 'wins' | 'win_rate' | 'matches_played';
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
  country?: string;
  city?: string;
  rankRange?: [number, number];
  eloRange?: [number, number];
  winRateRange?: [number, number];
  searchTerm?: string;
}

export interface LeaderboardStats {
  totalPlayers: number;
  averageElo: number;
  highestElo: number;
  lowestElo: number;
  activePlayers: number;
}

const defaultFilters: LeaderboardFilters = {
  sortBy: 'elo',
  sortOrder: 'desc',
  page: 1,
  pageSize: 20,
};

const initialStats: LeaderboardStats = {
  totalPlayers: 0,
  averageElo: 1500,
  highestElo: 2800,
  lowestElo: 800,
  activePlayers: 0,
};

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<LeaderboardFilters>(defaultFilters);
  const [stats, setStats] = useState<LeaderboardStats>(initialStats);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLeaderboard = async (
    currentFilters: LeaderboardFilters = filters
  ) => {
    setLoading(true);
    setError('');

    try {
      // Build query for leaderboard data using player_rankings
      let query = supabase
        .from('player_rankings')
        .select(`
          *,
          profiles!player_rankings_player_id_fkey(
            user_id,
            full_name,
            display_name,
            avatar_url,
            city,
            district,
            verified_rank,
            bio
          )
        `);

      // Apply filters
      if (currentFilters.city) {
        query = query.eq('profiles.city', currentFilters.city);
      }
      
      if (currentFilters.searchTerm) {
        query = query.or(`profiles.full_name.ilike.%${currentFilters.searchTerm}%,profiles.display_name.ilike.%${currentFilters.searchTerm}%`);
      }

      // Apply sorting
      const sortColumn = currentFilters.sortBy === 'elo' ? 'elo_points' : 
                        currentFilters.sortBy === 'wins' ? 'wins' :
                        currentFilters.sortBy === 'win_rate' ? 'win_rate' : 'total_matches';
      
      query = query.order(sortColumn, { ascending: currentFilters.sortOrder === 'asc' });

      // Apply pagination
      const from = (currentFilters.page - 1) * currentFilters.pageSize;
      const to = from + currentFilters.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match LeaderboardEntry interface
      const transformedData: LeaderboardEntry[] = (data || []).map((item: any, index: number) => ({
        id: item.id,
        username: item.profiles?.display_name || item.profiles?.full_name || 'Unknown',
        full_name: item.profiles?.full_name || '',
        current_rank: item.profiles?.verified_rank || 'Unranked',
        ranking_points: item.elo_points || 0,
        total_matches: item.total_matches || 0,
        avatar_url: item.profiles?.avatar_url || '',
        elo: item.elo_points || 1000,
        wins: item.wins || 0,
        losses: (item.total_matches || 0) - (item.wins || 0),
        matches_played: item.total_matches || 0,
        win_rate: item.total_matches > 0 ? (item.wins / item.total_matches) * 100 : 0,
        rank: from + index + 1,
        last_played: item.updated_at || new Date().toISOString(),
        streak: item.win_streak || 0,
        country: 'Vietnam',
        city: item.profiles?.city || '',
        location: `${item.profiles?.city || ''}, ${item.profiles?.district || ''}`.trim().replace(/^,|,$/, ''),
        bio: item.profiles?.bio || '',
        user_id: item.player_id,
      }));

      setLeaderboard(transformedData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      setLeaderboard([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboardStats = async () => {
    try {
      // Get current month/year
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Get total players from profiles
      const { count: totalPlayers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get stats from player_rankings
      const { data: rankingsData } = await supabase
        .from('player_rankings')
        .select('elo_points');

      const eloPoints = rankingsData?.map(item => item.elo_points || 0) || [];
      
      const calculatedStats: LeaderboardStats = {
        totalPlayers: totalPlayers || 0,
        averageElo: eloPoints.length > 0 
          ? eloPoints.reduce((sum, points) => sum + points, 0) / eloPoints.length 
          : 1500,
        highestElo: eloPoints.length > 0 ? Math.max(...eloPoints) : 2500,
        lowestElo: eloPoints.length > 0 ? Math.min(...eloPoints) : 800,
        activePlayers: rankingsData?.length || 0,
      };
      
      setStats(calculatedStats);
    } catch (err) {
      console.error('Leaderboard stats error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard stats');
      setStats(initialStats);
    }
  };

  useEffect(() => {
    fetchLeaderboard(filters);
    fetchLeaderboardStats();
  }, [filters]);

  const updateFilters = (newFilters: Partial<LeaderboardFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const sortBy = (sortBy: LeaderboardFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const search = (searchTerm: string) => {
    setFilters((prev) => ({ ...prev, searchTerm, page: 1 }));
  };

  return {
    leaderboard,
    loading,
    error,
    filters,
    stats,
    totalCount,
    updateFilters,
    goToPage,
    sortBy,
    search,
  };
};

// Fix the useQuery usage at line 381
export const useLeaderboardQuery = () => {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('elo', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};
