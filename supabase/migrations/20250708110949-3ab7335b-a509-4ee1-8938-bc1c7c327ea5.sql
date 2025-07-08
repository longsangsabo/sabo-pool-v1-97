-- Create demo users and tournament registration data

-- First, create demo users if they don't exist
DO $$
DECLARE
    user_uuid uuid;
    demo_users jsonb[] := ARRAY[
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
        '{"full_name": "Châu Văn Rồng", "display_name": "Rồng Dragon", "phone": "0901234017", "skill_level": "expert", "elo": 1450}'
    ]::jsonb[];
    user_data jsonb;
    created_user_ids uuid[] := ARRAY[]::uuid[];
    tournament_uuid uuid := '4a63b34f-7de0-40c6-9e55-33361d236a09';
    counter integer := 1;
BEGIN
    -- Create demo users
    FOR i IN 1..array_length(demo_users, 1) LOOP
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
            
            created_user_ids := created_user_ids || user_uuid;
        ELSE
            -- Get existing user ID
            SELECT id INTO user_uuid FROM public.profiles WHERE phone = (user_data->>'phone');
            created_user_ids := created_user_ids || user_uuid;
        END IF;
    END LOOP;
    
    -- Clear existing registrations for this tournament
    DELETE FROM tournament_registrations WHERE tournament_id = tournament_uuid;
    
    -- Insert registration for each demo user
    FOREACH user_uuid IN ARRAY created_user_ids
    LOOP
        INSERT INTO tournament_registrations (
            tournament_id,
            player_id,
            registration_status,
            payment_status,
            status,
            payment_method,
            admin_notes,
            registration_date,
            created_at,
            updated_at
        ) VALUES (
            tournament_uuid,
            user_uuid,
            'pending',      
            'pending',      
            'registered',   
            'cash',
            'Đã đóng tiền mặt tại CLB, chờ xác nhận',
            now() - (counter || ' hours')::interval,
            now() - (counter || ' hours')::interval,
            now()
        );
        
        counter := counter + 1;
    END LOOP;
    
    -- Update tournament current_participants
    UPDATE tournaments 
    SET current_participants = (
        SELECT COUNT(*) FROM tournament_registrations 
        WHERE tournament_id = tournament_uuid
    )
    WHERE id = tournament_uuid;
    
    -- Create player rankings for demo users
    FOREACH user_uuid IN ARRAY created_user_ids
    LOOP
        INSERT INTO player_rankings (player_id, elo_points, elo, spa_points, total_matches, wins, losses, win_streak)
        VALUES (
            user_uuid,
            1000 + (RANDOM() * 500)::integer,
            1000 + (RANDOM() * 500)::integer,
            50 + (RANDOM() * 100)::integer,
            (RANDOM() * 20)::integer + 5,
            (RANDOM() * 15)::integer + 2,
            (RANDOM() * 10)::integer + 1,
            (RANDOM() * 3)::integer
        ) ON CONFLICT (player_id) DO NOTHING;
    END LOOP;
    
END $$;