
-- Script migration an toàn để chuẩn hóa điểm ELO theo hệ thống mới
-- Cập nhật rank từ 'J' thành 'K+' và chuẩn hóa ELO points

-- Bước 1: Cập nhật rank 'J' thành 'K+'
UPDATE player_rankings 
SET current_rank = 'K+'
WHERE current_rank = 'J';

-- Bước 2: Chuẩn hóa ELO points theo hạng hiện tại
UPDATE player_rankings
SET elo_points = 
  CASE 
    WHEN current_rank = 'K' AND (elo_points IS NULL OR elo_points < 1000) THEN 1000
    WHEN current_rank = 'K+' AND (elo_points IS NULL OR elo_points < 1100) THEN 1100
    WHEN current_rank = 'I' AND (elo_points IS NULL OR elo_points < 1200) THEN 1200
    WHEN current_rank = 'I+' AND (elo_points IS NULL OR elo_points < 1300) THEN 1300
    WHEN current_rank = 'H' AND (elo_points IS NULL OR elo_points < 1400) THEN 1400
    WHEN current_rank = 'H+' AND (elo_points IS NULL OR elo_points < 1500) THEN 1500
    WHEN current_rank = 'G' AND (elo_points IS NULL OR elo_points < 1600) THEN 1600
    WHEN current_rank = 'G+' AND (elo_points IS NULL OR elo_points < 1700) THEN 1700
    WHEN current_rank = 'F' AND (elo_points IS NULL OR elo_points < 1800) THEN 1800
    WHEN current_rank = 'F+' AND (elo_points IS NULL OR elo_points < 1900) THEN 1900
    WHEN current_rank = 'E' AND (elo_points IS NULL OR elo_points < 2000) THEN 2000
    WHEN current_rank = 'E+' AND (elo_points IS NULL OR elo_points < 2100) THEN 2100
    ELSE elo_points
  END,
updated_at = now()
WHERE (
  elo_points IS NULL OR 
  elo_points < 100 OR 
  (current_rank = 'K' AND elo_points < 1000) OR
  (current_rank = 'K+' AND elo_points < 1100) OR
  (current_rank = 'I' AND elo_points < 1200) OR
  (current_rank = 'I+' AND elo_points < 1300) OR
  (current_rank = 'H' AND elo_points < 1400) OR
  (current_rank = 'H+' AND elo_points < 1500) OR
  (current_rank = 'G' AND elo_points < 1600) OR
  (current_rank = 'G+' AND elo_points < 1700) OR
  (current_rank = 'F' AND elo_points < 1800) OR
  (current_rank = 'F+' AND elo_points < 1900) OR
  (current_rank = 'E' AND elo_points < 2000) OR
  (current_rank = 'E+' AND elo_points < 2100)
);

-- Bước 3: Cập nhật elo column để sync với elo_points (backward compatibility)
UPDATE player_rankings 
SET elo = elo_points
WHERE elo != elo_points OR elo IS NULL;

-- Bước 4: Thêm column để track promotion eligibility (nếu chưa có)
ALTER TABLE player_rankings 
ADD COLUMN IF NOT EXISTS last_promotion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_eligible BOOLEAN DEFAULT false;

-- Bước 5: Cập nhật promotion eligibility
UPDATE player_rankings 
SET promotion_eligible = (
  total_matches >= 4 AND 
  (last_promotion_date IS NULL OR last_promotion_date < now() - INTERVAL '7 days')
);

-- Bước 6: Log migration
INSERT INTO system_logs (log_type, message, metadata) 
VALUES (
  'elo_migration',
  'Migrated ELO system to new rank structure K-E+',
  jsonb_build_object(
    'affected_players', (SELECT COUNT(*) FROM player_rankings WHERE updated_at >= now() - INTERVAL '1 minute'),
    'migration_date', now(),
    'version', '2.0'
  )
);
