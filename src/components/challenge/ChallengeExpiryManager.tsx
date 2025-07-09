
import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ExpiringChallenge {
  id: string;
  challenger_id: string;
  challenger_name: string;
  opponent_id: string;
  opponent_name: string;
  expires_at: string;
  status: string;
  created_at: string;
}

export const ChallengeExpiryManager = () => {
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch expiring challenges
  const { data: expiringChallenges, isLoading, refetch } = useQuery({
    queryKey: ['expiring-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          id,
          challenger_id,
          opponent_id,
          expires_at,
          status,
          created_at,
          challenger:profiles!challenges_challenger_id_fkey(full_name),
          opponent:profiles!challenges_opponent_id_fkey(full_name)
        `)
        .eq('status', 'pending')
        .lt('expires_at', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) // Next 24 hours
        .order('expires_at', { ascending: true });

      if (error) throw error;

      return data.map(challenge => ({
        id: challenge.id,
        challenger_id: challenge.challenger_id,
        challenger_name: challenge.challenger?.full_name || 'Unknown',
        opponent_id: challenge.opponent_id,
        opponent_name: challenge.opponent?.full_name || 'Unknown',
        expires_at: challenge.expires_at,
        status: challenge.status,
        created_at: challenge.created_at
      })) as ExpiringChallenge[];
    },
    refetchInterval: autoRefresh ? 30000 : false // Refresh every 30 seconds
  });

  // Auto-expire challenges mutation
  const expireChallengesMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('challenges')
        .update({ 
          status: 'expired',
          updated_at: now
        })
        .eq('status', 'pending')
        .lt('expires_at', now)
        .select('id');

      if (error) throw error;
      return data;
    },
    onSuccess: (expiredChallenges) => {
      queryClient.invalidateQueries({ queryKey: ['expiring-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      
      if (expiredChallenges && expiredChallenges.length > 0) {
        toast.success(`Đã hết hạn ${expiredChallenges.length} thách đấu`);
      }
    },
    onError: (error) => {
      console.error('Error expiring challenges:', error);
      toast.error('Lỗi khi hết hạn thách đấu');
    }
  });

  // Manual expire challenge
  const manualExpire = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('challenges')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiring-challenges'] });
      toast.success('Thách đấu đã được đặt hết hạn');
    }
  });

  // Auto-run expiry check every minute
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      expireChallengesMutation.mutate();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoRefresh, expireChallengesMutation]);

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Đã hết hạn';
    
    return formatDistanceToNow(expiry, { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const getUrgencyColor = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursRemaining <= 0) return 'destructive';
    if (hoursRemaining <= 1) return 'destructive';
    if (hoursRemaining <= 6) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Quản lý hết hạn thách đấu
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Tự động' : 'Thủ công'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Làm mới
          </Button>
          <Button
            size="sm"
            onClick={() => expireChallengesMutation.mutate()}
            disabled={expireChallengesMutation.isPending}
          >
            Kiểm tra hết hạn
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Đang tải...</span>
          </div>
        ) : !expiringChallenges || expiringChallenges.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Không có thách đấu nào sắp hết hạn
          </div>
        ) : (
          <div className="space-y-3">
            {expiringChallenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{challenge.challenger_name}</span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="font-medium">{challenge.opponent_name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tạo: {formatDistanceToNow(new Date(challenge.created_at), { 
                      addSuffix: true, 
                      locale: vi 
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Badge variant={getUrgencyColor(challenge.expires_at)}>
                      {getTimeRemaining(challenge.expires_at)}
                    </Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => manualExpire.mutate(challenge.id)}
                    disabled={manualExpire.isPending}
                  >
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Hết hạn ngay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
