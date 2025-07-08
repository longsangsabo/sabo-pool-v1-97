-- Create simple function to test demo user creation
CREATE OR REPLACE FUNCTION create_test_demo_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  user_uuid := gen_random_uuid();
  
  INSERT INTO public.profiles (
    id, user_id, full_name, display_name, phone, skill_level, elo,
    role, is_demo_user, email_verified, created_at, city, district
  ) VALUES (
    user_uuid,
    user_uuid,
    'Test Demo User',
    'Demo Test',
    '0901999999',
    'advanced',
    1250,
    'player',
    true,
    true,
    now(),
    'Hồ Chí Minh',
    'Quận 1'
  );
  
  RETURN jsonb_build_object('success', true, 'user_id', user_uuid);
END;
$$;