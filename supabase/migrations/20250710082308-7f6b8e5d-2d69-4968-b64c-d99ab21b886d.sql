-- Fix the position assignment logic
DELETE FROM public.spa_points_log 
WHERE source_id = 'd2b48ded-2aa6-4939-841d-3f5425662eb7'
AND source_type = 'tournament';

-- Create corrected function
CREATE OR REPLACE FUNCTION public.process_tournament_results_final(tournament_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_points INTEGER;
  v_multiplier NUMERIC;
  v_final_match_winner UUID;
  v_final_match_loser UUID;
  v_current_position INTEGER := 3; -- Start at 3 since 1 and 2 are fixed
BEGIN
  -- Get tournament
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = tournament_id_param;
  
  -- Get tournament type multiplier
  v_multiplier := 1.0;
  
  -- Get final match results to determine 1st and 2nd place  
  SELECT winner_id, 
         CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
  INTO v_final_match_winner, v_final_match_loser
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = tournament_id_param 
    AND tm.round_number = (
      SELECT MAX(round_number) 
      FROM public.tournament_matches 
      WHERE tournament_id = tournament_id_param
    )
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE 'Final match - Winner: %, Runner-up: %', v_final_match_winner, v_final_match_loser;
  
  -- Process participants: champion first, then runner-up, then others by wins
  FOR v_participant IN 
    WITH player_stats AS (
      SELECT 
        tr.player_id,
        p.full_name,
        COUNT(CASE WHEN tm.winner_id = tr.player_id THEN 1 END) as wins,
        COUNT(tm.id) as total_matches,
        CASE 
          WHEN tr.player_id = v_final_match_winner THEN 1  -- Champion first
          WHEN tr.player_id = v_final_match_loser THEN 2   -- Runner-up second
          ELSE 999  -- Others sorted by performance
        END as sort_order
      FROM public.tournament_registrations tr
      LEFT JOIN public.profiles p ON tr.player_id = p.user_id
      LEFT JOIN public.tournament_matches tm ON 
        (tm.player1_id = tr.player_id OR tm.player2_id = tr.player_id)
        AND tm.tournament_id = tournament_id_param
        AND tm.status = 'completed'
      WHERE tr.tournament_id = tournament_id_param 
        AND tr.registration_status = 'confirmed'
        AND tr.player_id IS NOT NULL
      GROUP BY tr.player_id, p.full_name
    )
    SELECT 
      player_id,
      full_name,
      wins,
      total_matches,
      sort_order
    FROM player_stats
    ORDER BY sort_order ASC, wins DESC, total_matches DESC
  LOOP
    DECLARE
      v_position INTEGER;
    BEGIN
      -- Assign exact position
      IF v_participant.player_id = v_final_match_winner THEN
        v_position := 1;  -- Champion
      ELSIF v_participant.player_id = v_final_match_loser THEN  
        v_position := 2;  -- Runner-up
      ELSE
        v_position := v_current_position;  -- Others in order
        v_current_position := v_current_position + 1;
      END IF;
      
      -- Calculate points based on position
      v_points := CASE 
        WHEN v_position = 1 THEN 1000  -- Champion
        WHEN v_position = 2 THEN 700   -- Runner-up  
        WHEN v_position = 3 THEN 500   -- Third place
        WHEN v_position = 4 THEN 400   -- Fourth place
        WHEN v_position <= 8 THEN 300  -- Quarter-finals
        WHEN v_position <= 16 THEN 200 -- Round of 16
        ELSE 100  -- Participation
      END;
      
      v_points := ROUND(v_points * v_multiplier);
      
      RAISE NOTICE 'Player % (%): Position %, Wins %, Points %', 
        v_participant.full_name, v_participant.player_id, v_position, v_participant.wins, v_points;
      
      -- Insert SPA points
      INSERT INTO public.spa_points_log (
        player_id, 
        source_type, 
        source_id, 
        points_earned,
        description
      ) VALUES (
        v_participant.player_id,
        'tournament',
        tournament_id_param,
        v_points,
        format('Vị trí %s trong %s', v_position, v_tournament.name)
      );
      
      -- Update rankings
      INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
      VALUES (v_participant.player_id, v_points, 1)
      ON CONFLICT (player_id) DO UPDATE SET
        spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
        total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
        updated_at = NOW();
    END;
  END LOOP;
  
  RAISE NOTICE 'Tournament % - Final processing completed', v_tournament.name;
END;
$function$;

-- Execute the corrected function
SELECT public.process_tournament_results_final('d2b48ded-2aa6-4939-841d-3f5425662eb7');