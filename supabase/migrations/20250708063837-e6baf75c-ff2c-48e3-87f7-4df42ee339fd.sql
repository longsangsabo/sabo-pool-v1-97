-- Create demo user seeding function with 32 pre-defined users
CREATE OR REPLACE FUNCTION seed_demo_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_users jsonb[];
  user_data jsonb;
  result jsonb;
  created_count INTEGER := 0;
BEGIN
  -- Define 32 demo users with full profiles and varied skill levels
  demo_users := ARRAY[
    '{"id": "demo-user-001", "full_name": "Nguyễn Văn An", "display_name": "An Pro", "phone": "0901234001", "skill_level": "advanced", "elo": 1250}',
    '{"id": "demo-user-002", "full_name": "Trần Thị Bình", "display_name": "Bình Master", "phone": "0901234002", "skill_level": "expert", "elo": 1300}',
    '{"id": "demo-user-003", "full_name": "Lê Hoàng Cường", "display_name": "Cường Shark", "phone": "0901234003", "skill_level": "advanced", "elo": 1200}',
    '{"id": "demo-user-004", "full_name": "Phạm Thị Dung", "display_name": "Dung Elite", "phone": "0901234004", "skill_level": "expert", "elo": 1400}',
    '{"id": "demo-user-005", "full_name": "Hoàng Văn Em", "display_name": "Em Speed", "phone": "0901234005", "skill_level": "intermediate", "elo": 1100}',
    '{"id": "demo-user-006", "full_name": "Vũ Thị Phương", "display_name": "Phương Ace", "phone": "0901234006", "skill_level": "advanced", "elo": 1280}',
    '{"id": "demo-user-007", "full_name": "Đặng Hoàng Giang", "display_name": "Giang Storm", "phone": "0901234007", "skill_level": "intermediate", "elo": 1050}',
    '{"id": "demo-user-008", "full_name": "Bùi Thị Hà", "display_name": "Hà Lightning", "phone": "0901234008", "skill_level": "expert", "elo": 1350}',
    '{"id": "demo-user-009", "full_name": "Ngô Văn Inh", "display_name": "Inh Precision", "phone": "0901234009", "skill_level": "advanced", "elo": 1220}',
    '{"id": "demo-user-010", "full_name": "Lý Thị Kỳ", "display_name": "Kỳ Magic", "phone": "0901234010", "skill_level": "intermediate", "elo": 1080}',
    '{"id": "demo-user-011", "full_name": "Phan Văn Long", "display_name": "Long Thunder", "phone": "0901234011", "skill_level": "expert", "elo": 1420}',
    '{"id": "demo-user-012", "full_name": "Võ Thị Mai", "display_name": "Mai Fire", "phone": "0901234012", "skill_level": "advanced", "elo": 1260}',
    '{"id": "demo-user-013", "full_name": "Đinh Hoàng Nam", "display_name": "Nam Power", "phone": "0901234013", "skill_level": "intermediate", "elo": 1020}',
    '{"id": "demo-user-014", "full_name": "Trương Thị Oanh", "display_name": "Oanh Swift", "phone": "0901234014", "skill_level": "advanced", "elo": 1290}',
    '{"id": "demo-user-015", "full_name": "Lại Văn Phú", "display_name": "Phú Force", "phone": "0901234015", "skill_level": "expert", "elo": 1380}',
    '{"id": "demo-user-016", "full_name": "Hồ Thị Quỳnh", "display_name": "Quỳnh Star", "phone": "0901234016", "skill_level": "intermediate", "elo": 1040}',
    '{"id": "demo-user-017", "full_name": "Châu Văn Rồng", "display_name": "Rồng Dragon", "phone": "0901234017", "skill_level": "expert", "elo": 1450}',
    '{"id": "demo-user-018", "full_name": "Đỗ Thị Sương", "display_name": "Sương Ice", "phone": "0901234018", "skill_level": "advanced", "elo": 1240}',
    '{"id": "demo-user-019", "full_name": "Huỳnh Văn Tâm", "display_name": "Tâm Focus", "phone": "0901234019", "skill_level": "intermediate", "elo": 1060}',
    '{"id": "demo-user-020", "full_name": "Cao Thị Uyên", "display_name": "Uyên Grace", "phone": "0901234020", "skill_level": "advanced", "elo": 1270}',
    '{"id": "demo-user-021", "full_name": "Mã Văn Vũ", "display_name": "Vũ Wind", "phone": "0901234021", "skill_level": "expert", "elo": 1390}',
    '{"id": "demo-user-022", "full_name": "Tô Thị Xuân", "display_name": "Xuân Bloom", "phone": "0901234022", "skill_level": "intermediate", "elo": 1090}',
    '{"id": "demo-user-023", "full_name": "Lương Văn Yến", "display_name": "Yến Eagle", "phone": "0901234023", "skill_level": "advanced", "elo": 1230}',
    '{"id": "demo-user-024", "full_name": "Kiều Thị Zoan", "display_name": "Zoan Zen", "phone": "0901234024", "skill_level": "expert", "elo": 1410}',
    '{"id": "demo-user-025", "full_name": "Thái Văn Bảo", "display_name": "Bảo Gem", "phone": "0901234025", "skill_level": "intermediate", "elo": 1070}',
    '{"id": "demo-user-026", "full_name": "Ninh Thị Cẩm", "display_name": "Cẩm Pearl", "phone": "0901234026", "skill_level": "advanced", "elo": 1250}',
    '{"id": "demo-user-027", "full_name": "Ứng Văn Đức", "display_name": "Đức Noble", "phone": "0901234027", "skill_level": "expert", "elo": 1370}',
    '{"id": "demo-user-028", "full_name": "Từ Thị Én", "display_name": "Én Swift", "phone": "0901234028", "skill_level": "intermediate", "elo": 1030}',
    '{"id": "demo-user-029", "full_name": "Âu Văn Phong", "display_name": "Phong Breeze", "phone": "0901234029", "skill_level": "advanced", "elo": 1210}',
    '{"id": "demo-user-030", "full_name": "Ô Thị Gấm", "display_name": "Gấm Silk", "phone": "0901234030", "skill_level": "expert", "elo": 1430}',
    '{"id": "demo-user-031", "full_name": "Ư Văn Hiền", "display_name": "Hiền Wise", "phone": "0901234031", "skill_level": "intermediate", "elo": 1010}',
    '{"id": "demo-user-032", "full_name": "Ỳ Thị Ình", "display_name": "Ình Calm", "phone": "0901234032", "skill_level": "advanced", "elo": 1190}'
  ]::jsonb[];
  
  -- Insert demo users if not exists
  FOR i IN 1..array_length(demo_users, 1) LOOP
    user_data := demo_users[i];
    
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = (user_data->>'id')::UUID) THEN
      INSERT INTO profiles (
        id, user_id, full_name, display_name, phone, skill_level, 
        role, is_demo_user, email_verified, created_at, city, district
      ) VALUES (
        (user_data->>'id')::UUID,
        (user_data->>'id')::UUID,
        user_data->>'full_name',
        user_data->>'display_name', 
        user_data->>'phone',
        user_data->>'skill_level',
        'player',
        true, -- Mark as demo user
        true,
        now(),
        'Hồ Chí Minh',
        'Quận 1'
      );
      
      created_count := created_count + 1;
    END IF;
    
    -- Create wallets for demo users (skip if exists)
    INSERT INTO wallets (
      user_id, balance, points_balance, status
    ) VALUES (
      (user_data->>'id')::UUID, 0, 100, 'active'
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Create player rankings (skip if exists)
    INSERT INTO player_rankings (
      player_id, elo, spa_points, total_matches, wins, losses, win_streak
    ) VALUES (
      (user_data->>'id')::UUID,
      (user_data->>'elo')::INTEGER,
      FLOOR(RANDOM() * 100) + 50, -- 50-150 SPA points
      FLOOR(RANDOM() * 30) + 5,   -- 5-35 total matches
      FLOOR(RANDOM() * 20) + 2,   -- 2-22 wins
      FLOOR(RANDOM() * 15) + 1,   -- 1-16 losses
      FLOOR(RANDOM() * 5)         -- 0-5 win streak
    ) ON CONFLICT (player_id) DO NOTHING;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'users_created', created_count,
    'total_demo_users', 32,
    'message', '32 demo users ready for tournament testing'
  );
  
  RETURN result;
END;
$$;

-- Create demo user management table
CREATE TABLE IF NOT EXISTS demo_user_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  currently_used_in TEXT, -- tournament_id if in use
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Function to get available demo users
CREATE OR REPLACE FUNCTION get_available_demo_users(needed_count INTEGER)
RETURNS TABLE(
  user_id UUID, 
  full_name TEXT, 
  display_name TEXT, 
  skill_level TEXT, 
  elo INTEGER,
  spa_points INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.display_name, 
    p.skill_level, 
    COALESCE(pr.elo, 1000),
    COALESCE(pr.spa_points, 50)
  FROM profiles p
  LEFT JOIN demo_user_pool dup ON dup.user_id = p.id
  LEFT JOIN player_rankings pr ON pr.player_id = p.id
  WHERE p.is_demo_user = true
  AND (dup.is_available = true OR dup.is_available IS NULL)
  ORDER BY COALESCE(pr.elo, 1000) DESC
  LIMIT needed_count;
END;
$$;

-- Function to reserve demo users for tournament
CREATE OR REPLACE FUNCTION reserve_demo_users(
  user_ids UUID[],
  tournament_id TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark users as in use
  INSERT INTO demo_user_pool (user_id, is_available, currently_used_in, last_used_at)
  SELECT unnest(user_ids), false, tournament_id, now()
  ON CONFLICT (user_id) DO UPDATE SET
    is_available = false,
    currently_used_in = tournament_id,
    last_used_at = now();
  
  RETURN jsonb_build_object(
    'success', true, 
    'reserved_count', array_length(user_ids, 1),
    'tournament_id', tournament_id
  );
END;
$$;

-- Function to release demo users
CREATE OR REPLACE FUNCTION release_demo_users(tournament_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  released_count INTEGER;
BEGIN
  -- Release users from specific tournament or all if 'all' is passed
  IF tournament_id = 'all' THEN
    UPDATE demo_user_pool 
    SET is_available = true, currently_used_in = null;
    GET DIAGNOSTICS released_count = ROW_COUNT;
  ELSE
    UPDATE demo_user_pool 
    SET is_available = true, currently_used_in = null
    WHERE currently_used_in = tournament_id;
    GET DIAGNOSTICS released_count = ROW_COUNT;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'released_count', released_count,
    'message', 'Demo users released and available for reuse'
  );
END;
$$;

-- Function to get demo user statistics
CREATE OR REPLACE FUNCTION get_demo_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_demo_users INTEGER;
  available_users INTEGER;
  in_use_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_demo_users
  FROM profiles WHERE is_demo_user = true;
  
  SELECT COUNT(*) INTO available_users
  FROM profiles p
  LEFT JOIN demo_user_pool dup ON dup.user_id = p.id
  WHERE p.is_demo_user = true
  AND (dup.is_available = true OR dup.is_available IS NULL);
  
  in_use_users := total_demo_users - available_users;
  
  RETURN jsonb_build_object(
    'total_demo_users', total_demo_users,
    'available_users', available_users,
    'in_use_users', in_use_users,
    'usage_percentage', ROUND((in_use_users::NUMERIC / NULLIF(total_demo_users, 0) * 100), 2)
  );
END;
$$;