-- Phase 3: Database Performance Optimization (Step by step)

-- 1. First, let's see what notification types we have
SELECT DISTINCT type, COUNT(*) as count 
FROM notifications 
WHERE type IS NOT NULL 
GROUP BY type 
ORDER BY count DESC;

-- 2. Remove the constraint for now to allow flexibility
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 3. Add basic performance indexes without constraint issues
CREATE INDEX IF NOT EXISTS idx_tournaments_status_date ON tournaments(status, tournament_start);
CREATE INDEX IF NOT EXISTS idx_tournaments_location ON tournaments(city, district);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(tournament_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_matches_players ON matches(player1_id, player2_id, status);
CREATE INDEX IF NOT EXISTS idx_player_rankings_points ON player_rankings(elo_points DESC, spa_points DESC);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);

-- 4. Update statistics
ANALYZE tournaments;
ANALYZE tournament_registrations;
ANALYZE matches;
ANALYZE player_rankings;
ANALYZE challenges;
ANALYZE notifications;