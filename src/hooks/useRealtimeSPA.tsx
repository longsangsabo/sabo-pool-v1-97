import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SPAUpdate {
  user_id: string;
  amount: number;
  category: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export function useRealtimeSPA() {
  const { user } = useAuth();
  const [recentUpdates, setRecentUpdates] = useState<SPAUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time SPA points changes
    const channel = supabase
      .channel('spa-points-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'spa_points_log'
        },
        async (payload) => {
          const newRecord = payload.new as any;
          
          // Get user name for the update
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', newRecord.player_id)
            .single();

          const spaUpdate: SPAUpdate = {
            user_id: newRecord.player_id,
            amount: newRecord.points_earned,
            category: newRecord.source_type,
            description: newRecord.description,
            timestamp: newRecord.created_at,
            user_name: profile?.full_name || 'Unknown User'
          };

          setRecentUpdates(prev => [spaUpdate, ...prev.slice(0, 19)]); // Keep last 20 updates

          // Show notification for current user's updates
          if (newRecord.player_id === user.id && newRecord.points_earned > 0) {
            toast.success(
              `🎯 +${newRecord.points_earned} SPA điểm!`,
              {
                description: newRecord.description,
                duration: 4000
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'player_rankings',
          filter: `player_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;
          
          const spaChange = newRecord.spa_points - oldRecord.spa_points;
          
          if (spaChange !== 0) {
            toast.info(
              `SPA điểm đã cập nhật: ${spaChange > 0 ? '+' : ''}${spaChange}`,
              {
                description: `Tổng: ${newRecord.spa_points.toLocaleString()} SPA`,
                duration: 3000
              }
            );
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Get recent SPA updates for the feed
  const getRecentGlobalUpdates = async () => {
    const { data } = await supabase
      .from('spa_points_log')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const updates: SPAUpdate[] = data.map(log => ({
        user_id: log.player_id,
        amount: log.points_earned,
        category: log.source_type,
        description: log.description,
        timestamp: log.created_at,
        user_name: (log.profiles as any)?.full_name || 'Unknown User'
      }));
      
      setRecentUpdates(updates);
    }
  };

  return {
    recentUpdates,
    isConnected,
    getRecentGlobalUpdates
  };
}