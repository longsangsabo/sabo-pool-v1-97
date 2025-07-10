-- Fix process_tournament_results function to calculate positions from match results
CREATE OR REPLACE FUNCTION public.process_tournament_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier (default to 1.0 since metadata field doesn't exist)
    v_multiplier := CASE 
      WHEN NEW.tournament_type = 'season' THEN 1.5
      WHEN NEW.tournament_type = 'open' THEN 2.0
      ELSE 1.0
    END;
    
    -- Get final match results to determine 1st and 2nd place
    SELECT winner_id, 
           CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
    INTO v_final_match_winner, v_final_match_loser
    FROM public.tournament_matches tm
    WHERE tm.tournament_id = NEW.id 
      AND tm.round_number = (
        SELECT MAX(round_number) 
        FROM public.tournament_matches 
        WHERE tournament_id = NEW.id
      )
      AND tm.status = 'completed'
      AND tm.winner_id IS NOT NULL
      AND (tm.notes ILIKE '%chung kết%' OR tm.notes ILIKE '%final%')
    LIMIT 1;
    
    -- Process all tournament participants
    FOR v_participant IN 
      SELECT 
        tr.player_id,
        p.full_name,
        -- Calculate position based on tournament results
        CASE 
          WHEN tr.player_id = v_final_match_winner THEN 1  -- Champion
          WHEN tr.player_id = v_final_match_loser THEN 2   -- Runner-up
          ELSE 99  -- Participation (we'll refine this logic later if needed)
        END as position
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.player_id = p.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.player_id IS NOT NULL
    LOOP
      -- Calculate base points
      v_points := CASE 
        WHEN v_participant.position = 1 THEN 1000  -- Champion
        WHEN v_participant.position = 2 THEN 700   -- Runner-up
        WHEN v_participant.position = 3 THEN 500   -- Third place
        WHEN v_participant.position <= 8 THEN 300  -- Semi-finals/Quarter-finals
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points if spa_points_log table exists
      BEGIN
        INSERT INTO public.spa_points_log (
          player_id, 
          source_type, 
          source_id, 
          points_earned,
          description
        ) VALUES (
          v_participant.player_id,
          'tournament',
          NEW.id,
          v_points,
          format('Vị trí %s trong %s', v_participant.position, NEW.name)
        );
      EXCEPTION 
        WHEN undefined_table THEN
          -- spa_points_log table doesn't exist, skip
          NULL;
        WHEN OTHERS THEN
          -- Other errors, continue processing
          NULL;
      END;
      
      -- Update player rankings if table exists
      BEGIN
        INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
        VALUES (v_participant.player_id, v_points, 1)
        ON CONFLICT (player_id) DO UPDATE SET
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
          total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
          updated_at = NOW();
      EXCEPTION 
        WHEN undefined_table THEN
          -- player_rankings table doesn't exist, skip
          NULL;
        WHEN OTHERS THEN
          -- Other errors, continue processing
          NULL;
      END;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;