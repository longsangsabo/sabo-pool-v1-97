-- Priority 4: Database Optimization & Performance Indexes
-- Create performance indexes for high-traffic tables

-- Leaderboard optimizations
CREATE INDEX IF NOT EXISTS idx_leaderboards_ranking_points ON leaderboards(ranking_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_month_year ON leaderboards(month, year);
CREATE INDEX IF NOT EXISTS idx_leaderboards_city ON leaderboards(city);
CREATE INDEX IF NOT EXISTS idx_leaderboards_player_month_year ON leaderboards(player_id, month, year);

-- Player rankings optimizations
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo_points ON player_rankings(elo_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_spa_points ON player_rankings(spa_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_updated_at ON player_rankings(updated_at);

-- Profiles optimizations
CREATE INDEX IF NOT EXISTS idx_profiles_city_district ON profiles(city, district);
CREATE INDEX IF NOT EXISTS idx_profiles_skill_level ON profiles(skill_level);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_gin ON profiles USING gin(to_tsvector('english', full_name));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_gin ON profiles USING gin(to_tsvector('english', display_name));

-- Matches optimizations
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- Tournament optimizations
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON tournaments(tournament_start);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(registration_status);

-- Match results optimizations
CREATE INDEX IF NOT EXISTS idx_match_results_players ON match_results(player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_match_results_match_date ON match_results(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_match_results_verified ON match_results(result_status, verified_at);

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_api_performance_endpoint ON api_performance_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_performance_timestamp ON api_performance_metrics(timestamp DESC);

-- Error logs optimization
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

-- Create materialized view for leaderboard stats (faster aggregations)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard_stats AS
SELECT 
  COUNT(*) as total_players,
  AVG(ranking_points) as avg_elo,
  MAX(ranking_points) as max_elo,
  MIN(ranking_points) as min_elo,
  COUNT(*) FILTER (WHERE updated_at > NOW() - INTERVAL '30 days') as active_players,
  date_trunc('hour', NOW()) as last_updated
FROM leaderboards 
WHERE month = EXTRACT(MONTH FROM NOW()) 
AND year = EXTRACT(YEAR FROM NOW());

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_leaderboard_stats;
END;
$$;

-- Create automated cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old API performance metrics (keep last 30 days)
  DELETE FROM api_performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old error logs (keep last 90 days)
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up old analytics events (keep last 60 days)
  DELETE FROM analytics_events 
  WHERE created_at < NOW() - INTERVAL '60 days';
  
  -- Update statistics after cleanup
  ANALYZE api_performance_metrics;
  ANALYZE error_logs;
  ANALYZE analytics_events;
END;
$$;

-- Create performance optimization function for queries
CREATE OR REPLACE FUNCTION optimize_leaderboard_query(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_city TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  player_id UUID,
  ranking_points INTEGER,
  total_wins INTEGER,
  total_matches INTEGER,
  win_rate NUMERIC,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  city TEXT,
  district TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.player_id,
    l.ranking_points,
    l.total_wins,
    l.total_matches,
    l.win_rate,
    p.full_name,
    p.display_name,
    p.avatar_url,
    l.city,
    l.district
  FROM leaderboards l
  JOIN profiles p ON l.player_id = p.user_id
  WHERE l.month = EXTRACT(MONTH FROM NOW())
    AND l.year = EXTRACT(YEAR FROM NOW())
    AND (p_city IS NULL OR l.city = p_city)
    AND (p_search IS NULL OR 
         p.full_name ILIKE '%' || p_search || '%' OR 
         p.display_name ILIKE '%' || p_search || '%')
  ORDER BY l.ranking_points DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;