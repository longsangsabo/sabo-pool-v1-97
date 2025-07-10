-- Fix the process_tournament_results function to avoid aggregate function with window function error
CREATE OR REPLACE FUNCTION public.process_tournament_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_position_map JSONB := '{}';
BEGIN
  -- Only process when tournament status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get tournament type multiplier
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
    LIMIT 1;
    
    -- Build position map based on tournament bracket results
    -- Fixed: Use CTE to calculate positions first, then aggregate
    WITH player_stats AS (
      SELECT 
        tr.player_id,
        COUNT(CASE WHEN tm.winner_id = tr.player_id THEN 1 END) as wins,
        COUNT(tm.id) as total_matches
      FROM public.tournament_registrations tr
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.player_id OR tm.player2_id = tr.player_id)
        AND tm.tournament_id = NEW.id
        AND tm.status = 'completed'
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.player_id IS NOT NULL
      GROUP BY tr.player_id
    ),
    player_positions AS (
      SELECT 
        player_id,
        CASE 
          WHEN player_id = v_final_match_winner THEN 1
          WHEN player_id = v_final_match_loser THEN 2
          ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 2
        END as position
      FROM player_stats
    )
    SELECT jsonb_object_agg(player_id::text, position)
    INTO v_position_map
    FROM player_positions;
    
    -- Process all tournament participants
    FOR v_participant IN 
      SELECT 
        tr.player_id,
        p.full_name,
        -- Get position from position map
        COALESCE((v_position_map->>tr.player_id::text)::integer, 99) as position
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.player_id = p.user_id
      WHERE tr.tournament_id = NEW.id 
        AND tr.registration_status = 'confirmed'
        AND tr.player_id IS NOT NULL
    LOOP
      -- Calculate base points based on actual position
      v_points := CASE 
        WHEN v_participant.position = 1 THEN 1000  -- Champion
        WHEN v_participant.position = 2 THEN 700   -- Runner-up  
        WHEN v_participant.position = 3 THEN 500   -- Third place
        WHEN v_participant.position = 4 THEN 400   -- Fourth place
        WHEN v_participant.position <= 8 THEN 300  -- Quarter-finals
        WHEN v_participant.position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      -- Apply multiplier
      v_points := ROUND(v_points * v_multiplier);
      
      -- Award SPA points
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
        WHEN OTHERS THEN
          RAISE NOTICE 'Error inserting SPA points for player %: %', v_participant.player_id, SQLERRM;
      END;
      
      -- Update player rankings
      BEGIN
        INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
        VALUES (v_participant.player_id, v_points, 1)
        ON CONFLICT (player_id) DO UPDATE SET
          spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
          total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
          updated_at = NOW();
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE 'Error updating player rankings for player %: %', v_participant.player_id, SQLERRM;
      END;
      
      -- Create match results for ELO calculation if match data exists
      BEGIN
        WITH player_matches AS (
          SELECT 
            tm.*,
            CASE WHEN tm.winner_id = v_participant.player_id THEN 'win'
                 WHEN tm.winner_id IS NOT NULL THEN 'loss'
                 ELSE 'draw' END as result,
            CASE WHEN tm.player1_id = v_participant.player_id THEN tm.player2_id
                 ELSE tm.player1_id END as opponent_id
          FROM public.tournament_matches tm
          WHERE tm.tournament_id = NEW.id
            AND (tm.player1_id = v_participant.player_id OR tm.player2_id = v_participant.player_id)
            AND tm.status = 'completed'
        )
        INSERT INTO public.match_results (
          tournament_id,
          match_id,
          player1_id,
          player2_id,
          winner_id,
          loser_id,
          player1_score,
          player2_score,
          match_date,
          result_status,
          player1_elo_before,
          player1_elo_after,
          player1_elo_change,
          player2_elo_before,
          player2_elo_after,
          player2_elo_change
        )
        SELECT 
          NEW.id,
          pm.id,
          pm.player1_id,
          pm.player2_id,
          pm.winner_id,
          CASE WHEN pm.winner_id = pm.player1_id THEN pm.player2_id ELSE pm.player1_id END,
          5, -- Default race to 5
          CASE WHEN pm.winner_id IS NOT NULL THEN 
            CASE WHEN pm.winner_id = pm.player1_id THEN 3 ELSE 5 END
          ELSE 5 END,
          COALESCE(pm.completed_at, NOW()),
          'verified',
          1000, -- Default ELO before
          1000 + CASE WHEN pm.winner_id = v_participant.player_id THEN 25 ELSE -25 END, -- Simple ELO change
          CASE WHEN pm.winner_id = v_participant.player_id THEN 25 ELSE -25 END,
          1000, -- Opponent ELO before  
          1000 + CASE WHEN pm.winner_id = v_participant.player_id THEN -25 ELSE 25 END,
          CASE WHEN pm.winner_id = v_participant.player_id THEN -25 ELSE 25 END
        FROM player_matches pm
        ON CONFLICT (tournament_id, match_id) DO NOTHING;
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating match results for player %: %', v_participant.player_id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Tournament % completed processing with % participants', NEW.name, 
      (SELECT COUNT(*) FROM tournament_registrations WHERE tournament_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$function$;