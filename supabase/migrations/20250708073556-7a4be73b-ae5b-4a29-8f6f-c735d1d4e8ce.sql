-- Clean up all demo data first
DELETE FROM wallets WHERE user_id IN (
  SELECT user_id FROM profiles WHERE is_demo_user = true
);

DELETE FROM player_rankings WHERE player_id IN (
  SELECT user_id FROM profiles WHERE is_demo_user = true  
);

DELETE FROM profiles WHERE is_demo_user = true;

-- Now run the function to create 32 demo users
SELECT public.seed_demo_users_direct();