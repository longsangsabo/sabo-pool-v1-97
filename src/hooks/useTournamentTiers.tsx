import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TournamentTier {
  id: string;
  tier_name: string;
  tier_level: number;
  points_multiplier: number;
  qualification_required: boolean;
  min_participants: number;
  description: string;
}

export interface EloRule {
  id: string;
  rule_type: string;
  condition_key: string;
  points_base: number;
  points_multiplier: number;
  tier_level?: number;
  description: string;
  is_active: boolean;
}

export const useTournamentTiers = () => {
  const { data: tiers, isLoading: tiersLoading, error: tiersError } = useQuery({
    queryKey: ['tournament-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_tiers')
        .select('*')
        .order('tier_level', { ascending: true });
      
      if (error) throw error;
      return data as TournamentTier[];
    },
  });

  const { data: eloRules, isLoading: rulesLoading, error: rulesError } = useQuery({
    queryKey: ['elo-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elo_rules')
        .select('*')
        .eq('is_active', true)
        .order('rule_type', { ascending: true });
      
      if (error) throw error;
      return data as EloRule[];
    },
  });

  // Calculate SPA points for different positions and tiers
  const calculateSPAPoints = (tierLevel: number, position: string) => {
    if (!eloRules) return 0;
    
    const tier = tiers?.find(t => t.tier_level === tierLevel);
    const rule = eloRules.find(r => 
      r.rule_type === 'tournament_position' && 
      r.condition_key === position
    );
    
    if (!rule || !tier) return 0;
    
    return Math.round(rule.points_base * tier.points_multiplier);
  };

  // Get tournament tier info by level
  const getTierByLevel = (level: number) => {
    return tiers?.find(t => t.tier_level === level);
  };

  // Get all SPA points for a tier
  const getTierSPABreakdown = (tierLevel: number) => {
    if (!eloRules || !tiers) return null;
    
    const tier = getTierByLevel(tierLevel);
    if (!tier) return null;

    const positionRules = eloRules.filter(r => r.rule_type === 'tournament_position');
    
    return {
      tier,
      breakdown: positionRules.map(rule => ({
        position: rule.condition_key,
        description: rule.description,
        points: Math.round(rule.points_base * tier.points_multiplier),
        basePoints: rule.points_base,
      })).sort((a, b) => b.points - a.points)
    };
  };

  // Calculate suggested entry fees based on tier
  const getSuggestedEntryFees = (tierLevel: number) => {
    const tier = getTierByLevel(tierLevel);
    if (!tier) return { min: 50000, max: 200000 };

    // Base fees scale with tier level and multiplier
    const baseFee = 50000;
    const multiplier = tier.points_multiplier * tierLevel;
    
    return {
      min: Math.round(baseFee * multiplier),
      max: Math.round(baseFee * multiplier * 4),
    };
  };

  return {
    tiers,
    eloRules,
    isLoading: tiersLoading || rulesLoading,
    error: tiersError || rulesError,
    calculateSPAPoints,
    getTierByLevel,
    getTierSPABreakdown,
    getSuggestedEntryFees,
  };
};