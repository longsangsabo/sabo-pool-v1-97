-- Create complete test data for tournament payment management with correct status values

-- First, let's ensure we have demo users in the correct tournament
-- Insert 17 demo players into the first tournament for testing
DO $$
DECLARE
    demo_user_ids uuid[];
    tournament_uuid uuid := '4a63b34f-7de0-40c6-9e55-33361d236a09';
    user_id uuid;
    counter integer := 1;
BEGIN
    -- Get first 17 demo users
    SELECT ARRAY(
        SELECT id FROM profiles 
        WHERE is_demo_user = true 
        ORDER BY created_at 
        LIMIT 17
    ) INTO demo_user_ids;
    
    -- Clear existing registrations for this tournament
    DELETE FROM tournament_registrations WHERE tournament_id = tournament_uuid;
    
    -- Insert registration for each demo user
    FOREACH user_id IN ARRAY demo_user_ids
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
            user_id,
            'pending',      -- registration_status: pending/confirmed/cancelled/withdrawn
            'pending',      -- payment_status: pending/paid/failed/refunded/cash_pending/processing/unpaid
            'registered',   -- status: registered/confirmed/checked_in/no_show/disqualified
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

-- Ensure demo users have player rankings
INSERT INTO player_rankings (player_id, elo_points, elo, spa_points, total_matches, wins, losses, win_streak)
SELECT 
    p.id,
    1000 + (RANDOM() * 500)::integer,
    1000 + (RANDOM() * 500)::integer,
    50 + (RANDOM() * 100)::integer,
    (RANDOM() * 20)::integer + 5,
    (RANDOM() * 15)::integer + 2,
    (RANDOM() * 10)::integer + 1,
    (RANDOM() * 3)::integer
FROM profiles p
WHERE p.is_demo_user = true
  AND p.id NOT IN (SELECT player_id FROM player_rankings WHERE player_id = p.id);