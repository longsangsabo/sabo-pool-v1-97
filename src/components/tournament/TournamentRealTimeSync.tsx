import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface TournamentRealTimeSyncProps {
  tournamentId?: string;
  onTournamentUpdate?: (tournament: any) => void;
  onParticipantUpdate?: (participant: any) => void;
}

export const TournamentRealTimeSync: React.FC<TournamentRealTimeSyncProps> = ({
  tournamentId,
  onTournamentUpdate,
  onParticipantUpdate
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!tournamentId) return;

    // Tournament changes subscription
    const tournamentChannel = supabase
      .channel(`tournament_${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournaments',
          filter: `id=eq.${tournamentId}`
        },
        (payload) => {
          console.log('Tournament update:', payload);
          setLastUpdate(new Date());
          onTournamentUpdate?.(payload.new);
          
          if (payload.eventType === 'UPDATE') {
            toast.info('Giải đấu đã được cập nhật');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload) => {
          console.log('Registration update:', payload);
          setLastUpdate(new Date());
          onParticipantUpdate?.(payload.new);
          
          if (payload.eventType === 'INSERT') {
            toast.success('Có người tham gia mới');
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('Real-time sync connected for tournament:', tournamentId);
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(tournamentChannel);
    };
  }, [tournamentId, onTournamentUpdate, onParticipantUpdate]);

  if (!tournamentId) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant={isConnected ? "secondary" : "destructive"} className="gap-1">
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Đang đồng bộ' : 'Mất kết nối'}
      </Badge>
      {lastUpdate && (
        <span className="text-muted-foreground">
          Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}
        </span>
      )}
    </div>
  );
};

export default TournamentRealTimeSync;