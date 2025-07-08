-- Delete existing demo user with phone 0901999999 (test user)
DELETE FROM profiles WHERE phone = '0901999999' AND is_demo_user = true;

-- Clean up related data
DELETE FROM wallets WHERE user_id IN (
  SELECT user_id FROM profiles WHERE phone = '0901999999' AND is_demo_user = true
);
DELETE FROM player_rankings WHERE player_id IN (
  SELECT user_id FROM profiles WHERE phone = '0901999999' AND is_demo_user = true  
);

-- Now run the seed function
SELECT public.seed_demo_users();