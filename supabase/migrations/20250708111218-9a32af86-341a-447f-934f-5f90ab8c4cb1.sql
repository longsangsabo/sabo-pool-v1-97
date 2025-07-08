-- Create demo users and tournament registration data - simplified version

-- First, create demo users if they don't exist
DO $$
DECLARE
    user_uuid uuid;
    demo_users jsonb[] := ARRAY[
        '{"full_name": "Nguyễn Văn An", "display_name": "An Pro", "phone": "0901234001", "skill_level": "advanced"}',
        '{"full_name": "Trần Thị Bình", "display_name": "Bình Master", "phone": "0901234002", "skill_level": "pro"}',
        '{"full_name": "Lê Hoàng Cường", "display_name": "Cường Shark", "phone": "0901234003", "skill_level": "advanced"}',
        '{"full_name": "Phạm Thị Dung", "display_name": "Dung Elite", "phone": "0901234004", "skill_level": "pro"}',
        '{"full_name": "Hoàng Văn Em", "display_name": "Em Speed", "phone": "0901234005", "skill_level": "intermediate"}',
        '{"full_name": "Vũ Thị Phương", "display_name": "Phương Ace", "phone": "0901234006", "skill_level": "advanced"}',
        '{"full_name": "Đặng Hoàng Giang", "display_name": "Giang Storm", "phone": "0901234007", "skill_level": "intermediate"}',
        '{"full_name": "Bùi Thị Hà", "display_name": "Hà Lightning", "phone": "0901234008", "skill_level": "pro"}',
        '{"full_name": "Ngô Văn Inh", "display_name": "Inh Precision", "phone": "0901234009", "skill_level": "advanced"}',
        '{"full_name": "Lý Thị Kỳ", "display_name": "Kỳ Magic", "phone": "0901234010", "skill_level": "intermediate"}',
        '{"full_name": "Phan Văn Long", "display_name": "Long Thunder", "phone": "0901234011", "skill_level": "pro"}',
        '{"full_name": "Võ Thị Mai", "display_name": "Mai Fire", "phone": "0901234012", "skill_level": "advanced"}',
        '{"full_name": "Đinh Hoàng Nam", "display_name": "Nam Power", "phone": "0901234013", "skill_level": "intermediate"}',
        '{"full_name": "Trương Thị Oanh", "display_name": "Oanh Swift", "phone": "0901234014", "skill_level": "advanced"}',
        '{"full_name": "Lại Văn Phú", "display_name": "Phú Force", "phone": "0901234015", "skill_level": "pro"}',
        '{"full_name": "Hồ Thị Quỳnh", "display_name": "Quỳnh Star", "phone": "0901234016", "skill_level": "intermediate"}',
        '{"full_name": "Châu Văn Rồng", "display_name": "Rồng Dragon", "phone": "0901234017", "skill_level": "pro"}'
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
                id, user_id, full_name, display_name, phone, skill_level,
                role, is_demo_user, email_verified, created_at, city, district
            ) VALUES (
                user_uuid,
                user_uuid,
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
    
END $$;