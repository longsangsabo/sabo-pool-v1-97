-- Fix the seed_demo_users function with proper error handling
CREATE OR REPLACE FUNCTION public.seed_demo_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_users jsonb[];
  user_data jsonb;
  result jsonb;
  created_count INTEGER := 0;
  user_uuid UUID;
BEGIN
  -- Define 32 demo users with full profiles and varied skill levels
  demo_users := ARRAY[
    '{"full_name": "Nguyễn Văn An", "display_name": "An Pro", "phone": "0901234001", "skill_level": "advanced", "elo": 1250}',
    '{"full_name": "Trần Thị Bình", "display_name": "Bình Master", "phone": "0901234002", "skill_level": "expert", "elo": 1300}',
    '{"full_name": "Lê Hoàng Cường", "display_name": "Cường Shark", "phone": "0901234003", "skill_level": "advanced", "elo": 1200}',
    '{"full_name": "Phạm Thị Dung", "display_name": "Dung Elite", "phone": "0901234004", "skill_level": "expert", "elo": 1400}',
    '{"full_name": "Hoàng Văn Em", "display_name": "Em Speed", "phone": "0901234005", "skill_level": "intermediate", "elo": 1100}',
    '{"full_name": "Vũ Thị Phương", "display_name": "Phương Ace", "phone": "0901234006", "skill_level": "advanced", "elo": 1280}',
    '{"full_name": "Đặng Hoàng Giang", "display_name": "Giang Storm", "phone": "0901234007", "skill_level": "intermediate", "elo": 1050}',
    '{"full_name": "Bùi Thị Hà", "display_name": "Hà Lightning", "phone": "0901234008", "skill_level": "expert", "elo": 1350}',
    '{"full_name": "Ngô Văn Inh", "display_name": "Inh Precision", "phone": "0901234009", "skill_level": "advanced", "elo": 1220}',
    '{"full_name": "Lý Thị Kỳ", "display_name": "Kỳ Magic", "phone": "0901234010", "skill_level": "intermediate", "elo": 1080}',
    '{"full_name": "Phan Văn Long", "display_name": "Long Thunder", "phone": "0901234011", "skill_level": "expert", "elo": 1420}',
    '{"full_name": "Võ Thị Mai", "display_name": "Mai Fire", "phone": "0901234012", "skill_level": "advanced", "elo": 1260}',
    '{"full_name": "Đinh Hoàng Nam", "display_name": "Nam Power", "phone": "0901234013", "skill_level": "intermediate", "elo": 1020}',
    '{"full_name": "Trương Thị Oanh", "display_name": "Oanh Swift", "phone": "0901234014", "skill_level": "advanced", "elo": 1290}',
    '{"full_name": "Lại Văn Phú", "display_name": "Phú Force", "phone": "0901234015", "skill_level": "expert", "elo": 1380}',
    '{"full_name": "Hồ Thị Quỳnh", "display_name": "Quỳnh Star", "phone": "0901234016", "skill_level": "intermediate", "elo": 1040}',
    '{"full_name": "Châu Văn Rồng", "display_name": "Rồng Dragon", "phone": "0901234017", "skill_level": "expert", "elo": 1450}',
    '{"full_name": "Đỗ Thị Sương", "display_name": "Sương Ice", "phone": "0901234018", "skill_level": "advanced", "elo": 1240}',
    '{"full_name": "Huỳnh Văn Tâm", "display_name": "Tâm Focus", "phone": "0901234019", "skill_level": "intermediate", "elo": 1060}',
    '{"full_name": "Cao Thị Uyên", "display_name": "Uyên Grace", "phone": "0901234020", "skill_level": "advanced", "elo": 1270}',
    '{"full_name": "Mã Văn Vũ", "display_name": "Vũ Wind", "phone": "0901234021", "skill_level": "expert", "elo": 1390}',
    '{"full_name": "Tô Thị Xuân", "display_name": "Xuân Bloom", "phone": "0901234022", "skill_level": "intermediate", "elo": 1090}',
    '{"full_name": "Lương Văn Yến", "display_name": "Yến Eagle", "phone": "0901234023", "skill_level": "advanced", "elo": 1230}',
    '{"full_name": "Kiều Thị Zoan", "display_name": "Zoan Zen", "phone": "0901234024", "skill_level": "expert", "elo": 1410}',
    '{"full_name": "Thái Văn Bảo", "display_name": "Bảo Gem", "phone": "0901234025", "skill_level": "intermediate", "elo": 1070}',
    '{"full_name": "Ninh Thị Cẩm", "display_name": "Cẩm Pearl", "phone": "0901234026", "skill_level": "advanced", "elo": 1250}',
    '{"full_name": "Ứng Văn Đức", "display_name": "Đức Noble", "phone": "0901234027", "skill_level": "expert", "elo": 1370}',
    '{"full_name": "Từ Thị Én", "display_name": "Én Swift", "phone": "0901234028", "skill_level": "intermediate", "elo": 1030}',
    '{"full_name": "Âu Văn Phong", "display_name": "Phong Breeze", "phone": "0901234029", "skill_level": "advanced", "elo": 1210}',
    '{"full_name": "Ô Thị Gấm", "display_name": "Gấm Silk", "phone": "0901234030", "skill_level": "expert", "elo": 1430}',
    '{"full_name": "Ư Văn Hiền", "display_name": "Hiền Wise", "phone": "0901234031", "skill_level": "intermediate", "elo": 1010}',
    '{"full_name": "Ỳ Thị Ình", "display_name": "Ình Calm", "phone": "0901234032", "skill_level": "advanced", "elo": 1190}'
  ]::jsonb[];
  
  -- Insert demo users if not exists
  FOR i IN 1..array_length(demo_users, 1) LOOP
    BEGIN
      user_data := demo_users[i];
      user_uuid := gen_random_uuid();
      
      -- Check if user already exists by phone
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE phone = (user_data->>'phone')) THEN
        -- Insert profile
        INSERT INTO public.profiles (
          id, user_id, full_name, display_name, phone, skill_level, elo,
          role, is_demo_user, email_verified, created_at, city, district
        ) VALUES (
          user_uuid,
          user_uuid,
          user_data->>'full_name',
          user_data->>'display_name', 
          user_data->>'phone',
          user_data->>'skill_level',
          (user_data->>'elo')::INTEGER,
          'player',
          true, -- Mark as demo user
          true,
          now(),
          'Hồ Chí Minh',
          'Quận 1'
        );
        
        -- Create wallet for demo user
        INSERT INTO public.wallets (
          user_id, balance, points_balance, status
        ) VALUES (
          user_uuid, 0, 100, 'active'
        ) ON CONFLICT (user_id) DO NOTHING;
        
        -- Create player ranking
        INSERT INTO public.player_rankings (
          player_id, elo_points, elo, spa_points, total_matches, wins, losses, win_streak
        ) VALUES (
          user_uuid,
          (user_data->>'elo')::INTEGER,
          (user_data->>'elo')::INTEGER,
          FLOOR(RANDOM() * 100) + 50, -- 50-150 SPA points
          FLOOR(RANDOM() * 30) + 5,   -- 5-35 total matches
          FLOOR(RANDOM() * 20) + 2,   -- 2-22 wins
          FLOOR(RANDOM() * 15) + 1,   -- 1-16 losses
          FLOOR(RANDOM() * 5)         -- 0-5 win streak
        ) ON CONFLICT (player_id) DO NOTHING;
        
        created_count := created_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue with next user
        RAISE NOTICE 'Error creating demo user %: %', user_data->>'full_name', SQLERRM;
    END;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'users_created', created_count,
    'total_demo_users', 32,
    'message', format('%s demo users created successfully. Total: 32', created_count)
  );
  
  RETURN result;
END;
$$;