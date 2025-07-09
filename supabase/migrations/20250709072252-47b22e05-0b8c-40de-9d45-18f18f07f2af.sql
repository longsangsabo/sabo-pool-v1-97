-- Migration đơn giản: Chỉ cập nhật ranks table trước
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