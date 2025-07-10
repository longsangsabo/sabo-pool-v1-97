import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round_number: number;
  match_number: number;
  player1_id?: string;
  player2_id?: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  referee_id?: string;
  notes?: string;
  player1?: {
    user_id: string;
    full_name: string;
    display_name: string;
  };
  player2?: {
    user_id: string;
    full_name: string;
    display_name: string;
  };
}

export interface MatchResult {
  id: string;
  tournament_id: string;
  player1_id: string;
  player2_id: string;
  winner_id?: string;
  player1_score: number;
  player2_score: number;
  result_status: 'pending' | 'confirmed' | 'verified' | 'disputed';
  created_by?: string;
  created_at: string;
}

export const useMatchManagement = (tournamentId: string) => {
  const queryClient = useQueryClient();

  // Get tournament matches
  const {
    data: matches = [],
    isLoading: matchesLoading,
    error: matchesError,
    refetch: refetchMatches
  } = useQuery({
    queryKey: ['tournament-matches', tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
          *,
          player1:profiles!tournament_matches_player1_id_fkey(
            user_id, full_name, display_name
          ),
          player2:profiles!tournament_matches_player2_id_fkey(
            user_id, full_name, display_name
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;
      return (data || []).map((match: any) => ({
        id: match.id,
        tournament_id: match.tournament_id,
        round_number: match.round_number,
        match_number: match.match_number,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        winner_id: match.winner_id,
        player1_score: match.player1_score || 0,
        player2_score: match.player2_score || 0,
        status: match.status,
        scheduled_time: match.scheduled_time,
        started_at: match.started_at,
        completed_at: match.completed_at,
        referee_id: match.referee_id,
        notes: match.notes,
        player1: match.player1,
        player2: match.player2
      })) as TournamentMatch[];
    },
    enabled: !!tournamentId,
  });

  // Update match score
  const updateScoreMutation = useMutation({
    mutationFn: async ({
      matchId,
      player1Score,
      player2Score,
      winnerId,
      status
    }: {
      matchId: string;
      player1Score: number;
      player2Score: number;
      winnerId?: string;
      status?: string;
    }) => {
      console.log('Updating score for match:', matchId, { player1Score, player2Score, winnerId });
      
      const { data: match, error: matchError } = await supabase
        .from('tournament_matches')
        .update({
          player1_score: player1Score,
          player2_score: player2Score,
          winner_id: winnerId,
          status: status || (winnerId ? 'completed' : 'in_progress'),
          completed_at: winnerId ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (matchError) {
        console.error('Match update error:', matchError);
        throw matchError;
      }

      // Create match result record only if both players exist
      if (winnerId && match && match.player1_id && match.player2_id) {
        const currentUser = await supabase.auth.getUser();
        console.log('Creating match result for winner:', winnerId);
        
        // Verify players exist in profiles table before creating match result
        const { data: playersExist, error: playerCheckError } = await supabase
          .from('profiles')
          .select('user_id')
          .in('user_id', [match.player1_id, match.player2_id]);
        
        if (playerCheckError) {
          console.error('Player verification error:', playerCheckError);
          throw new Error('Không thể xác minh thông tin người chơi');
        }
        
        if (!playersExist || playersExist.length !== 2) {
          throw new Error('Một hoặc cả hai người chơi không tồn tại trong hệ thống');
        }
        
        const { error: resultError } = await supabase
          .from('match_results')
          .upsert({
            tournament_id: match.tournament_id,
            player1_id: match.player1_id,
            player2_id: match.player2_id,
            winner_id: winnerId,
            player1_score: player1Score,
            player2_score: player2Score,
            result_status: 'verified',
            verification_method: 'manual',
            created_by: currentUser.data.user?.id,
            verified_at: new Date().toISOString(),
            verified_by: currentUser.data.user?.id
          });

        if (resultError) {
          console.error('Match result error:', resultError);
          throw resultError;
        }

        // Auto-advance winner to next round via trigger (automatically handled by database)
        console.log('Winner will be auto-advanced via database trigger');
        
        // Show advancement message after a brief delay
        setTimeout(() => {
          toast.success(`🏆 Người thắng đã tiến vào vòng tiếp theo!`);
        }, 1500);
      } else if (winnerId && match && (!match.player1_id || !match.player2_id)) {
        console.log('Match has BYE player, advancing winner directly');
        // For BYE matches, just advance the winner without creating match result
        setTimeout(() => {
          toast.success(`🏆 Người thắng đã tiến vào vòng tiếp theo!`);
        }, 1500);
      }

      console.log('Score updated successfully');
      return match;
    },
    onSuccess: (data) => {
      console.log('Score update success:', data);
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] });
      toast.success('Tỉ số đã được cập nhật thành công!');
    },
    onError: (error: any) => {
      console.error('Update score error:', error);
      const errorMessage = error?.message || 'Có lỗi không xác định khi cập nhật tỉ số';
      toast.error(`Lỗi: ${errorMessage}`);
    },
    retry: 1,
    retryDelay: 1000
  });

  // Restore match (undo cancel)
  const restoreMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      console.log('Restoring match:', matchId);
      
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Restore match error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] });
      toast.success('Trận đấu đã được khôi phục!');
    },
    onError: (error: any) => {
      console.error('Restore match error:', error);
      const errorMessage = error?.message || 'Có lỗi khi khôi phục trận đấu';
      toast.error(`Lỗi: ${errorMessage}`);
    }
  });

  // Start match
  const startMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] });
      toast.success('Trận đấu đã bắt đầu!');
    },
    onError: (error) => {
      console.error('Start match error:', error);
      toast.error('Có lỗi khi bắt đầu trận đấu');
    }
  });

  // Cancel match
  const cancelMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          status: 'cancelled'
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-matches', tournamentId] });
      toast.success('Trận đấu đã bị hủy!');
    },
    onError: (error) => {
      console.error('Cancel match error:', error);
      toast.error('Có lỗi khi hủy trận đấu');
    }
  });

  return {
    // Data
    matches,
    loading: matchesLoading,
    error: matchesError,

    // Actions
    updateScore: updateScoreMutation.mutateAsync,
    startMatch: startMatchMutation.mutateAsync,
    cancelMatch: cancelMatchMutation.mutateAsync,
    restoreMatch: restoreMatchMutation.mutateAsync,
    refetchMatches,

    // Loading states
    isUpdatingScore: updateScoreMutation.isPending,
    isStartingMatch: startMatchMutation.isPending,
    isCancellingMatch: cancelMatchMutation.isPending,
    isRestoringMatch: restoreMatchMutation.isPending
  };
};