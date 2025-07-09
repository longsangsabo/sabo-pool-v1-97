-- Phase 3: Database Performance Optimization (Schema-aware)

-- 1. Remove notification constraint for flexibility
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add performance indexes based on actual schema
-- Tournament indexes (no city/district as they don't exist in tournaments)
CREATE INDEX IF NOT EXISTS idx_tournaments_status_start ON tournaments(status, tournament_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_dates ON tournaments(registration_start, registration_end);

-- Tournament registrations 
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament ON tournament_registrations(tournament_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player ON tournament_registrations(player_id, registration_date);

-- Matches optimization
CREATE INDEX IF NOT EXISTS idx_matches_players_status ON matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_created ON matches(tournament_id, created_at);

-- Match results optimization  
CREATE INDEX IF NOT EXISTS idx_match_results_players ON match_results(player1_id, player2_id, result_status);
CREATE INDEX IF NOT EXISTS idx_match_results_date ON match_results(match_date, result_status);

-- Player rankings optimization
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo_desc ON player_rankings(elo_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_spa_desc ON player_rankings(spa_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_combined ON player_rankings(elo_points DESC, spa_points DESC, total_matches DESC);

-- Challenges optimization
CREATE INDEX IF NOT EXISTS idx_challenges_status_expires ON challenges(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_challenges_players ON challenges(challenger_id, opponent_id, status);

-- Notifications optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_date ON notifications(type, created_at);

-- 3. Update table statistics for better query planning
ANALYZE tournaments;
ANALYZE tournament_registrations;
ANALYZE matches;
ANALYZE match_results;
ANALYZE player_rankings;
ANALYZE challenges;
ANALYZE notifications;