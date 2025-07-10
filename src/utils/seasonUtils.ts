import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Reset season - archive current rankings and reset points
 * This function should be called every 3 months by an admin
 */
export async function resetSeason(): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('reset_season');
    
    if (error) {
      console.error('Error resetting season:', error);
      toast.error('Lỗi khi reset mùa giải');
      return false;
    }
    
    toast.success('Mùa giải đã được reset thành công!');
    return true;
  } catch (error) {
    console.error('Error in resetSeason:', error);
    toast.error('Lỗi khi reset mùa giải');
    return false;
  }
}

/**
 * Get current season information
 */
export async function getCurrentSeasonInfo(): Promise<{
  currentQuarter: number;
  seasonStart: string;
  daysRemaining: number;
} | null> {
  try {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    
    // Calculate season start (beginning of current quarter)
    const seasonStartMonth = (currentQuarter - 1) * 3;
    const seasonStart = new Date(now.getFullYear(), seasonStartMonth, 1);
    
    // Calculate next season start (beginning of next quarter)
    const nextSeasonStart = new Date(now.getFullYear(), seasonStartMonth + 3, 1);
    if (nextSeasonStart.getFullYear() > now.getFullYear()) {
      nextSeasonStart.setFullYear(now.getFullYear() + 1);
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil(
      (nextSeasonStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return {
      currentQuarter,
      seasonStart: seasonStart.toISOString(),
      daysRemaining
    };
  } catch (error) {
    console.error('Error getting season info:', error);
    return null;
  }
}

/**
 * Get season statistics for a player
 */
export async function getPlayerSeasonStats(playerId: string): Promise<{
  totalSPAPoints: number;
  rankPoints: number;
  totalMatches: number;
  wins: number;
  winRate: number;
  currentRank: string;
  promotions: number;
} | null> {
  try {
    // Get current ranking
    const { data: ranking, error: rankingError } = await supabase
      .from('player_rankings')
      .select(`
        spa_points,
        rank_points,
        total_matches,
        wins,
        season_start,
        ranks!current_rank_id(code, name)
      `)
      .eq('player_id', playerId)
      .single();

    if (rankingError) throw rankingError;

    // Get ELO history this season
    const { count: promotions, error: historyError } = await supabase
      .from('elo_history')
      .select('*', { count: 'exact' })
      .eq('player_id', playerId)
      .gte('created_at', ranking?.season_start || new Date().toISOString());

    if (historyError) throw historyError;

    const winRate = ranking.total_matches > 0 
      ? Math.round((ranking.wins / ranking.total_matches) * 100)
      : 0;

    const rankData = Array.isArray(ranking.ranks) ? ranking.ranks[0] : ranking.ranks;
    
    return {
      totalSPAPoints: ranking.spa_points || 0,
      rankPoints: ranking.rank_points || 0,
      totalMatches: ranking.total_matches || 0,
      wins: ranking.wins || 0,
      winRate,
      currentRank: rankData?.code || 'K',
      promotions: promotions || 0
    };
  } catch (error) {
    console.error('Error getting player season stats:', error);
    return null;
  }
}

/**
 * Check if it's time to reset season (every 3 months)
 */
export function shouldResetSeason(lastResetDate: string): boolean {
  const lastReset = new Date(lastResetDate);
  const now = new Date();
  const monthsDiff = (now.getFullYear() - lastReset.getFullYear()) * 12 + 
                    (now.getMonth() - lastReset.getMonth());
  
  return monthsDiff >= 3;
}