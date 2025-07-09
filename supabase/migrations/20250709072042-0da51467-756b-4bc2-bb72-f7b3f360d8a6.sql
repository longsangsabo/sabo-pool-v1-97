-- Migration chuẩn hóa hệ thống ELO và SPA Points - Version 2.0
-- Cập nhật để phù hợp với cấu trúc database hiện tại

-- Bước 1: Cập nhật elo_points_required trong bảng ranks theo hệ thống mới
UPDATE ranks 
SET elo_points_required = 
  CASE code
    WHEN 'K' THEN 1000
    WHEN 'K+' THEN 1100  
    WHEN 'I' THEN 1200
    WHEN 'I+' THEN 1300
    WHEN 'H' THEN 1400
    WHEN 'H+' THEN 1500
    WHEN 'G' THEN 1600
    WHEN 'G+' THEN 1700
    WHEN 'F' THEN 1800
    WHEN 'F+' THEN 1900
    WHEN 'E' THEN 2000
    WHEN 'E+' THEN 2100
    ELSE elo_points_required
  END
WHERE code IN ('K', 'K+', 'I', 'I+', 'H', 'H+', 'G', 'G+', 'F', 'F+', 'E', 'E+');

-- Bước 2: Cập nhật current_rank_id cho players chưa có rank hoặc có ELO không phù hợp
UPDATE player_rankings 
SET current_rank_id = (
  SELECT r.id 
  FROM ranks r 
  WHERE r.code = 
    CASE 
      WHEN player_rankings.elo_points >= 2100 THEN 'E+'
      WHEN player_rankings.elo_points >= 2000 THEN 'E'
      WHEN player_rankings.elo_points >= 1900 THEN 'F+'
      WHEN player_rankings.elo_points >= 1800 THEN 'F'
      WHEN player_rankings.elo_points >= 1700 THEN 'G+'
      WHEN player_rankings.elo_points >= 1600 THEN 'G'
      WHEN player_rankings.elo_points >= 1500 THEN 'H+'
      WHEN player_rankings.elo_points >= 1400 THEN 'H'
      WHEN player_rankings.elo_points >= 1300 THEN 'I+'
      WHEN player_rankings.elo_points >= 1200 THEN 'I'
      WHEN player_rankings.elo_points >= 1100 THEN 'K+'
      ELSE 'K'
    END
),
updated_at = now()
WHERE current_rank_id IS NULL 
   OR elo_points IS NULL 
   OR elo_points < 1000
   OR current_rank_id NOT IN (
     SELECT r.id FROM ranks r 
     WHERE (r.code = 'K' AND player_rankings.elo_points >= 1000 AND player_rankings.elo_points < 1100)
        OR (r.code = 'K+' AND player_rankings.elo_points >= 1100 AND player_rankings.elo_points < 1200)
        OR (r.code = 'I' AND player_rankings.elo_points >= 1200 AND player_rankings.elo_points < 1300)
        OR (r.code = 'I+' AND player_rankings.elo_points >= 1300 AND player_rankings.elo_points < 1400)
        OR (r.code = 'H' AND player_rankings.elo_points >= 1400 AND player_rankings.elo_points < 1500)
        OR (r.code = 'H+' AND player_rankings.elo_points >= 1500 AND player_rankings.elo_points < 1600)
        OR (r.code = 'G' AND player_rankings.elo_points >= 1600 AND player_rankings.elo_points < 1700)
        OR (r.code = 'G+' AND player_rankings.elo_points >= 1700 AND player_rankings.elo_points < 1800)
        OR (r.code = 'F' AND player_rankings.elo_points >= 1800 AND player_rankings.elo_points < 1900)
        OR (r.code = 'F+' AND player_rankings.elo_points >= 1900 AND player_rankings.elo_points < 2000)
        OR (r.code = 'E' AND player_rankings.elo_points >= 2000 AND player_rankings.elo_points < 2100)
        OR (r.code = 'E+' AND player_rankings.elo_points >= 2100)
   );

-- Bước 3: Chuẩn hóa ELO points tối thiểu cho những ai có ELO quá thấp so với rank
UPDATE player_rankings 
SET elo_points = r.elo_points_required,
    updated_at = now()
FROM ranks r
WHERE player_rankings.current_rank_id = r.id
  AND player_rankings.elo_points < r.elo_points_required;

-- Bước 4: Thêm columns để track promotion eligibility
ALTER TABLE player_rankings 
ADD COLUMN IF NOT EXISTS last_promotion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_streak INTEGER DEFAULT 0;

-- Bước 5: Tính toán losses từ wins và total_matches
UPDATE player_rankings 
SET losses = GREATEST(0, total_matches - wins)
WHERE losses IS NULL OR losses = 0;

-- Bước 6: Cập nhật promotion eligibility
UPDATE player_rankings 
SET promotion_eligible = (
  total_matches >= 4 AND 
  (last_promotion_date IS NULL OR last_promotion_date < now() - INTERVAL '7 days')
),
updated_at = now();

-- Bước 7: Cập nhật SPA points cho những ai chưa có
UPDATE player_rankings 
SET spa_points = GREATEST(50, spa_points)
WHERE spa_points IS NULL OR spa_points < 50;

-- Bước 8: Log migration kết quả
INSERT INTO system_logs (log_type, message, metadata) 
VALUES (
  'elo_migration_v2',
  'Successfully migrated ELO system to new rank structure K-E+ with proper rank assignments',
  jsonb_build_object(
    'ranks_updated', (SELECT COUNT(*) FROM ranks WHERE elo_points_required >= 1000),
    'players_assigned_ranks', (SELECT COUNT(*) FROM player_rankings WHERE current_rank_id IS NOT NULL),
    'players_promotion_eligible', (SELECT COUNT(*) FROM player_rankings WHERE promotion_eligible = true),
    'migration_date', now(),
    'version', '2.0'
  )
);