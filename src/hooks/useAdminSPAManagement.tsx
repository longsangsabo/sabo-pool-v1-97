import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SPATransaction {
  user_id: string;
  amount: number;
  reason: string;
  admin_notes?: string;
}

interface SPAAdjustment {
  player_id: string;
  old_amount: number;
  new_amount: number;
  difference: number;
  reason: string;
  admin_id: string;
  created_at: string;
}

export function useAdminSPAManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if user is admin
  const { data: isAdmin } = useQuery({
    queryKey: ['admin-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      return data?.is_admin || false;
    },
    enabled: !!user?.id
  });

  // Get all players with SPA for admin management
  const { data: playersWithSPA, isLoading: isLoadingPlayers } = useQuery({
    queryKey: ['admin-spa-players'],
    queryFn: async () => {
      const { data } = await supabase
        .from('player_rankings')
        .select(`
          player_id,
          spa_points,
          profiles!inner(
            full_name,
            display_name,
            current_rank
          )
        `)
        .order('spa_points', { ascending: false });

      return data?.map(item => ({
        player_id: item.player_id,
        spa_points: item.spa_points,
        full_name: (item.profiles as any)?.full_name || 'Unknown',
        display_name: (item.profiles as any)?.display_name || 'Unknown',
        current_rank: (item.profiles as any)?.current_rank || 'Unranked'
      })) || [];
    },
    enabled: !!isAdmin
  });

  // Get SPA adjustment history
  const { data: adjustmentHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['spa-adjustment-history'],
    queryFn: async () => {
      // Mock data since we don't have spa_adjustments table yet
      return [
        {
          player_id: 'player1',
          old_amount: 1000,
          new_amount: 1100,
          difference: 100,
          reason: 'Manual adjustment for tournament win',
          admin_id: user?.id || '',
          created_at: new Date().toISOString()
        }
      ] as SPAAdjustment[];
    },
    enabled: !!isAdmin
  });

  // Manually adjust SPA points
  const adjustSPAMutation = useMutation({
    mutationFn: async ({ user_id, amount, reason, admin_notes }: SPATransaction) => {
      if (!isAdmin) throw new Error('Unauthorized');

      // Get current SPA points
      const { data: currentRanking } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .eq('player_id', user_id)
        .single();

      if (!currentRanking) {
        throw new Error('Player ranking not found');
      }

      const oldAmount = currentRanking.spa_points;
      const newAmount = oldAmount + amount;

      // Update SPA points
      const { error: updateError } = await supabase
        .from('player_rankings')
        .update({ spa_points: newAmount })
        .eq('player_id', user_id);

      if (updateError) throw updateError;

      // Log the transaction
      const { error: logError } = await supabase.rpc('credit_spa_points', {
        p_user_id: user_id,
        p_amount: amount,
        p_category: 'admin_adjustment',
        p_description: `Admin adjustment: ${reason}`,
        p_reference_id: `admin_${Date.now()}`
      });

      if (logError) throw logError;

      return {
        user_id,
        old_amount: oldAmount,
        new_amount: newAmount,
        difference: amount,
        reason,
        admin_notes
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spa-players'] });
      queryClient.invalidateQueries({ queryKey: ['spa-adjustment-history'] });
      queryClient.invalidateQueries({ queryKey: ['player-rankings'] });
      
      toast.success(
        `SPA đã được điều chỉnh ${data.difference > 0 ? '+' : ''}${data.difference}`,
        {
          description: `Tổng mới: ${data.new_amount.toLocaleString()} SPA`,
          duration: 4000
        }
      );
    },
    onError: (error) => {
      console.error('Error adjusting SPA:', error);
      toast.error('Lỗi khi điều chỉnh SPA points');
    }
  });

  // Bulk SPA adjustment
  const bulkAdjustSPAMutation = useMutation({
    mutationFn: async (transactions: SPATransaction[]) => {
      if (!isAdmin) throw new Error('Unauthorized');

      const results = [];
      
      for (const transaction of transactions) {
        try {
          const result = await adjustSPAMutation.mutateAsync(transaction);
          results.push(result);
        } catch (error) {
          console.error(`Failed to adjust SPA for user ${transaction.user_id}:`, error);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      toast.success(
        `Đã điều chỉnh SPA cho ${results.length} người chơi`,
        {
          description: 'Tất cả thay đổi đã được áp dụng',
          duration: 4000
        }
      );
    }
  });

  // Reset player SPA to zero
  const resetPlayerSPAMutation = useMutation({
    mutationFn: async ({ user_id, reason }: { user_id: string; reason: string }) => {
      if (!isAdmin) throw new Error('Unauthorized');

      const { data: currentRanking } = await supabase
        .from('player_rankings')
        .select('spa_points')
        .eq('player_id', user_id)
        .single();

      if (!currentRanking) throw new Error('Player not found');

      const oldAmount = currentRanking.spa_points;
      
      // Reset to zero
      const { error } = await supabase
        .from('player_rankings')
        .update({ spa_points: 0 })
        .eq('player_id', user_id);

      if (error) throw error;

      // Log the reset
      await supabase.rpc('credit_spa_points', {
        p_user_id: user_id,
        p_amount: -oldAmount,
        p_category: 'admin_reset',
        p_description: `Admin reset: ${reason}`,
        p_reference_id: `reset_${Date.now()}`
      });

      return { user_id, old_amount: oldAmount, reason };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-spa-players'] });
      queryClient.invalidateQueries({ queryKey: ['spa-adjustment-history'] });
      
      toast.success(
        `Đã reset SPA points (${data.old_amount.toLocaleString()} → 0)`,
        {
          description: data.reason,
          duration: 4000
        }
      );
    },
    onError: (error) => {
      console.error('Error resetting SPA:', error);
      toast.error('Lỗi khi reset SPA points');
    }
  });

  return {
    isAdmin,
    playersWithSPA,
    adjustmentHistory,
    isLoadingPlayers,
    isLoadingHistory,
    adjustSPA: adjustSPAMutation.mutateAsync,
    bulkAdjustSPA: bulkAdjustSPAMutation.mutateAsync,
    resetPlayerSPA: resetPlayerSPAMutation.mutateAsync,
    isAdjusting: adjustSPAMutation.isPending,
    isBulkAdjusting: bulkAdjustSPAMutation.isPending,
    isResetting: resetPlayerSPAMutation.isPending
  };
}