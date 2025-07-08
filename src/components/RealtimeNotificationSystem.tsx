import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Bell, Trophy, Swords, Target, Users } from 'lucide-react';

const RealtimeNotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const notification = payload.new as any;
          showNotificationToast(notification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'challenges',
          filter: `opponent_id=eq.${user.id}`
        },
        (payload) => {
          const challenge = payload.new as any;
          toast.info('Bạn nhận được thách đấu mới!', {
            description: 'Kiểm tra trang thách đấu để phản hồi',
            action: {
              label: 'Xem',
              onClick: () => window.location.href = '/challenges'
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tournament_registrations',
          filter: `player_id=eq.${user.id}`
        },
        (payload) => {
          const registration = payload.new as any;
          if (registration.status === 'confirmed') {
            toast.success('Đăng ký giải đấu thành công!');
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
  }, [user]);

  const showNotificationToast = (notification: any) => {
    const getIcon = (type: string) => {
      switch (type) {
        case 'tournament_update':
        case 'tournament_start':
          return <Trophy className="h-4 w-4" />;
        case 'challenge_received':
        case 'challenge_accepted':
          return <Swords className="h-4 w-4" />;
        case 'match_completed':
        case 'match_result':
          return <Target className="h-4 w-4" />;
        case 'ranking_update':
          return <Users className="h-4 w-4" />;
        default:
          return <Bell className="h-4 w-4" />;
      }
    };

    const toastOptions = {
      description: notification.message,
      icon: getIcon(notification.type),
      action: notification.action_url ? {
        label: 'Xem chi tiết',
        onClick: () => window.location.href = notification.action_url
      } : undefined
    };

    switch (notification.priority) {
      case 'high':
        toast.error(notification.title, toastOptions);
        break;
      case 'medium':
        toast.warning(notification.title, toastOptions);
        break;
      case 'low':
      default:
        toast.info(notification.title, toastOptions);
        break;
    }
  };

  return null; // This component only handles side effects
};

export default RealtimeNotificationSystem;