import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TOURNAMENT_ELO_REWARDS, FIXED_K_FACTOR } from '@/utils/eloConstants';

export const useEloRules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState({
    kFactor: FIXED_K_FACTOR,
    tournamentRewards: TOURNAMENT_ELO_REWARDS,
    lastUpdated: new Date()
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      // Only fetch tournament ELO rules (match ELO uses fixed K-factor)
      const { data, error } = await supabase
        .from('elo_calculation_rules')
        .select('*')
        .eq('rule_type', 'tournament_elo')
        .order('priority');

      if (error) throw error;
      setRules(data || []);
      
      // Update system info
      setSystemInfo(prev => ({
        ...prev,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error fetching ELO rules:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ELO rules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRule = async (ruleData: any) => {
    try {
      const { data, error } = await supabase
        .from('elo_calculation_rules')
        .insert([ruleData])
        .select();

      if (error) throw error;

      setRules(prev => [...prev, ...(data || [])]);
      toast({
        title: "Success",
        description: "ELO rule created successfully"
      });
    } catch (error) {
      console.error('Error creating ELO rule:', error);
      toast({
        title: "Error",
        description: "Failed to create ELO rule",
        variant: "destructive"
      });
    }
  };

  const updateRule = async (id: string, ruleData: any) => {
    try {
      const { data, error } = await supabase
        .from('elo_calculation_rules')
        .update(ruleData)
        .eq('id', id)
        .select();

      if (error) throw error;

      setRules(prev => prev.map(rule => 
        rule.id === id ? (data?.[0] || rule) : rule
      ));

      toast({
        title: "Success",
        description: "ELO rule updated successfully"
      });
    } catch (error) {
      console.error('Error updating ELO rule:', error);
      toast({
        title: "Error",
        description: "Failed to update ELO rule",
        variant: "destructive"
      });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('elo_calculation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(prev => prev.filter(rule => rule.id !== id));
      toast({
        title: "Success",
        description: "ELO rule deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting ELO rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete ELO rule",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Validate ELO system consistency
  const validateSystem = async () => {
    try {
      const { data, error } = await supabase
        .from('player_rankings')
        .select(`
          player_id,
          elo_points,
          current_rank_id,
          ranks!inner(code)
        `)
        .limit(100);

      if (error) throw error;

      const inconsistencies = data?.filter(player => {
        const { getRankByElo } = require('@/utils/rankUtils');
        const expectedRank = getRankByElo(player.elo_points);
        return expectedRank !== player.ranks.code;
      });

      return {
        totalChecked: data?.length || 0,
        inconsistencies: inconsistencies?.length || 0,
        details: inconsistencies
      };
    } catch (error) {
      console.error('System validation error:', error);
      throw error;
    }
  };

  return {
    rules,
    loading,
    systemInfo,
    createRule,
    updateRule,
    deleteRule,
    validateSystem,
    refetch: fetchRules
  };
};