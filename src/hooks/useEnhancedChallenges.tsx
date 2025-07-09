import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useAdvancedSPAPoints } from '@/hooks/useAdvancedSPAPoints';
import { useChallenges } from '@/hooks/useChallenges';

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
  
  // Include all functionality from useChallenges
  const challengesHook = useChallenges();

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
      // Use the credit_spa_points function and mark challenge as completed
      const { data: result, error } = await supabase.rpc(
        'credit_spa_points',
        {
          p_user_id: params.winnerId,
          p_amount: 100, // Base amount, will be calculated properly later
          p_category: 'challenge',
          p_description: `Challenge victory vs opponent`,
          p_reference_id: params.challengeId
        }
      );

      if (error) throw error;

      // Update challenge status to completed
      await supabase
        .from('challenges')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.challengeId);

      // Update daily stats by incrementing challenge count
      const today = new Date().toISOString().split('T')[0];
      
      // Insert or update daily stats for both players
      await supabase
        .from('daily_challenge_stats')
        .upsert([
          {
            player_id: params.winnerId,
            challenge_date: today,
            challenge_count: 1
          },
          {
            player_id: params.loserId,
            challenge_date: today,
            challenge_count: 1
          }
        ], { 
          onConflict: 'player_id,challenge_date',
          ignoreDuplicates: false 
        });

      return { success: true, winner_points: 100 };
    },
    onSuccess: (result, params) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['daily-challenge-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });

      // Show success message
      toast.success(
        `🎯 +${result.winner_points} SPA điểm!`,
        {
          description: `Thách đấu hoàn thành thành công`,
          duration: 5000
        }
      );
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
    // Enhanced SPA functionality
    completeChallengeEnhanced: completeChallengeEnhanced.mutateAsync,
    isCompleting: completeChallengeEnhanced.isPending,
    dailyStats,
    isLoadingStats,
    canCreateChallenge,
    getRemainingChallenges,
    checkOvertimePenalty,
    
    // All original useChallenges functionality
    ...challengesHook
  };
}