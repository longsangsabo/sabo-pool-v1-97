-- Remove 3rd-4th place match logic and simplify tournament rounds
CREATE OR REPLACE FUNCTION public.generate_all_tournament_rounds(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_current_round INTEGER;
  v_max_round INTEGER;
  v_matches_created INTEGER := 0;
  v_round_name TEXT;
  v_result JSONB;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get current highest round
  SELECT COALESCE(MAX(round_number), 0) INTO v_current_round
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Calculate max rounds needed
  SELECT total_rounds INTO v_max_round
  FROM public.tournament_brackets
  WHERE tournament_id = p_tournament_id;
  
  IF v_max_round IS NULL THEN
    RETURN jsonb_build_object('error', 'Tournament bracket not found. Generate bracket first.');
  END IF;
  
  -- Generate rounds sequentially
  WHILE v_current_round < v_max_round LOOP
    v_current_round := v_current_round + 1;
    
    -- Determine round name
    v_round_name := CASE 
      WHEN v_current_round = 1 AND v_max_round >= 4 THEN 'Round of 16'
      WHEN v_current_round = 1 AND v_max_round = 3 THEN 'Quarter-finals'
      WHEN v_current_round = 1 AND v_max_round = 2 THEN 'Semi-finals'
      WHEN v_current_round = v_max_round - 2 THEN 'Quarter-finals'
      WHEN v_current_round = v_max_round - 1 THEN 'Semi-finals'
      WHEN v_current_round = v_max_round THEN 'Final'
      ELSE 'Round ' || v_current_round
    END;
    
    -- Generate matches for current round
    IF v_current_round = v_max_round THEN
      -- Final round: Create only the Final match (no 3rd place match)
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        status, scheduled_time, created_at, updated_at,
        notes
      ) 
      SELECT 
        p_tournament_id,
        v_current_round,
        1,
        'scheduled', 
        v_tournament.tournament_start,
        now(),
        now(),
        'Chung kết'
      WHERE EXISTS (
        SELECT 1 FROM public.tournament_matches 
        WHERE tournament_id = p_tournament_id 
        AND round_number = v_current_round - 1
        LIMIT 2
      );
      
      v_matches_created := v_matches_created + 1;
      
    ELSE
      -- Regular rounds: Create matches based on previous round winners
      WITH previous_round_matches AS (
        SELECT COUNT(*) as match_count
        FROM public.tournament_matches 
        WHERE tournament_id = p_tournament_id 
        AND round_number = v_current_round - 1
      )
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        status, scheduled_time, created_at, updated_at
      )
      SELECT 
        p_tournament_id,
        v_current_round,
        generate_series(1, (SELECT match_count FROM previous_round_matches) / 2),
        'scheduled',
        v_tournament.tournament_start,
        now(),
        now()
      WHERE EXISTS (SELECT 1 FROM previous_round_matches WHERE match_count > 0);
      
      GET DIAGNOSTICS v_matches_created = ROW_COUNT;
    END IF;
    
    -- Update round names
    UPDATE public.tournament_matches 
    SET notes = CASE 
      WHEN round_number = v_max_round THEN 'Chung kết'
      WHEN notes IS NULL THEN v_round_name
      ELSE notes
    END
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_current_round;
    
  END LOOP;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'rounds_created', v_current_round - (v_current_round - 1),
    'matches_created', v_matches_created,
    'current_round', v_current_round,
    'max_round', v_max_round
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', 'Failed to generate rounds: ' || SQLERRM,
    'current_round', v_current_round
  );
END;
$function$;