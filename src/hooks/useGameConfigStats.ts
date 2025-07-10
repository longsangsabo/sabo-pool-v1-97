import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GameConfigStats {
  eloRules: number;
  ranks: number;
  spaRewards: number;
  tournamentRewards: number;
  activePlayers: number;
  totalMatches: number;
  tournamentResults: number;
  averageElo: number;
  recentChanges: any[];
}

interface Inconsistency {
  table: string;
  type: 'missing' | 'mismatch' | 'extra';
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const useGameConfigStats = () => {
  const [stats, setStats] = useState<GameConfigStats | null>(null);
  const [inconsistencies, setInconsistencies] = useState<Inconsistency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch configuration counts
      const [
        { count: eloRulesCount },
        { count: ranksCount },
        { count: spaRewardsCount },
        { count: tournamentRewardsCount }
      ] = await Promise.all([
        supabase.from('elo_calculation_rules').select('*', { count: 'exact', head: true }),
        supabase.from('rank_definitions').select('*', { count: 'exact', head: true }),
        supabase.from('spa_reward_milestones').select('*', { count: 'exact', head: true }),
        supabase.from('tournament_reward_structures').select('*', { count: 'exact', head: true })
      ]);

      // Fetch system metrics
      const { data: playerStats } = await supabase
        .from('profiles')
        .select('elo')
        .eq('role', 'player')
        .not('elo', 'is', null);

      const { count: matchesCount } = await supabase
        .from('match_results')
        .select('*', { count: 'exact', head: true });

      const { count: tournamentResultsCount } = await supabase
        .from('match_results')
        .select('*', { count: 'exact', head: true })
        .not('tournament_id', 'is', null);

      // Fetch recent changes
      const { data: recentChanges } = await supabase
        .from('game_config_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate average ELO
      const averageElo = playerStats && playerStats.length > 0
        ? Math.round(playerStats.reduce((sum, p) => sum + (p.elo || 1000), 0) / playerStats.length)
        : 1000;

      setStats({
        eloRules: eloRulesCount || 0,
        ranks: ranksCount || 0,
        spaRewards: spaRewardsCount || 0,
        tournamentRewards: tournamentRewardsCount || 0,
        activePlayers: playerStats?.length || 0,
        totalMatches: matchesCount || 0,
        tournamentResults: tournamentResultsCount || 0,
        averageElo,
        recentChanges: recentChanges || []
      });

      // Check for inconsistencies (simplified version)
      const issues: Inconsistency[] = [];

      // Example: Check if we have expected number of ranks
      if ((ranksCount || 0) !== 12) {
        issues.push({
          table: 'rank_definitions',
          type: 'missing',
          description: `Expected 12 ranks, found ${ranksCount || 0}`,
          severity: 'high'
        });
      }

      // Example: Check if we have K-factor rules
      if ((eloRulesCount || 0) < 4) {
        issues.push({
          table: 'elo_calculation_rules',
          type: 'missing',
          description: 'Missing K-factor rules for different player levels',
          severity: 'medium'
        });
      }

      setInconsistencies(issues);

    } catch (error) {
      console.error('Error fetching game config stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    inconsistencies,
    loading,
    refetch: fetchStats
  };
};