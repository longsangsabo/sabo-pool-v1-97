-- Create admin user function
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT 'System Admin',
  p_phone TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result jsonb;
BEGIN
  -- Generate a UUID for the user
  v_user_id := gen_random_uuid();
  
  -- Insert into profiles table directly (simulating admin creation)
  INSERT INTO public.profiles (
    id,
    user_id, 
    full_name,
    display_name,
    email,
    phone,
    role,
    is_admin,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    p_full_name,
    'Admin',
    p_email,
    p_phone,
    'admin',
    true,
    true,
    now(),
    now()
  );
  
  -- Create wallet for admin
  INSERT INTO public.wallets (
    user_id,
    balance,
    points_balance,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    0,
    1000, -- Give admin some SPA points
    'active',
    now(),
    now()
  );
  
  -- Create player ranking
  INSERT INTO public.player_rankings (
    player_id,
    elo_points,
    elo,
    spa_points,
    total_matches,
    wins,
    losses,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    1500, -- High ELO for admin
    1500,
    1000,
    0,
    0,
    0,
    now(),
    now()
  );
  
  -- Create notification preferences
  INSERT INTO public.notification_preferences (
    user_id,
    in_app,
    email,
    push_notification,
    tournament_level,
    challenge_level,
    match_level,
    ranking_level,
    social_level
  ) VALUES (
    v_user_id,
    true,
    true,
    true,
    'high',
    'high',
    'high',
    'high',
    'medium'
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'message', 'Admin user profile created successfully. Please complete registration in Supabase Auth.',
    'next_steps', 'Go to Supabase Auth dashboard to create the actual auth user with this email and password.'
  );
  
  RETURN v_result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'message', 'Failed to create admin user profile'
  );
END;
$$;

-- Execute the function to create admin user
SELECT create_admin_user('admin@sabo.com', 'Acookingoil123@', 'System Administrator', '0961167717');