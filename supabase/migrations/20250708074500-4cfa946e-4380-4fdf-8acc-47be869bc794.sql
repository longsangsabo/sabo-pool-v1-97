-- Create wallets for demo users
INSERT INTO public.wallets (user_id, balance, points_balance, status)
SELECT user_id, 0, 100, 'active'
FROM profiles 
WHERE is_demo_user = true 
AND user_id NOT IN (SELECT user_id FROM wallets);

-- Create player rankings for demo users with correct numeric values
INSERT INTO public.player_rankings (
  player_id, elo_points, spa_points, total_matches, wins, 
  daily_challenges, tournament_wins, rank_points, 
  average_opponent_strength, performance_quality, club_verified
)
SELECT 
  user_id, 
  1000 + (ROW_NUMBER() OVER (ORDER BY created_at) * 10), 
  50 + (ROW_NUMBER() OVER (ORDER BY created_at) * 2),
  ROW_NUMBER() OVER (ORDER BY created_at),
  FLOOR((ROW_NUMBER() OVER (ORDER BY created_at)) * 0.6),
  ROW_NUMBER() OVER (ORDER BY created_at) % 10,
  CASE WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 10 = 0 THEN 1 ELSE 0 END,
  FLOOR(ROW_NUMBER() OVER (ORDER BY created_at) * 3.5),
  9.5,
  0.7,
  false
FROM profiles 
WHERE is_demo_user = true 
AND user_id NOT IN (SELECT player_id FROM player_rankings);