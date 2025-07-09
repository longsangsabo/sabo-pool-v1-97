import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { RankingService } from '@/services/rankingService';
import { TournamentRepository } from '@/repositories/tournamentRepository';
import { TOURNAMENT_STATUS } from '@/constants/tournamentConstants';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

export interface TournamentServiceData {
  id: string;
  name: string;
  description: string;
  tournament_type: string;
  status: string;
  max_participants: number;
  current_participants: number;
  entry_fee: number;
  tournament_start: string;
  tournament_end: string;
  registration_start: string;
  registration_end: string;
}

export const useTournamentService = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Get tournaments with pagination and filters
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading,
    error: tournamentsError,
    refetch: refetchTournaments
  } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => TournamentRepository.getTournaments(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      return TournamentRepository.createTournament({
        ...tournamentData,
        created_by: user.id,
        status: TOURNAMENT_STATUS.UPCOMING,
        current_participants: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      toast.success('Giải đấu đã được tạo thành công!');
    },
    onError: (error) => {
      console.error('Create tournament error:', error);
      toast.error('Có lỗi xảy ra khi tạo giải đấu');
    }
  });

  // Register for tournament mutation
  const registerMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      return TournamentRepository.registerPlayer({
        tournament_id: tournamentId,
        player_id: user.id,
        registration_status: 'pending',
        payment_status: 'unpaid',
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations'] });
      toast.success('Đăng ký giải đấu thành công!');
    },
    onError: (error) => {
      console.error('Registration error:', error);
      toast.error('Có lỗi khi đăng ký giải đấu');
    }
  });

  // Cancel registration mutation
  const cancelRegistrationMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      if (!user?.id) throw new Error('Must be logged in');
      
      return TournamentRepository.cancelRegistration(tournamentId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['tournament-registrations'] });
      toast.success('Đã hủy đăng ký giải đấu');
    },
    onError: (error) => {
      console.error('Cancel registration error:', error);
      toast.error('Có lỗi khi hủy đăng ký');
    }
  });

  // Calculate tournament rewards
  const calculateTournamentRewards = useCallback((position: TournamentPosition, playerRank: RankCode) => {
    return RankingService.calculateTournamentRewards(position, playerRank);
  }, []);

  // Calculate all possible rewards for display
  const getAllTournamentRewards = useCallback((playerRank: RankCode) => {
    const positions = RankingService.getTournamentPositions();
    return positions.map(position => ({
      position,
      positionDisplay: RankingService.formatPosition(position),
      ...RankingService.calculateTournamentRewards(position, playerRank)
    }));
  }, []);

  // Generate tournament bracket
  const generateBracketMutation = useMutation({
    mutationFn: async ({ tournamentId, seedingMethod = 'elo_ranking' }: {
      tournamentId: string;
      seedingMethod?: string;
    }) => {
      return TournamentRepository.generateBracket(tournamentId, seedingMethod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournament-brackets'] });
      toast.success('Bracket đã được tạo thành công!');
    },
    onError: (error) => {
      console.error('Generate bracket error:', error);
      toast.error('Có lỗi khi tạo bracket');
    }
  });

  // Finalize tournament results
  const finalizeTournamentMutation = useMutation({
    mutationFn: async ({ 
      tournamentId, 
      results 
    }: {
      tournamentId: string;
      results: Array<{
        player_id: string;
        final_position: number;
        player_rank: RankCode;
        matches_played: number;
        matches_won: number;
        matches_lost: number;
      }>;
    }) => {
      // Calculate rewards for each player using RankingService
      const resultsWithRewards = results.map(result => {
        const position = RankingService.getTournamentPositions().find(pos => {
          const positionRank = result.final_position;
          if (pos === 'CHAMPION') return positionRank === 1;
          if (pos === 'RUNNER_UP') return positionRank === 2;
          if (pos === 'THIRD_PLACE') return positionRank === 3;
          if (pos === 'FOURTH_PLACE') return positionRank === 4;
          if (pos === 'TOP_8') return positionRank <= 8;
          if (pos === 'TOP_16') return positionRank <= 16;
          return true; // PARTICIPATION
        }) || 'PARTICIPATION';

        const rewards = RankingService.calculateTournamentRewards(position, result.player_rank);

        return {
          tournament_id: tournamentId,
          player_id: result.player_id,
          final_position: result.final_position,
          elo_earned: rewards.eloPoints,
          spa_earned: rewards.spaPoints,
          matches_played: result.matches_played,
          matches_won: result.matches_won,
          matches_lost: result.matches_lost
        };
      });

      return TournamentRepository.updateTournamentResults(tournamentId, resultsWithRewards);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });
      toast.success('Kết quả giải đấu đã được cập nhật!');
    },
    onError: (error) => {
      console.error('Finalize tournament error:', error);
      toast.error('Có lỗi khi cập nhật kết quả');
    }
  });

  // Check user registration status
  const checkUserRegistration = useCallback(async (tournamentId: string) => {
    if (!user?.id) return null;
    
    try {
      return await TournamentRepository.checkUserRegistration(tournamentId, user.id);
    } catch (error) {
      console.error('Check registration error:', error);
      return null;
    }
  }, [user?.id]);

  // Auto-update tournament statuses
  const autoUpdateTournamentStatus = useCallback(async () => {
    try {
      await TournamentRepository.autoUpdateTournamentStatus();
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    } catch (error) {
      console.error('Auto update status error:', error);
    }
  }, [queryClient]);

  return {
    // Data
    tournaments,
    loading: tournamentsLoading || loading,
    error: tournamentsError,

    // Actions
    createTournament: createTournamentMutation.mutateAsync,
    registerForTournament: registerMutation.mutateAsync,
    cancelRegistration: cancelRegistrationMutation.mutateAsync,
    generateBracket: generateBracketMutation.mutateAsync,
    finalizeTournament: finalizeTournamentMutation.mutateAsync,

    // Utilities
    calculateTournamentRewards,
    getAllTournamentRewards,
    checkUserRegistration,
    autoUpdateTournamentStatus,
    refetchTournaments,

    // Mutation states
    isCreating: createTournamentMutation.isPending,
    isRegistering: registerMutation.isPending,
    isCancelling: cancelRegistrationMutation.isPending,
    isGeneratingBracket: generateBracketMutation.isPending,
    isFinalizing: finalizeTournamentMutation.isPending
  };
};