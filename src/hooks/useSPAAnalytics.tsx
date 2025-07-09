import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SPAAnalyticsData {
  totalSPA: number;
  weeklyChange: number;
  monthlyChange: number;
  rankingPosition: number;
  trendData: {
    date: string;
    spa_points: number;
    source: string;
  }[];
  sourceBreakdown: {
    source: string;
    points: number;
    percentage: number;
  }[];
}

interface SystemSPAStats {
  totalPlayersWithSPA: number;
  averageSPA: number;
  topSPAPlayer: {
    name: string;
    spa_points: number;
  };
  dailyDistribution: {
    date: string;
    new_points: number;
    players_active: number;
  }[];
}

export function useSPAAnalytics() {
  const { user } = useAuth();

  // Player SPA Analytics
  const { data: playerAnalytics, isLoading: isLoadingPlayer } = useQuery({
    queryKey: ['spa-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get current SPA points
      const { data: currentRanking } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .eq('player_id', user.id)
        .single();

      // Get SPA history for trends (mock data for now)
      const trendData = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        spa_points: Math.max(0, (currentRanking?.spa_points || 100) + Math.floor(Math.random() * 100 - 50)),
        source: ['challenge', 'tournament', 'milestone', 'bonus'][Math.floor(Math.random() * 4)]
      }));

      // Mock source breakdown
      const sourceBreakdown = [
        { source: 'Thách đấu', points: 450, percentage: 45 },
        { source: 'Giải đấu', points: 300, percentage: 30 },
        { source: 'Thành tựu', points: 150, percentage: 15 },
        { source: 'Thưởng khác', points: 100, percentage: 10 }
      ];

      const analytics: SPAAnalyticsData = {
        totalSPA: currentRanking?.spa_points || 0,
        weeklyChange: Math.floor(Math.random() * 100 - 50),
        monthlyChange: Math.floor(Math.random() * 200 - 100),
        rankingPosition: Math.floor(Math.random() * 100) + 1,
        trendData,
        sourceBreakdown
      };

      return analytics;
    },
    enabled: !!user?.id
  });

  // System-wide SPA Analytics (for admin)
  const { data: systemAnalytics, isLoading: isLoadingSystem } = useQuery({
    queryKey: ['system-spa-analytics'],
    queryFn: async () => {
      // Get system-wide stats
      const { data: playersWithSPA, count } = await supabase
        .from('player_rankings')
        .select('spa_points', { count: 'exact' })
        .gt('spa_points', 0);

      const averageSPA = playersWithSPA?.reduce((sum, p) => sum + (p.spa_points || 0), 0) / (count || 1) || 0;

      // Get top SPA player
      const { data: topPlayer } = await supabase
        .from('player_rankings')
        .select(`
          spa_points,
          profiles!inner(full_name)
        `)
        .order('spa_points', { ascending: false })
        .limit(1)
        .single();

      // Mock daily distribution
      const dailyDistribution = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new_points: Math.floor(Math.random() * 1000) + 500,
        players_active: Math.floor(Math.random() * 50) + 20
      }));

      const systemStats: SystemSPAStats = {
        totalPlayersWithSPA: count || 0,
        averageSPA,
        topSPAPlayer: {
          name: (topPlayer?.profiles as any)?.full_name || 'Unknown',
          spa_points: topPlayer?.spa_points || 0
        },
        dailyDistribution
      };

      return systemStats;
    }
  });

  return {
    playerAnalytics,
    systemAnalytics,
    isLoadingPlayer,
    isLoadingSystem
  };
}