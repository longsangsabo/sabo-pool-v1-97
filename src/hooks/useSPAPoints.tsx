import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SPAPointsCalculation {
  basePoints: number;
  skillBonus: number;
  winStreakBonus: number;
  firstWinBonus: number;
  rankBonus: number;
  totalPoints: number;
  description: string;
}

interface ChallengeResult {
  challengeId: string;
  winnerId: string;
  loserId: string;
  winnerScore: number;
  loserScore: number;
  gameType?: string;
  notes?: string;
}

export const useSPAPoints = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Calculate SPA points with all bonuses
  const calculateSPAPoints = async (result: ChallengeResult): Promise<SPAPointsCalculation> => {
    // Get winner's profile and ranking
    const { data: winnerProfile } = await supabase
      .from('profiles')
      .select(`
        skill_level,
        verified_rank,
        player_rankings (
          elo_points,
          wins,
          total_matches
        )
      `)
      .eq('user_id', result.winnerId)
      .single();

    // Base points calculation
    let basePoints = 50; // Default base points
    
    // Game type bonus
    if (result.gameType === 'ranked') {
      basePoints = 100;
    } else if (result.gameType === 'tournament') {
      basePoints = 150;
    }

    // Skill level bonus
    let skillBonus = 0;
    const skillLevel = winnerProfile?.skill_level;
    if (skillLevel === 'expert') {
      skillBonus = 30;
    } else if (skillLevel === 'advanced') {
      skillBonus = 20;
    } else if (skillLevel === 'intermediate') {
      skillBonus = 10;
    }

    // Win streak bonus (simplified without win_streak field)
    let winStreakBonus = 0;
    const wins = winnerProfile?.player_rankings?.wins || 0;
    const totalMatches = winnerProfile?.player_rankings?.total_matches || 0;
    const winRate = totalMatches > 0 ? wins / totalMatches : 0;
    
    if (winRate >= 0.8 && wins >= 5) {
      winStreakBonus = 50;
    } else if (winRate >= 0.7 && wins >= 3) {
      winStreakBonus = 30;
    } else if (winRate >= 0.6 && wins >= 2) {
      winStreakBonus = 15;
    }

    // First win of the day bonus
    let firstWinBonus = 0;
    const today = new Date().toISOString().split('T')[0];
    const { data: todayWins } = await supabase
      .from('challenges')
      .select('id')
      .eq('challenger_id', result.winnerId)
      .eq('status', 'completed')
      .gte('created_at', today + 'T00:00:00Z')
      .lt('created_at', today + 'T23:59:59Z');

    if (!todayWins || todayWins.length === 0) {
      firstWinBonus = 25;
    }

    // Rank verification bonus
    let rankBonus = 0;
    if (winnerProfile?.verified_rank) {
      rankBonus = 20;
    }

    const totalPoints = basePoints + skillBonus + winStreakBonus + firstWinBonus + rankBonus;

    return {
      basePoints,
      skillBonus,
      winStreakBonus,
      firstWinBonus,
      rankBonus,
      totalPoints,
      description: `Base: ${basePoints} + Skill: ${skillBonus} + Streak: ${winStreakBonus} + First Win: ${firstWinBonus} + Rank: ${rankBonus} = ${totalPoints} SPA points`
    };
  };

  // Credit SPA points mutation
  const creditSPAPoints = useMutation({
    mutationFn: async (result: ChallengeResult) => {
      const calculation = await calculateSPAPoints(result);
      
      // Update wallet balance with SPA points
      const { error } = await supabase.rpc('update_wallet_balance', {
        p_user_id: result.winnerId,
        p_amount: calculation.totalPoints,
        p_transaction_type: 'spa_points'
      });

      if (error) throw error;

      return { ...calculation, result: 'success' };
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });

      toast.success(
        `🎯 +${data.totalPoints} SPA điểm!`,
        {
          description: data.description,
          duration: 5000
        }
      );
    },
    onError: (error) => {
      console.error('Error crediting SPA points:', error);
      toast.error('Lỗi khi tính điểm SPA');
    }
  });

  return {
    calculateSPAPoints,
    creditSPAPoints: creditSPAPoints.mutateAsync,
    isCrediting: creditSPAPoints.isPending
  };
};