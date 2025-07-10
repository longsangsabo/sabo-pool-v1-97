-- Clear old incorrect data and retrigger tournament completion
DELETE FROM public.spa_points_log 
WHERE source_id = 'd2b48ded-2aa6-4939-841d-3f5425662eb7'
AND source_type = 'tournament';

DELETE FROM public.match_results 
WHERE tournament_id = 'd2b48ded-2aa6-4939-841d-3f5425662eb7';

-- Manually trigger the tournament completion process
DO $$
DECLARE
  tournament_record RECORD;
BEGIN
  -- Get the tournament
  SELECT * INTO tournament_record 
  FROM public.tournaments 
  WHERE id = 'd2b48ded-2aa6-4939-841d-3f5425662eb7';
  
  -- Manually call the function
  PERFORM public.process_tournament_results_manual(tournament_record);
END $$;

-- Create manual trigger function
CREATE OR REPLACE FUNCTION public.process_tournament_results_manual(tournament_rec RECORD)
RETURNS void
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
  v_position_map JSONB := '{}';
BEGIN
  -- Get tournament type multiplier
  v_multiplier := CASE 
    WHEN tournament_rec.tournament_type = 'season' THEN 1.5
    WHEN tournament_rec.tournament_type = 'open' THEN 2.0
    ELSE 1.0
  END;
  
  -- Get final match results to determine 1st and 2nd place  
  SELECT winner_id, 
         CASE WHEN winner_id = player1_id THEN player2_id ELSE player1_id END as loser_id
  INTO v_final_match_winner, v_final_match_loser
  FROM public.tournament_matches tm
  WHERE tm.tournament_id = tournament_rec.id 
    AND tm.round_number = (
      SELECT MAX(round_number) 
      FROM public.tournament_matches 
      WHERE tournament_id = tournament_rec.id
    )
    AND tm.status = 'completed'
    AND tm.winner_id IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE 'Final match winner: %, loser: %', v_final_match_winner, v_final_match_loser;
  
  -- Build position map based on tournament bracket results
  WITH player_stats AS (
    SELECT 
      tr.player_id,
      COUNT(CASE WHEN tm.winner_id = tr.player_id THEN 1 END) as wins,
      COUNT(tm.id) as total_matches
    FROM public.tournament_registrations tr
    LEFT JOIN public.tournament_matches tm ON 
      (tm.player1_id = tr.player_id OR tm.player2_id = tr.player_id)
      AND tm.tournament_id = tournament_rec.id
      AND tm.status = 'completed'
    WHERE tr.tournament_id = tournament_rec.id 
      AND tr.registration_status = 'confirmed'
      AND tr.player_id IS NOT NULL
    GROUP BY tr.player_id
  )
  SELECT jsonb_object_agg(
    player_id::text,
    CASE 
      WHEN player_id = v_final_match_winner THEN 1
      WHEN player_id = v_final_match_loser THEN 2
      ELSE ROW_NUMBER() OVER (ORDER BY wins DESC, total_matches DESC) + 2
    END
  ) INTO v_position_map
  FROM player_stats;
  
  RAISE NOTICE 'Position map: %', v_position_map;
  
  -- Process all tournament participants
  FOR v_participant IN 
    SELECT 
      tr.player_id,
      p.full_name,
      -- Get position from position map
      COALESCE((v_position_map->>tr.player_id::text)::integer, 99) as position
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    WHERE tr.tournament_id = tournament_rec.id 
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
    
    RAISE NOTICE 'Player % (%) gets % SPA points for position %', 
      v_participant.full_name, v_participant.player_id, v_points, v_participant.position;
    
    -- Award SPA points
    INSERT INTO public.spa_points_log (
      player_id, 
      source_type, 
      source_id, 
      points_earned,
      description
    ) VALUES (
      v_participant.player_id,
      'tournament',
      tournament_rec.id,
      v_points,
      format('Vị trí %s trong %s', v_participant.position, tournament_rec.name)
    );
    
    -- Update player rankings
    INSERT INTO public.player_rankings (player_id, spa_points, total_matches)
    VALUES (v_participant.player_id, v_points, 1)
    ON CONFLICT (player_id) DO UPDATE SET
      spa_points = COALESCE(player_rankings.spa_points, 0) + v_points,
      total_matches = COALESCE(player_rankings.total_matches, 0) + 1,
      updated_at = NOW();
  END LOOP;
  
  RAISE NOTICE 'Tournament % reprocessing completed', tournament_rec.name;
END;
$function$;