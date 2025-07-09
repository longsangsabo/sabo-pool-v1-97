import React from 'react';
import { RankingSPATabs } from '@/components/profile/RankingSPATabs';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRankByElo, type RankCode } from '@/utils/rankUtils';

const PerformanceTab = () => {
  const { user } = useAuth();

  // Fetch player data
  const { data: playerData, isLoading } = useQuery({
    queryKey: ['player-performance', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('player_rankings')
        .select(`
          *,
          ranks!current_rank_id(code, name, elo_points_required)
        `)
        .eq('player_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch ELO history
  const { data: eloHistory } = useQuery({
    queryKey: ['elo-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('elo_history')
        .select('*')
        .eq('player_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mock SPA milestones data
  const spaMilestones = [
    { points: 100, title: '100 SPA Points', reward: 'Badge "Khởi đầu"', completed: true },
    { points: 500, title: '500 SPA Points', reward: 'Voucher giảm giá 10%', completed: true },
    { points: 1000, title: '1000 SPA Points', reward: 'Cơ Pool miễn phí 1h', completed: false },
    { points: 2500, title: '2500 SPA Points', reward: 'Badge "Cao thủ"', completed: false },
    { points: 5000, title: '5000 SPA Points', reward: 'Giải đấu VIP', completed: false },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Thành tích & Ranking</h2>
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!playerData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Thành tích & Ranking</h2>
          <p className="text-muted-foreground">
            Chưa có dữ liệu ranking. Hãy bắt đầu với trận đấu đầu tiên!
          </p>
        </div>
      </div>
    );
  }

  // Transform data for RankingSPATabs
  const transformedPlayerData = {
    rank: (playerData.ranks?.code || getRankByElo(playerData.elo_points || 1000)) as RankCode,
    elo_points: playerData.elo_points || 1000,
    spa_points: playerData.spa_points || 0,
    total_matches: playerData.total_matches || 0,
    last_promotion_date: null, // Will be added after successful migration
    weekly_spa_rank: Math.floor(Math.random() * 50) + 1, // Mock data
    monthly_spa_rank: Math.floor(Math.random() * 100) + 1, // Mock data
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Thành tích & Ranking</h2>
        <p className="text-muted-foreground">
          Theo dõi ELO chính thức và SPA Points "vui" của bạn
        </p>
      </div>
      
      <RankingSPATabs
        playerData={transformedPlayerData}
        eloHistory={eloHistory}
        spaMilestones={spaMilestones}
      />
    </div>
  );
};

export default PerformanceTab;