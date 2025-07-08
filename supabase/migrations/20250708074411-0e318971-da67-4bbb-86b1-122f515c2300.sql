-- Create wallets for demo users
INSERT INTO public.wallets (user_id, balance, points_balance, status)
SELECT user_id, 0, 100, 'active'
FROM profiles 
WHERE is_demo_user = true 
AND user_id NOT IN (SELECT user_id FROM wallets);

-- Create player rankings for demo users (without elo column)
INSERT INTO public.player_rankings (player_id, elo_points, spa_points, total_matches, wins, losses, win_streak)
SELECT 
  user_id, 
  elo as elo_points, 
  50 + (ROW_NUMBER() OVER (ORDER BY created_at) * 2),
  ROW_NUMBER() OVER (ORDER BY created_at),
  FLOOR((ROW_NUMBER() OVER (ORDER BY created_at)) * 0.6),
  FLOOR((ROW_NUMBER() OVER (ORDER BY created_at)) * 0.4),
  CASE WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 5 = 0 THEN (ROW_NUMBER() OVER (ORDER BY created_at))/5 ELSE 0 END
FROM profiles 
WHERE is_demo_user = true 
AND user_id NOT IN (SELECT player_id FROM player_rankings);