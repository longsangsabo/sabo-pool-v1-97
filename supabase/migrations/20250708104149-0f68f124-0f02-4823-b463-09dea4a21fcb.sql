-- Tạo test data với 17 players đăng ký tournament
-- Đầu tiên tạo demo players nếu chưa có đủ
DO $$ 
DECLARE
    i INTEGER;
    player_uuid UUID;
    registration_uuid UUID;
    tournament_uuid UUID := '33333333-3333-3333-3333-333333333333';
BEGIN
    -- Tạo 17 demo players
    FOR i IN 1..17 LOOP
        player_uuid := gen_random_uuid();
        
        -- Tạo profile
        INSERT INTO public.profiles (
            id, user_id, full_name, display_name, phone, skill_level,
            role, is_demo_user, email_verified, created_at, city, district
        ) VALUES (
            player_uuid,
            player_uuid,
            'Test Player ' || i,
            'Player' || i,
            '090123400' || LPAD(i::text, 2, '0'),
            CASE 
                WHEN i <= 5 THEN 'expert'
                WHEN i <= 12 THEN 'advanced' 
                ELSE 'intermediate'
            END,
            'player',
            true,
            true,
            now() - INTERVAL '1 hour' * i, -- Đăng ký cách nhau 1 tiếng
            'Hồ Chí Minh',
            'Quận 1'
        ) ON CONFLICT (phone) DO NOTHING;
        
        -- Tạo player ranking
        INSERT INTO public.player_rankings (
            player_id, elo_points, elo, spa_points, total_matches, wins, losses
        ) VALUES (
            player_uuid,
            1000 + (20 - i) * 50, -- ELO giảm dần
            1000 + (20 - i) * 50,
            50 + i * 10,
            10 + i,
            5 + i,
            3
        ) ON CONFLICT (player_id) DO NOTHING;
        
        -- Tạo tournament registration
        registration_uuid := gen_random_uuid();
        INSERT INTO public.tournament_registrations (
            id,
            tournament_id,
            player_id,
            registration_status,
            payment_status,
            status,
            registration_date,
            payment_confirmed_at,
            created_at,
            updated_at
        ) VALUES (
            registration_uuid,
            tournament_uuid,
            player_uuid,
            'pending',
            'pending',
            'pending',
            now() - INTERVAL '1 hour' * i + INTERVAL '30 minutes', -- Thời gian đăng ký khác nhau
            NULL,
            now() - INTERVAL '1 hour' * i,
            now() - INTERVAL '1 hour' * i
        ) ON CONFLICT (tournament_id, player_id) DO NOTHING;
        
    END LOOP;
    
    -- Mô phỏng việc confirm payment cho 17 players theo thứ tự thời gian
    -- Players 1-8: Thanh toán sớm (2 tiếng trước)
    UPDATE public.tournament_registrations 
    SET 
        payment_status = 'paid',
        registration_status = 'confirmed',
        status = 'confirmed',
        payment_confirmed_at = now() - INTERVAL '2 hours',
        payment_method = 'cash',
        updated_at = now() - INTERVAL '2 hours'
    WHERE tournament_id = tournament_uuid
    AND player_id IN (
        SELECT p.user_id 
        FROM public.profiles p
        WHERE p.full_name LIKE 'Test Player %'
        AND CAST(SUBSTRING(p.full_name FROM 'Test Player ([0-9]+)') AS INTEGER) BETWEEN 1 AND 8
    );
    
    -- Players 9-16: Thanh toán vừa (1 tiếng trước) 
    UPDATE public.tournament_registrations 
    SET 
        payment_status = 'paid',
        registration_status = 'confirmed', 
        status = 'confirmed',
        payment_confirmed_at = now() - INTERVAL '1 hour',
        payment_method = 'bank_transfer',
        updated_at = now() - INTERVAL '1 hour'
    WHERE tournament_id = tournament_uuid
    AND player_id IN (
        SELECT p.user_id 
        FROM public.profiles p
        WHERE p.full_name LIKE 'Test Player %'
        AND CAST(SUBSTRING(p.full_name FROM 'Test Player ([0-9]+)') AS INTEGER) BETWEEN 9 AND 16
    );
    
    -- Player 17: Thanh toán muộn (30 phút trước) - sẽ bị waitlist
    UPDATE public.tournament_registrations 
    SET 
        payment_status = 'paid',
        registration_status = 'waitlisted',
        status = 'waitlisted', 
        payment_confirmed_at = now() - INTERVAL '30 minutes',
        payment_method = 'momo',
        updated_at = now() - INTERVAL '30 minutes'
    WHERE tournament_id = tournament_uuid
    AND player_id IN (
        SELECT p.user_id 
        FROM public.profiles p
        WHERE p.full_name LIKE 'Test Player %'
        AND CAST(SUBSTRING(p.full_name FROM 'Test Player ([0-9]+)') AS INTEGER) = 17
    );
    
    -- Cập nhật số lượng participants hiện tại
    UPDATE public.tournaments 
    SET 
        current_participants = 16,
        status = 'registration_closed',
        updated_at = now()
    WHERE id = tournament_uuid;
    
    RAISE NOTICE 'Created 17 test players with payment simulation';
END $$;