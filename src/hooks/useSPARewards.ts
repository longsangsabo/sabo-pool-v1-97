import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SPAReward {
  id: string;
  milestone_name: string;
  milestone_type: string;
  requirement_value: number;
  spa_reward: number;
  bonus_conditions?: any;
  is_active: boolean;
  is_repeatable: boolean;
  created_at: string;
  updated_at: string;
}

export const useSPARewards = () => {
  const [rewards, setRewards] = useState<SPAReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('spa_reward_milestones')
        .select('*')
        .order('milestone_type', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      setRewards(data || []);
    } catch (error) {
      console.error('Error fetching SPA rewards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch SPA rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReward = async (rewardData: Omit<SPAReward, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('spa_reward_milestones')
        .insert([rewardData])
        .select()
        .single();

      if (error) throw error;

      setRewards(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "SPA reward milestone created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating SPA reward:', error);
      toast({
        title: "Error",
        description: "Failed to create SPA reward milestone",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateReward = async (id: string, rewardData: Partial<SPAReward>) => {
    try {
      const { data, error } = await supabase
        .from('spa_reward_milestones')
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
        description: "SPA reward milestone updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating SPA reward:', error);
      toast({
        title: "Error",
        description: "Failed to update SPA reward milestone",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReward = async (id: string) => {
    try {
      const { error } = await supabase
        .from('spa_reward_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRewards(prev => prev.filter(reward => reward.id !== id));
      toast({
        title: "Success",
        description: "SPA reward milestone deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting SPA reward:', error);
      toast({
        title: "Error",
        description: "Failed to delete SPA reward milestone",
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