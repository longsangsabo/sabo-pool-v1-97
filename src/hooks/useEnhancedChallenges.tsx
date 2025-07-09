import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAdvancedSPAPoints } from '@/hooks/useAdvancedSPAPoints';

interface ChallengeCompletion {
  challengeId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  notes?: string;
}

interface DailyChallengeStats {
  date: string;
  count: number;
  limitReached: boolean;
}

export function useEnhancedChallenges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { completeChallengeWithLimits } = useAdvancedSPAPoints();

  // Fetch daily challenge stats
  const { data: dailyStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['daily-challenge-stats', user?.id],
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

      return data ? {
        date: data.challenge_date,
        count: data.challenge_count,
        limitReached: data.challenge_count >= 2
      } : {
        date: today,
        count: 0,
        limitReached: false
      };
    },
    enabled: !!user?.id
  });

  // Complete challenge with enhanced SPA system
  const completeChallengeEnhanced = useMutation({
    mutationFn: async (params: ChallengeCompletion) => {
      // Get challenge details first
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', params.challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Use the database function for enhanced completion
      const { data: result, error } = await supabase.rpc(
        'complete_challenge_match_with_bonuses',
        {
          p_challenge_id: params.challengeId,
          p_winner_id: params.winnerId,
          p_loser_id: params.loserId,
          p_winner_score: params.winnerScore,
          p_loser_score: params.loserScore,
          p_match_notes: params.notes || null
        }
      );

      if (error) throw error;

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      
      await supabase.rpc('upsert_daily_challenge_stats', {
        p_player_id: params.winnerId,
        p_challenge_date: today
      });

      await supabase.rpc('upsert_daily_challenge_stats', {
        p_player_id: params.loserId,
        p_challenge_date: today
      });

      return result;
    },
    onSuccess: (result, params) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });

      // Show detailed success message
      if (result?.bonuses) {
        const { base_points, streak_bonus, comeback_bonus, time_multiplier } = result.bonuses;
        
        let bonusText = '';
        if (streak_bonus > 0) bonusText += ` Streak: +${streak_bonus}`;
        if (comeback_bonus > 0) bonusText += ` Comeback: +${comeback_bonus}`;
        if (time_multiplier !== 1.0) bonusText += ` Time: x${time_multiplier}`;

        toast.success(
          `🎯 +${result.winner_points} SPA điểm!`,
          {
            description: `Base: ${base_points}${bonusText}`,
            duration: 5000
          }
        );
      }
    },
    onError: (error) => {
      console.error('Error completing challenge:', error);
      toast.error('Lỗi khi hoàn thành thách đấu');
    }
  });

  // Check if user can create challenges today
  const canCreateChallenge = () => {
    if (!dailyStats) return true;
    return !dailyStats.limitReached;
  };

  // Get remaining challenges for today
  const getRemainingChallenges = () => {
    if (!dailyStats) return 2;
    return Math.max(0, 2 - dailyStats.count);
  };

  // Check if overtime penalty applies
  const checkOvertimePenalty = (challengeId: string) => {
    // This would check if the challenge has exceeded normal time limits
    // Implementation depends on your challenge timing system
    return false;
  };

  return {
    completeChallengeEnhanced: completeChallengeEnhanced.mutateAsync,
    isCompleting: completeChallengeEnhanced.isPending,
    dailyStats,
    isLoadingStats,
    canCreateChallenge,
    getRemainingChallenges,
    checkOvertimePenalty
  };
}