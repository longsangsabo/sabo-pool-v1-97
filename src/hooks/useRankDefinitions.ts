import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useRankDefinitions = () => {
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rank_definitions')
        .select('*')
        .order('rank_order');

      if (error) throw error;
      setRanks(data || []);
    } catch (error) {
      console.error('Error fetching ranks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch ranks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createRank = async (rankData: any) => {
    try {
      const { data, error } = await supabase
        .from('rank_definitions')
        .insert([rankData])
        .select();

      if (error) throw error;

      setRanks(prev => [...prev, ...(data || [])]);
      toast({
        title: "Success",
        description: "Rank created successfully"
      });
    } catch (error) {
      console.error('Error creating rank:', error);
      toast({
        title: "Error",
        description: "Failed to create rank",
        variant: "destructive"
      });
    }
  };

  const updateRank = async (id: string, rankData: any) => {
    try {
      const { data, error } = await supabase
        .from('rank_definitions')
        .update(rankData)
        .eq('id', id)
        .select();

      if (error) throw error;

      setRanks(prev => prev.map(rank => 
        rank.id === id ? (data?.[0] || rank) : rank
      ));

      toast({
        title: "Success",
        description: "Rank updated successfully"
      });
    } catch (error) {
      console.error('Error updating rank:', error);
      toast({
        title: "Error",
        description: "Failed to update rank",
        variant: "destructive"
      });
    }
  };

  const deleteRank = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rank_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRanks(prev => prev.filter(rank => rank.id !== id));
      toast({
        title: "Success",
        description: "Rank deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting rank:', error);
      toast({
        title: "Error",
        description: "Failed to delete rank",
        variant: "destructive"
      });
    }
  };

  const reorderRanks = async (id: string, newOrder: number) => {
    try {
      // First, update the target rank's order
      const { error } = await supabase
        .from('rank_definitions')
        .update({ rank_order: newOrder })
        .eq('id', id);

      if (error) throw error;

      // Refresh the list to get updated order
      await fetchRanks();

      toast({
        title: "Success",
        description: "Rank order updated successfully"
      });
    } catch (error) {
      console.error('Error reordering ranks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder ranks",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);

  return {
    ranks,
    loading,
    createRank,
    updateRank,
    deleteRank,
    reorderRanks,
    refetch: fetchRanks
  };
};