import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RankingService } from '@/services/rankingService';
import type { RankCode, TournamentPosition } from '@/utils/eloConstants';

interface TournamentSPAParams {
  tournamentId: string;
  playerId: string;
  position: number;
  playerRank: RankCode;
  tournamentType?: string;
}

export function useTournamentSPA() {
  const queryClient = useQueryClient();

  const calculateTournamentSPAMutation = useMutation({
    mutationFn: async ({ position, playerRank, tournamentType = 'normal' }: {
      position: number;
      playerRank: RankCode;
      tournamentType?: string;
    }) => {
      // Use RankingService instead of database RPC
      const tournamentPosition = RankingService.getTournamentPositions().find(pos => {
        if (pos === 'CHAMPION') return position === 1;
        if (pos === 'RUNNER_UP') return position === 2;
        if (pos === 'THIRD_PLACE') return position === 3;
        if (pos === 'FOURTH_PLACE') return position === 4;
        if (pos === 'TOP_8') return position <= 8;
        if (pos === 'TOP_16') return position <= 16;
        return true; // PARTICIPATION
      }) || 'PARTICIPATION';

      let spaPoints = RankingService.calculateTournamentSpa(tournamentPosition, playerRank);
      
      // Apply tournament type multipliers
      if (tournamentType === 'season') {
        spaPoints = Math.floor(spaPoints * 1.5);
      } else if (tournamentType === 'open') {
        spaPoints = Math.floor(spaPoints * 2.0);
      }

      return spaPoints;
    }
  });

  const awardTournamentSPAMutation = useMutation({
    mutationFn: async ({
      tournamentId,
      playerId,
      position,
      playerRank,
      tournamentType = 'normal'
    }: TournamentSPAParams) => {
      // First calculate the SPA points
      const spaPoints = await calculateTournamentSPAMutation.mutateAsync({
        position,
        playerRank,
        tournamentType
      });

      // Award the SPA points
      const { error } = await supabase.rpc('credit_spa_points', {
        p_user_id: playerId,
        p_amount: spaPoints,
        p_category: 'tournament',
        p_description: `Giải đấu - Hạng ${position}`,
        p_reference_id: tournamentId
      });

      if (error) throw error;
      
      return { spaPoints, position, playerRank, tournamentType };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['spa-wallet-updates'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });

      // Show success message
      const multiplierText = result.tournamentType === 'season' ? ' (x1.5 Season)' : 
                             result.tournamentType === 'open' ? ' (x2.0 Open)' : '';
      
      toast.success(
        `🏆 +${result.spaPoints} SPA điểm!`,
        {
          description: `Giải đấu - Hạng ${result.position}${multiplierText}`
        }
      );
    },
    onError: (error) => {
      console.error('Error awarding tournament SPA:', error);
      toast.error('Lỗi khi tính điểm giải đấu');
    }
  });

  // Helper function to get all tournament rewards for a rank
  const getAllTournamentRewards = (playerRank: RankCode) => {
    const positions = RankingService.getTournamentPositions();
    return positions.map(position => ({
      position,
      positionDisplay: RankingService.formatPosition(position),
      eloPoints: RankingService.calculateTournamentElo(position),
      spaPoints: RankingService.calculateTournamentSpa(position, playerRank)
    }));
  };

  return {
    calculateTournamentSPA: (params: Omit<TournamentSPAParams, 'playerId' | 'tournamentId'>) =>
      calculateTournamentSPAMutation.mutateAsync(params),
    
    awardTournamentSPA: (params: TournamentSPAParams) =>
      awardTournamentSPAMutation.mutateAsync(params),
    
    loading: calculateTournamentSPAMutation.isPending || awardTournamentSPAMutation.isPending,
    
    // Additional utility methods using RankingService
    previewRewards: getAllTournamentRewards,
    
    getRankingService: () => RankingService
  };
}

export default useTournamentSPA;