import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DailyLimitStats {
  date: string;
  challengeCount: number;
  matchCount: number;
  limitReached: boolean;
  timeUntilReset: string;
}

export const useDailyLimits = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch daily challenge stats
  const { data: dailyStats, isLoading } = useQuery({
    queryKey: ['daily-limits', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_challenge_stats')
        .select('*')
        .eq('player_id', user.id)
        .eq('challenge_date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Calculate time until midnight
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const timeUntilReset = midnight.getTime() - now.getTime();
      const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
      const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

      const challengeCount = data?.challenge_count || 0;
      const limitReached = challengeCount >= 2;

      return {
        date: today,
        challengeCount,
        matchCount: 0, // Will be enhanced later
        limitReached,
        timeUntilReset: `${hours}h ${minutes}m`
      } as DailyLimitStats;
    },
    enabled: !!user?.id,
    refetchInterval: 60000 // Refresh every minute
  });

  // Check if user can create challenges
  const canCreateChallenge = () => {
    if (!dailyStats) return true;
    return !dailyStats.limitReached;
  };

  // Get remaining challenges
  const getRemainingChallenges = () => {
    if (!dailyStats) return 2;
    return Math.max(0, 2 - dailyStats.challengeCount);
  };

  // Update daily stats when challenge is created
  const updateDailyStats = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('daily_challenge_stats')
        .upsert({
          player_id: user.id,
          challenge_date: today,
          challenge_count: 1
        }, {
          onConflict: 'player_id,challenge_date',
          ignoreDuplicates: false
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-limits'] });
      toast.success('Daily challenge stats updated');
    },
    onError: (error) => {
      console.error('Error updating daily stats:', error);
      toast.error('Failed to update daily stats');
    }
  });

  return {
    dailyStats,
    isLoading,
    canCreateChallenge,
    getRemainingChallenges,
    updateDailyStats: updateDailyStats.mutateAsync,
    isUpdating: updateDailyStats.isPending
  };
};