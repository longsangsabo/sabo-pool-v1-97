import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdvancedSPAPoints } from '@/hooks/useAdvancedSPAPoints';

interface TournamentResult {
  tournamentId: string;
  playerId: string;
  position: 'champion' | 'runner_up' | 'top_3' | 'top_4' | 'top_8' | 'participation';
  playerRank: string;
  tournamentType?: 'normal' | 'season' | 'open';
}

interface SPACalculationResult {
  playerId: string;
  spaPoints: number;
  position: string;
  playerRank: string;
  breakdown: {
    basePoints: number;
    multiplier: number;
    finalPoints: number;
  };
}

export function useTournamentSPAManager() {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  const { calculateTournamentPoints } = useAdvancedSPAPoints();

  const awardTournamentSPAMutation = useMutation({
    mutationFn: async (results: TournamentResult[]) => {
      const spaResults: SPACalculationResult[] = [];
      
      for (const result of results) {
        // Calculate SPA points using the database rules
        const basePoints = calculateTournamentPoints(result.position, result.playerRank);
        
        // Apply tournament type multiplier
        let multiplier = 1.0;
        if (result.tournamentType === 'season') multiplier = 1.5;
        if (result.tournamentType === 'open') multiplier = 2.0;
        
        const finalPoints = Math.floor(basePoints * multiplier);
        
        // Award the SPA points
        const { error } = await supabase.rpc('credit_spa_points', {
          p_user_id: result.playerId,
          p_amount: finalPoints,
          p_category: 'tournament',
          p_description: `Giải đấu - ${result.position} (${result.tournamentType || 'normal'})`,
          p_reference_id: result.tournamentId
        });

        if (error) throw error;

        // Check and award milestones
        await supabase.rpc('check_and_award_milestones', {
          p_player_id: result.playerId
        });

        spaResults.push({
          playerId: result.playerId,
          spaPoints: finalPoints,
          position: result.position,
          playerRank: result.playerRank,
          breakdown: {
            basePoints,
            multiplier,
            finalPoints
          }
        });
      }

      return spaResults;
    },
    onSuccess: (results) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboards'] });
      
      // Show success notifications
      results.forEach(result => {
        const multiplierText = result.breakdown.multiplier !== 1.0 
          ? ` (x${result.breakdown.multiplier})` 
          : '';
        
        toast.success(
          `🏆 +${result.spaPoints} SPA điểm!`,
          {
            description: `Giải đấu - ${result.position}${multiplierText}`,
            duration: 5000
          }
        );
      });
    },
    onError: (error) => {
      console.error('Error awarding tournament SPA:', error);
      toast.error('Lỗi khi trao điểm SPA giải đấu');
    }
  });

  const calculateBulkSPA = async (results: TournamentResult[]): Promise<SPACalculationResult[]> => {
    const calculations: SPACalculationResult[] = [];
    
    for (const result of results) {
      const basePoints = calculateTournamentPoints(result.position, result.playerRank);
      let multiplier = 1.0;
      
      if (result.tournamentType === 'season') multiplier = 1.5;
      if (result.tournamentType === 'open') multiplier = 2.0;
      
      const finalPoints = Math.floor(basePoints * multiplier);
      
      calculations.push({
        playerId: result.playerId,
        spaPoints: finalPoints,
        position: result.position,
        playerRank: result.playerRank,
        breakdown: {
          basePoints,
          multiplier,
          finalPoints
        }
      });
    }
    
    return calculations;
  };

  const awardSinglePlayerSPA = async (result: TournamentResult) => {
    setIsProcessing(true);
    try {
      await awardTournamentSPAMutation.mutateAsync([result]);
    } finally {
      setIsProcessing(false);
    }
  };

  const awardBulkSPA = async (results: TournamentResult[]) => {
    setIsProcessing(true);
    try {
      await awardTournamentSPAMutation.mutateAsync(results);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    awardSinglePlayerSPA,
    awardBulkSPA,
    calculateBulkSPA,
    isProcessing,
    isAwarding: awardTournamentSPAMutation.isPending
  };
}