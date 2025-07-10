-- Clean up duplicate/incorrect SPA points for tournament "Hello"
-- First, remove all tournament SPA awards for this tournament
DELETE FROM spa_points_log 
WHERE source_id = '882b6a82-d21b-4750-a95d-5667f8928fcc' 
  AND source_type = 'tournament';

-- Reset player SPA points to remove the incorrect awards
-- Since players may have earned SPA from other sources, we need to recalculate properly
UPDATE player_rankings 
SET spa_points = (
  SELECT COALESCE(SUM(spl.points_earned), 0)
  FROM spa_points_log spl 
  WHERE spl.player_id = player_rankings.player_id
    AND spl.source_id != '882b6a82-d21b-4750-a95d-5667f8928fcc'
)
WHERE player_id IN (
  SELECT DISTINCT player_id 
  FROM tournament_registrations 
  WHERE tournament_id = '882b6a82-d21b-4750-a95d-5667f8928fcc'
);