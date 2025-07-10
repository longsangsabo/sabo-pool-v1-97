import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useEloRules = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('elo_calculation_rules')
        .select('*')
        .order('rule_type')
        .order('priority');

      if (error) throw error;
      setRules(data || []);
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

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules
  };
};