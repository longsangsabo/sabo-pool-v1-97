-- Use valid skill levels and fix constraint issue
INSERT INTO public.profiles (
  id, user_id, full_name, display_name, phone, skill_level, elo,
  role, is_demo_user, email_verified, created_at, city, district
) 
SELECT 
  gen_random_uuid(), gen_random_uuid(), 'Demo User ' || i, 'Player ' || i, 
  '090999990' || LPAD(i::TEXT, 2, '0'),
  CASE WHEN i % 3 = 0 THEN 'advanced' WHEN i % 2 = 0 THEN 'intermediate' ELSE 'beginner' END,
  1000 + (i * 10), 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1'
FROM generate_series(1, 32) AS i;