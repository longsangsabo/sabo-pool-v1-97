import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeTournamentSync = (tournamentId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          setLastUpdate(new Date());
          const tournament = payload.new as any;
          
          if (tournament.status === 'ongoing') {
            toast.success('Giải đấu đã bắt đầu!');
          } else if (tournament.status === 'completed') {
            toast.info('Giải đấu đã kết thúc!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_matches',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          setLastUpdate(new Date());
          const match = payload.new as any;
          
          if (match.status === 'completed' && match.winner_id) {
            toast.info('Có kết quả trận đấu mới!');
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [tournamentId]);

  return { isConnected, lastUpdate };
};