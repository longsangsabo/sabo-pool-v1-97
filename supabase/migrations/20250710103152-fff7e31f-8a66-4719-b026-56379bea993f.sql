-- 5. Tournament automation function
CREATE OR REPLACE FUNCTION public.process_tournament_completion(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_results_awarded INTEGER := 0;
  v_total_spa_awarded INTEGER := 0;
  v_total_elo_awarded INTEGER := 0;
  v_spa_reward INTEGER;
  v_elo_reward INTEGER;
  v_rank_code TEXT;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Award tournament rewards to all participants
  FOR v_participant IN
    SELECT 
      tr.player_id,
      p.current_rank,
      CASE 
        WHEN tm_final.winner_id = tr.player_id THEN 'CHAMPION'
        WHEN tm_final.player1_id = tr.player_id OR tm_final.player2_id = tr.player_id THEN 'RUNNER_UP'
        WHEN tm_third.winner_id = tr.player_id THEN 'THIRD_PLACE'
        ELSE 'PARTICIPATION'
      END as position
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.tournament_matches tm_final ON tm_final.tournament_id = p_tournament_id 
      AND tm_final.round_number = (SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id)
      AND tm_final.match_number = 1 AND COALESCE(tm_final.is_third_place_match, false) = false
    LEFT JOIN public.tournament_matches tm_third ON tm_third.tournament_id = p_tournament_id 
      AND COALESCE(tm_third.is_third_place_match, false) = true
    WHERE tr.tournament_id = p_tournament_id AND tr.registration_status = 'confirmed'
  LOOP
    v_rank_code := COALESCE(v_participant.current_rank, 'K');
    
    -- Calculate SPA reward based on position and rank
    v_spa_reward := CASE v_participant.position
      WHEN 'CHAMPION' THEN 
        CASE v_rank_code
          WHEN 'E+' THEN 1500
          WHEN 'E' THEN 1500
          WHEN 'F+' THEN 1200
          WHEN 'F' THEN 1200
          WHEN 'G+' THEN 1000
          WHEN 'G' THEN 1000
          WHEN 'H+' THEN 900
          WHEN 'H' THEN 900
          WHEN 'I+' THEN 800
          WHEN 'I' THEN 800
          ELSE 700
        END
      WHEN 'RUNNER_UP' THEN
        CASE v_rank_code
          WHEN 'E+' THEN 1100
          WHEN 'E' THEN 1100
          WHEN 'F+' THEN 900
          WHEN 'F' THEN 900
          WHEN 'G+' THEN 750
          WHEN 'G' THEN 750
          WHEN 'H+' THEN 650
          WHEN 'H' THEN 650
          WHEN 'I+' THEN 550
          WHEN 'I' THEN 550
          ELSE 450
        END
      WHEN 'THIRD_PLACE' THEN
        CASE v_rank_code
          WHEN 'E+' THEN 800
          WHEN 'E' THEN 800
          WHEN 'F+' THEN 650
          WHEN 'F' THEN 650
          WHEN 'G+' THEN 550
          WHEN 'G' THEN 550
          WHEN 'H+' THEN 450
          WHEN 'H' THEN 450
          WHEN 'I+' THEN 350
          WHEN 'I' THEN 350
          ELSE 250
        END
      ELSE 100 -- PARTICIPATION
    END;

    -- Calculate ELO reward
    v_elo_reward := CASE v_participant.position
      WHEN 'CHAMPION' THEN 200
      WHEN 'RUNNER_UP' THEN 150
      WHEN 'THIRD_PLACE' THEN 100
      ELSE 25 -- PARTICIPATION
    END;

    -- Award SPA points
    PERFORM public.credit_spa_points(
      v_participant.player_id, v_spa_reward, 'tournament',
      'Tournament reward: ' || v_participant.position,
      p_tournament_id, 'tournament',
      jsonb_build_object('position', v_participant.position, 'rank', v_rank_code)
    );

    -- Award ELO points (add to current ELO)
    UPDATE public.player_rankings
    SET elo_points = elo_points + v_elo_reward,
        elo = elo_points + v_elo_reward,
        updated_at = NOW()
    WHERE player_id = v_participant.player_id;

    v_results_awarded := v_results_awarded + 1;
    v_total_spa_awarded := v_total_spa_awarded + v_spa_reward;
    v_total_elo_awarded := v_total_elo_awarded + v_elo_reward;

    -- Check for milestones after tournament completion
    PERFORM public.check_and_award_milestones(v_participant.player_id);
  END LOOP;

  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_tournament_id;

  -- Log automation activity
  INSERT INTO public.tournament_automation_log (
    tournament_id, automation_type, status, result, processed_at
  ) VALUES (
    p_tournament_id, 'reward_calculation', 'completed',
    jsonb_build_object(
      'participants_awarded', v_results_awarded,
      'total_spa_awarded', v_total_spa_awarded,
      'total_elo_awarded', v_total_elo_awarded
    ),
    NOW()
  );

  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants_awarded', v_results_awarded,
    'total_spa_awarded', v_total_spa_awarded,
    'total_elo_awarded', v_total_elo_awarded
  );

  RETURN v_result;
END;
$$;