import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Rank {
  id: string;
  code: string;
  name: string;
  level: number;
  skill_description: string;
  requirements: any;
}

interface PlayerRanking {
  id: string;
  player_id: string;
  current_rank_id: string;
  rank_points: number;
  spa_points: number;
  season_start: string;
  total_matches: number;
  wins: number;
  verified_by?: string;
  verified_at?: string;
  rank?: Rank;
}

interface SPAPointsEntry {
  id: string;
  player_id: string;
  source_type: 'tournament' | 'challenge' | 'checkin' | 'video' | 'decay';
  source_id?: string;
  points_earned: number;
  description: string;
  created_at: string;
}

interface RankingHistory {
  id: string;
  player_id: string;
  old_rank_id: string;
  new_rank_id: string;
  promotion_date: string;
  total_points_earned: number;
  season: number;
  old_rank?: Rank;
  new_rank?: Rank;
}

export const usePlayerRanking = (playerId?: string) => {
  const { user } = useAuth();
  const currentPlayerId = playerId || user?.id;

  const [playerRanking, setPlayerRanking] = useState<PlayerRanking | null>(null);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [spaPointsLog, setSpaPointsLog] = useState<SPAPointsEntry[]>([]);
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRanks = async () => {
    const { data, error } = await supabase
      .from('ranks')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('Error fetching ranks:', error);
      return [];
    }

    return data || [];
  };

  const fetchPlayerRanking = async () => {
    if (!currentPlayerId) return;

    const { data, error } = await supabase
      .from('player_rankings')
      .select(`
        *,
        rank:ranks(*)
      `)
      .eq('player_id', currentPlayerId)
      .single();

    if (error) {
      console.error('Error fetching player ranking:', error);
      return null;
    }

    return data;
  };

  const fetchSPAPointsLog = async () => {
    if (!currentPlayerId) return [];

    const { data, error } = await supabase
      .from('spa_points_log')
      .select('*')
      .eq('player_id', currentPlayerId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching SPA points log:', error);
      return [];
    }

    return data || [];
  };

  const fetchRankingHistory = async () => {
    if (!currentPlayerId) return [];

    const { data, error } = await supabase
      .from('elo_history')
      .select('*')
      .eq('player_id', currentPlayerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ranking history:', error);
      return [];
    }

    return data || [];
  };

  const loadData = async () => {
    if (!currentPlayerId) return;

    setLoading(true);
    setError('');

    try {
      const [ranksData, rankingData, pointsLogData, historyData] = await Promise.all([
        fetchRanks(),
        fetchPlayerRanking(),
        fetchSPAPointsLog(),
        fetchRankingHistory()
      ]);

      setRanks(ranksData);
      setPlayerRanking(rankingData);
      setSpaPointsLog(pointsLogData as SPAPointsEntry[]);
      // Transform elo_history to ranking history format
      const transformedHistory = historyData.map((item: any) => ({
        id: item.id,
        player_id: item.player_id,
        old_rank_id: item.rank_before || '',
        new_rank_id: item.rank_after || '',
        promotion_date: item.created_at,
        total_points_earned: item.elo_change,
        season: 1,
        old_rank: null,
        new_rank: null
      }));
      setRankingHistory(transformedHistory);
    } catch (err) {
      console.error('Error loading ranking data:', err);
      setError('Failed to load ranking data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate points breakdown
  const getPointsBreakdown = () => {
    const breakdown = {
      tournament: 0,
      challenge: 0,
      checkin: 0,
      video: 0,
      decay: 0
    };

    spaPointsLog.forEach(entry => {
      if (entry.points_earned > 0) {
        breakdown[entry.source_type] += entry.points_earned;
      }
    });

    return breakdown;
  };

  // Get current rank progress
  const getRankProgress = () => {
    if (!playerRanking || !ranks.length) return null;

    const currentRankLevel = playerRanking.rank?.level || 1;
    const nextRank = ranks.find(r => r.level === currentRankLevel + 1);
    
    if (!nextRank) {
      return {
        current: playerRanking.rank,
        next: null,
        progress: 100,
        pointsNeeded: 0,
        pointsToNext: 0
      };
    }

    // Need 1000 SPA points to advance to next rank
    const pointsNeeded = 1000;
    const currentPoints = playerRanking.spa_points;
    const progress = Math.min((currentPoints / pointsNeeded) * 100, 100);
    const pointsToNext = Math.max(pointsNeeded - currentPoints, 0);

    return {
      current: playerRanking.rank,
      next: nextRank,
      progress,
      pointsNeeded,
      pointsToNext
    };
  };

  // Get daily challenge count
  const getDailyChallengeCount = () => {
    const today = new Date().toDateString();
    return spaPointsLog.filter(entry => 
      entry.source_type === 'challenge' && 
      new Date(entry.created_at).toDateString() === today
    ).length;
  };

  // Initialize player ranking if doesn't exist
  const initializePlayerRanking = async () => {
    if (!currentPlayerId) return;

    const beginnerRank = ranks.find(r => r.code === 'K');
    if (!beginnerRank) return;

    const { error } = await supabase
      .from('player_rankings')
      .insert({
        player_id: currentPlayerId,
        current_rank_id: beginnerRank.id,
        spa_points: 0,
        total_matches: 0,
        wins: 0
      });

    if (!error) {
      await loadData(); // Reload data
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('player-ranking-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_rankings',
        filter: `player_id=eq.${currentPlayerId}`
      }, () => {
        console.log('Player ranking updated, reloading...');
        loadData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'spa_points_log',
        filter: `player_id=eq.${currentPlayerId}`
      }, () => {
        console.log('SPA points updated, reloading...');
        loadData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPlayerId]);

  return {
    playerRanking,
    ranks,
    spaPointsLog,
    rankingHistory,
    loading,
    error,
    getPointsBreakdown,
    getRankProgress,
    getDailyChallengeCount,
    initializePlayerRanking,
    refetch: loadData
  };
};