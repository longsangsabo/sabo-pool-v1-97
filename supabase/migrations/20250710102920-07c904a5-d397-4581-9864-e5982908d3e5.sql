-- Create remaining automation functions

-- 2. Enhanced automatic ELO calculation function
CREATE OR REPLACE FUNCTION public.calculate_and_update_match_elo(
  p_match_result_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_player1_elo INTEGER;
  v_player2_elo INTEGER;
  v_player1_new_elo INTEGER;
  v_player2_new_elo INTEGER;
  v_elo_change1 INTEGER;
  v_elo_change2 INTEGER;
  v_expected_score1 NUMERIC;
  v_actual_score1 NUMERIC;
  v_k_factor INTEGER := 32; -- Fixed K-factor
  v_result JSONB;
BEGIN
  -- Get match result details
  SELECT * INTO v_match FROM public.match_results WHERE id = p_match_result_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match result not found');
  END IF;

  -- Get current ELO ratings
  SELECT COALESCE(elo_points, 1000) INTO v_player1_elo 
  FROM public.player_rankings WHERE player_id = v_match.player1_id;
  
  SELECT COALESCE(elo_points, 1000) INTO v_player2_elo 
  FROM public.player_rankings WHERE player_id = v_match.player2_id;

  -- Calculate expected scores
  v_expected_score1 := 1.0 / (1.0 + POWER(10, (v_player2_elo - v_player1_elo) / 400.0));
  
  -- Calculate actual score (1 for win, 0 for loss)
  v_actual_score1 := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN 1.0
    WHEN v_match.winner_id = v_match.player2_id THEN 0.0
    ELSE 0.5 -- Draw case
  END;

  -- Calculate ELO changes
  v_elo_change1 := ROUND(v_k_factor * (v_actual_score1 - v_expected_score1));
  v_elo_change2 := -v_elo_change1; -- Zero-sum system

  -- Calculate new ELO ratings
  v_player1_new_elo := v_player1_elo + v_elo_change1;
  v_player2_new_elo := v_player2_elo + v_elo_change2;

  -- Update match result with ELO data
  UPDATE public.match_results SET
    player1_elo_before = v_player1_elo,
    player2_elo_before = v_player2_elo,
    player1_elo_after = v_player1_new_elo,
    player2_elo_after = v_player2_new_elo,
    player1_elo_change = v_elo_change1,
    player2_elo_change = v_elo_change2,
    updated_at = NOW()
  WHERE id = p_match_result_id;

  -- Update player rankings with new ELO
  INSERT INTO public.player_rankings (player_id, elo_points, elo, updated_at)
  VALUES 
    (v_match.player1_id, v_player1_new_elo, v_player1_new_elo, NOW()),
    (v_match.player2_id, v_player2_new_elo, v_player2_new_elo, NOW())
  ON CONFLICT (player_id) DO UPDATE SET
    elo_points = EXCLUDED.elo_points,
    elo = EXCLUDED.elo,
    updated_at = NOW();

  -- Log automation activity
  INSERT INTO public.match_automation_log (
    match_id, automation_type, status, result, processed_at
  ) VALUES (
    v_match.match_id, 'elo_calculation', 'completed',
    jsonb_build_object(
      'player1_elo_change', v_elo_change1,
      'player2_elo_change', v_elo_change2,
      'k_factor', v_k_factor
    ),
    NOW()
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'player1_elo_change', v_elo_change1,
    'player2_elo_change', v_elo_change2,
    'player1_new_elo', v_player1_new_elo,
    'player2_new_elo', v_player2_new_elo,
    'k_factor', v_k_factor
  );

  RETURN v_result;
END;
$$;