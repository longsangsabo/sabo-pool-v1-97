import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TournamentReward {
  id: string;
  position_name: string;
  tournament_type: string;
  rank_category: string;
  spa_reward: number;
  elo_reward: number;
  additional_rewards?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTournamentRewards = () => {
  const [rewards, setRewards] = useState<TournamentReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('tournament_reward_structures')
        .select('*')
        .order('tournament_type', { ascending: true })
        .order('position_name', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching tournament rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tournament rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReward = async (rewardData: Omit<TournamentReward, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tournament_reward_structures')
        .insert([rewardData])
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Tournament reward structure created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating tournament reward:', error);
      toast({
        title: "Error",
        description: "Failed to create tournament reward structure",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReward = async (id: string, rewardData: Partial<TournamentReward>) => {
    try {
      const { data, error } = await supabase
        .from('tournament_reward_structures')
        .update(rewardData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => prev.map(reward => 
        reward.id === id ? { ...reward, ...data } : reward
      ));

      toast({
        title: "Success",
        description: "Tournament reward structure updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating tournament reward:', error);
      toast({
        title: "Error",
        description: "Failed to update tournament reward structure",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournament_reward_structures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRewards(prev => prev.filter(reward => reward.id !== id));
      toast({
        title: "Success",
        description: "Tournament reward structure deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting tournament reward:', error);
      toast({
        title: "Error",
        description: "Failed to delete tournament reward structure",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  return {
    rewards,
    loading,
    createReward,
    updateReward,
    deleteReward,
    refetch: fetchRewards
  };
};