-- Disable triggers temporarily
ALTER TABLE profiles DISABLE TRIGGER ALL;
ALTER TABLE wallets DISABLE TRIGGER ALL;
ALTER TABLE player_rankings DISABLE TRIGGER ALL;

-- Delete all data completely
DELETE FROM wallets;
DELETE FROM player_rankings;  
DELETE FROM profiles;

-- Insert 32 demo users
DO $$
DECLARE
  user_uuid UUID;
BEGIN
  FOR i IN 1..32 LOOP
    user_uuid := gen_random_uuid();
    
    INSERT INTO public.profiles (
      id, user_id, full_name, display_name, phone, skill_level, elo,
      role, is_demo_user, email_verified, created_at, city, district
    ) VALUES (
      user_uuid, user_uuid, 'Demo User ' || i, 'Player ' || i, 
      '090123400' || LPAD(i::TEXT, 2, '0'),
      CASE WHEN i % 3 = 0 THEN 'expert' WHEN i % 2 = 0 THEN 'advanced' ELSE 'intermediate' END,
      1000 + (i * 10), 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1'
    );
    
    INSERT INTO public.wallets (user_id, balance, points_balance, status) 
    VALUES (user_uuid, 0, 100, 'active');
    
    INSERT INTO public.player_rankings (player_id, elo_points, elo, spa_points, total_matches, wins, losses, win_streak) 
    VALUES (user_uuid, 1000 + (i * 10), 1000 + (i * 10), 50 + (i * 2), i, FLOOR(i * 0.6), FLOOR(i * 0.4), CASE WHEN i % 5 = 0 THEN i/5 ELSE 0 END);
  END LOOP;
END;
$$;

-- Re-enable triggers
ALTER TABLE profiles ENABLE TRIGGER ALL;
ALTER TABLE wallets ENABLE TRIGGER ALL; 
ALTER TABLE player_rankings ENABLE TRIGGER ALL;