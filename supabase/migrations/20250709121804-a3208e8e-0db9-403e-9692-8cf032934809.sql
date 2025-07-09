-- Phase 3: Database Performance Optimization (Alternative approach)

-- 1. Expand the constraint to include existing types first
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'challenge_received', 'challenge_accepted', 'challenge_declined', 'challenge_cancelled',
    'match_completed', 'match_verified', 'match_disputed',
    'tournament_registration', 'tournament_status', 'tournament_reminder',
    'ranking_update', 'achievement_earned', 'spa_points_earned',
    'payment_received', 'system_notification', 'social_activity',
    'club_registration', 'club_approved', 'club_rejected', 'admin_notification'
  ));

-- 2. Add missing performance indexes (safer approach)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, tournament_start);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournaments_location ON tournaments(city, district);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tournament_registrations_tournament_status ON tournament_registrations(tournament_id, registration_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_players_status ON matches(player1_id, player2_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_player_rankings_elo_spa ON player_rankings(elo_points DESC, spa_points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_challenges_status_expires ON challenges(status, expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);

-- 3. Add performance monitoring table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type TEXT NOT NULL,
  execution_time_ms NUMERIC NOT NULL,
  query_params JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Update table statistics for query planner
ANALYZE tournaments;
ANALYZE tournament_registrations; 
ANALYZE matches;
ANALYZE player_rankings;
ANALYZE challenges;
ANALYZE notifications;