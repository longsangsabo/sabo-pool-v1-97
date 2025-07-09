import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRealtimeTournamentSync = (tournamentId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('Setting up tournament sync for:', tournamentId);
    
    // Listen to all tournament changes, not just specific tournament
    const channel = supabase
      .channel('tournament_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments'
        },
        (payload) => {
          console.log('Tournament change detected:', payload);
          setLastUpdate(new Date());
          
          // Show toast for tournament status changes
          if (payload.eventType === 'UPDATE') {
            const oldRecord = payload.old as any;
            const newRecord = payload.new as any;
            
            if (oldRecord?.is_visible !== newRecord?.is_visible) {
              if (!newRecord.is_visible) {
                toast.info(`Giải đấu "${newRecord.name}" đã bị hủy`);
              } else {
                toast.success(`Giải đấu "${newRecord.name}" đã được khôi phục`);
              }
            }
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