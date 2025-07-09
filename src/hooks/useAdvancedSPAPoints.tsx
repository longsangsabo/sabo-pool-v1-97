import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SPABonusBreakdown {
  basePoints: number;
  streakBonus: number;
  comebackBonus: number;
  timeMultiplier: number;
  totalPoints: number;
}

export interface SPARule {
  id: string;
  rule_type: string;
  rule_key: string;
  rule_value: any;
  is_active: boolean;
}

export interface Milestone {
  id: string;
  milestone_type: string;
  description: string;
  threshold: number;
  reward_spa: number;
}

export interface PlayerMilestone {
  milestone_id: string;
  achieved_at: string;
}

export interface ChallengeCompletionResult {
  winner_spa: number;
  loser_spa: number;
  daily_count: number;
  reduction_applied: boolean;
}

export const useAdvancedSPAPoints = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<SPARule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSPARules = async () => {
    try {
      // For now, just set loading to false since the table was just created
      // In future versions this will properly fetch from spa_points_rules table
      setRules([]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching SPA rules:', error);
      setRules([]);
      setLoading(false);
    }
  };

  const getRuleValue = (ruleType: string, ruleKey: string) => {
    const rule = rules.find(r => r.rule_type === ruleType && r.rule_key === ruleKey);
    return rule?.rule_value || {};
  };

  const calculateTournamentPoints = (position: string, rank: string) => {
    // Use hardcoded values from the migration for now
    const tournamentPoints: { [key: string]: { [key: string]: number } } = {
      champion: { rank_e: 1500, rank_f: 1350, rank_g: 1200, rank_h: 1100, rank_i: 1000, rank_k: 900 },
      runner_up: { rank_e: 1100, rank_f: 1000, rank_g: 900, rank_h: 850, rank_i: 800, rank_k: 700 },
      top_3: { rank_e: 900, rank_f: 800, rank_g: 700, rank_h: 650, rank_i: 600, rank_k: 500 },
      top_4: { rank_e: 650, rank_f: 550, rank_g: 500, rank_h: 450, rank_i: 400, rank_k: 350 },
      top_8: { rank_e: 320, rank_f: 280, rank_g: 250, rank_h: 200, rank_i: 150, rank_k: 120 },
      participation: { rank_e: 120, rank_f: 110, rank_g: 100, rank_h: 100, rank_i: 100, rank_k: 100 }
    };
    
    const rankKey = `rank_${rank.toLowerCase()}`;
    return tournamentPoints[position]?.[rankKey] || 0;
  };

  // Mock milestones data based on SPA rules
  const milestones: Milestone[] = [
    {
      id: '1',
      milestone_type: 'total_matches',
      description: '10 trận đấu đầu tiên',
      threshold: 10,
      reward_spa: 100
    },
    {
      id: '2',
      milestone_type: 'total_matches',
      description: '50 trận đấu',
      threshold: 50,
      reward_spa: 200
    },
    {
      id: '3',
      milestone_type: 'total_matches',
      description: '100 trận đấu',
      threshold: 100,
      reward_spa: 500
    },
    {
      id: '4',
      milestone_type: 'win_rate_50',
      description: 'Tỷ lệ thắng 50% (tối thiểu 20 trận)',
      threshold: 20,
      reward_spa: 150
    },
    {
      id: '5',
      milestone_type: 'tournament_wins',
      description: 'Giải đấu đầu tiên',
      threshold: 1,
      reward_spa: 200
    }
  ];

  // Mock player milestones - in real implementation this would come from database
  const playerMilestones: PlayerMilestone[] = [];

  const completeChallenge = async (params: any) => {
    try {
      // This will use the database function once types are updated
      const { data, error } = await supabase.rpc('complete_challenge_match_with_bonuses' as any, {
        p_challenge_id: params.challengeId,
        p_winner_id: params.winnerId,
        p_loser_id: params.loserId,
        p_winner_score: params.winnerScore || 5,
        p_loser_score: params.loserScore || 0,
        p_match_notes: params.notes || null
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error completing challenge:', error);
      throw error;
    }
  };

  const completeChallengeWithLimits = async (params: {
    matchId: string;
    winnerId: string;
    loserId: string;
    wagerAmount: number;
    raceTo: number;
  }): Promise<ChallengeCompletionResult> => {
    // Mock implementation for now - in real app this would use the database functions
    const baseWinnerSPA = params.wagerAmount;
    const baseLoserSPA = Math.floor(params.wagerAmount * 0.5);
    
    // Mock daily count logic
    const dailyCount = Math.floor(Math.random() * 3) + 1; // 1-3
    const reduction_applied = dailyCount > 2;
    
    const winner_spa = reduction_applied ? Math.floor(baseWinnerSPA * 0.3) : baseWinnerSPA;
    const loser_spa = reduction_applied ? Math.floor(baseLoserSPA * 0.3) : baseLoserSPA;

    return {
      winner_spa,
      loser_spa,
      daily_count: dailyCount,
      reduction_applied
    };
  };

  useEffect(() => {
    fetchSPARules();
  }, []);

  return {
    rules,
    loading,
    milestones,
    playerMilestones,
    getRuleValue,
    calculateTournamentPoints,
    completeChallenge,
    completeChallengeWithLimits,
    refetchRules: fetchSPARules
  };
};