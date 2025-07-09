-- Phase 2: Database Cleanup & Optimization
-- Thêm missing indexes cho performance optimization

-- Index cho tournament search và filtering
CREATE INDEX IF NOT EXISTS idx_tournaments_name_search ON tournaments USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_tournaments_registration_dates ON tournaments(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_tournaments_type_tier ON tournaments(tournament_type, tier_level);
CREATE INDEX IF NOT EXISTS idx_tournaments_public_active ON tournaments(is_public, status) WHERE is_public = true;

-- Index cho tournament registrations performance
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_payment_status ON tournament_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_created_at ON tournament_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_compound ON tournament_registrations(tournament_id, registration_status, payment_status);

-- Index cho player rankings liên quan tournament
CREATE INDEX IF NOT EXISTS idx_player_rankings_elo_spa ON player_rankings(elo_points DESC, spa_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_rankings_updated_at ON player_rankings(updated_at DESC);

-- Index cho notification performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Thống nhất tournament status
-- Cập nhật các status cũ thành status mới theo constants
UPDATE tournaments 
SET status = 
    CASE status
        WHEN 'open' THEN 'registration_open'
        WHEN 'locked' THEN 'registration_closed'
        WHEN 'draft' THEN 'upcoming'
        ELSE status
    END,
    updated_at = now()
WHERE status IN ('open', 'locked', 'draft');

-- Thêm constraint để đảm bảo chỉ sử dụng status hợp lệ
DO $$ 
BEGIN
    -- Drop constraint cũ nếu có
    ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;
    
    -- Thêm constraint mới với các status đã thống nhất
    ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check 
    CHECK (status IN (
        'upcoming', 
        'registration_open', 
        'registration_closed', 
        'ongoing', 
        'completed', 
        'cancelled'
    ));
EXCEPTION 
    WHEN duplicate_object THEN 
        -- Constraint already exists
        NULL;
END $$;

-- Cập nhật tournament registration status để thống nhất
UPDATE tournament_registrations 
SET registration_status = 
    CASE registration_status
        WHEN 'approved' THEN 'confirmed'
        WHEN 'waiting' THEN 'pending'
        ELSE registration_status
    END,
    updated_at = now()
WHERE registration_status IN ('approved', 'waiting');

-- Thêm constraint cho registration status
DO $$ 
BEGIN
    ALTER TABLE tournament_registrations DROP CONSTRAINT IF EXISTS tournament_registrations_status_check;
    
    ALTER TABLE tournament_registrations ADD CONSTRAINT tournament_registrations_status_check 
    CHECK (registration_status IN (
        'pending', 
        'confirmed', 
        'cancelled', 
        'waitlisted'
    ));
EXCEPTION 
    WHEN duplicate_object THEN 
        NULL;
END $$;

-- Cleanup: Remove unused columns (nếu có)
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS old_status;
-- ALTER TABLE tournaments DROP COLUMN IF EXISTS legacy_field;

-- Update table statistics để optimizer có thông tin mới nhất
ANALYZE tournaments;
ANALYZE tournament_registrations;
ANALYZE tournament_matches;
ANALYZE tournament_brackets;
ANALYZE player_rankings;
ANALYZE notifications;

-- Log optimization completion
INSERT INTO system_logs (log_type, message, metadata) 
VALUES (
    'database_optimization_phase2',
    'Completed Phase 2: Database optimization with new indexes and status normalization',
    jsonb_build_object(
        'indexes_added', 9,
        'tables_optimized', 6,
        'tournament_status_normalized', true,
        'optimization_date', now(),
        'phase', '2'
    )
);