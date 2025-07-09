-- Phase 3: Database Performance Optimization (Fixed)

-- 1. First check what notification types exist
SELECT DISTINCT type FROM notifications WHERE type IS NOT NULL;

-- 2. Update invalid notification types to valid ones
UPDATE notifications 
SET type = 'system_notification' 
WHERE type NOT IN (
  'challenge_received', 'challenge_accepted', 'challenge_declined', 'challenge_cancelled',
  'match_completed', 'match_verified', 'match_disputed',
  'tournament_registration', 'tournament_status', 'tournament_reminder',
  'ranking_update', 'achievement_earned', 'spa_points_earned',
  'payment_received', 'system_notification', 'social_activity'
);

-- 3. Now safely drop and recreate the constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'challenge_received', 'challenge_accepted', 'challenge_declined', 'challenge_cancelled',
    'match_completed', 'match_verified', 'match_disputed',
    'tournament_registration', 'tournament_status', 'tournament_reminder',
    'ranking_update', 'achievement_earned', 'spa_points_earned',
    'payment_received', 'system_notification', 'social_activity'
  ));

-- 4. Add missing performance indexes
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

-- Challenges optimization
CREATE INDEX IF NOT EXISTS idx_challenges_status_expires ON challenges(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger_opponent ON challenges(challenger_id, opponent_id, status);

-- Notifications optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_priority ON notifications(type, priority, created_at);

-- 5. Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tournaments_search ON tournaments(status, city, district, tournament_start);
CREATE INDEX IF NOT EXISTS idx_leaderboard_ranking ON player_rankings(elo_points DESC, spa_points DESC, total_matches DESC);