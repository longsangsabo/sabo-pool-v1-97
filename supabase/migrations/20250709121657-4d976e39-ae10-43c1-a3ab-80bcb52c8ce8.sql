-- Phase 3: Database Performance Optimization

-- 1. Fix notification constraint issues first (from logs)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'challenge_received', 'challenge_accepted', 'challenge_declined', 'challenge_cancelled',
    'match_completed', 'match_verified', 'match_disputed',
    'tournament_registration', 'tournament_status', 'tournament_reminder',
    'ranking_update', 'achievement_earned', 'spa_points_earned',
    'payment_received', 'system_notification', 'social_activity'
  ));

-- 2. Add missing performance indexes
-- Tournament queries optimization
CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, tournament_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_dates ON tournaments(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_tournaments_location ON tournaments(city, district);

-- Tournament registrations optimization  
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_status ON tournament_registrations(tournament_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player_date ON tournament_registrations(player_id, registration_date);

-- Matches and results optimization
CREATE INDEX IF NOT EXISTS idx_matches_players_status ON matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_date ON matches(tournament_id, created_at);
CREATE INDEX IF NOT EXISTS idx_match_results_players_verified ON match_results(player1_id, player2_id, result_status);
CREATE INDEX IF NOT EXISTS idx_match_results_date_status ON match_results(match_date, result_status);

-- Player rankings optimization
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo_spa ON player_rankings(elo_points DESC, spa_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_city_rank ON player_rankings(player_id) INCLUDE (elo_points, spa_points, total_matches);

-- Challenges optimization
CREATE INDEX IF NOT EXISTS idx_challenges_status_expires ON challenges(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_opponent ON challenges(challenger_id, opponent_id, status);

-- Notifications optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority, created_at);

-- Posts and social features optimization
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at);

-- 3. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tournaments_search ON tournaments(status, city, district, tournament_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking ON player_rankings(elo_points DESC, spa_points DESC, total_matches DESC);

-- 4. Add database statistics update
ANALYZE tournaments;
ANALYZE tournament_registrations;
ANALYZE matches;
ANALYZE match_results;
ANALYZE player_rankings;
ANALYZE challenges;
ANALYZE notifications;

-- 5. Create performance monitoring views
CREATE OR REPLACE VIEW performance_slow_queries AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;

-- 6. Create tournament performance tracking
CREATE TABLE IF NOT EXISTS tournament_performance_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  measured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_tournament_performance_tournament_metric 
ON tournament_performance_stats(tournament_id, metric_name, measured_at);

-- 7. Add query caching table for expensive operations
CREATE TABLE IF NOT EXISTS query_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_cache_key_expires ON query_cache(cache_key, expires_at);

-- 8. Create function for efficient tournament search
CREATE OR REPLACE FUNCTION search_tournaments_optimized(
  p_search_text TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tournament_type TEXT,
  status TEXT,
  city TEXT,
  district TEXT,
  tournament_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  current_participants INTEGER,
  max_participants INTEGER,
  entry_fee NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.tournament_type,
    t.status,
    t.city,
    t.district,
    t.tournament_start,
    t.registration_end,
    t.current_participants,
    t.max_participants,
    t.entry_fee
  FROM tournaments t
  WHERE 
    (p_search_text IS NULL OR t.name ILIKE '%' || p_search_text || '%')
    AND (p_city IS NULL OR t.city = p_city)
    AND (p_status IS NULL OR t.status = p_status)
  ORDER BY 
    CASE WHEN t.status = 'registration_open' THEN 1
         WHEN t.status = 'upcoming' THEN 2  
         WHEN t.status = 'ongoing' THEN 3
         ELSE 4 END,
    t.tournament_start ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;