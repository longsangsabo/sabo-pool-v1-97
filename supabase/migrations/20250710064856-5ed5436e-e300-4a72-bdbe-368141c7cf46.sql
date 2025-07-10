-- Fix data consistency issues for tournament matches and match results

-- 1. Clean up any orphaned tournament_matches without valid players
DELETE FROM tournament_matches 
WHERE (player1_id IS NOT NULL AND player1_id NOT IN (SELECT user_id FROM profiles))
   OR (player2_id IS NOT NULL AND player2_id NOT IN (SELECT user_id FROM profiles));

-- 2. Clean up any orphaned match_results
DELETE FROM match_results 
WHERE player1_id NOT IN (SELECT user_id FROM profiles)
   OR player2_id NOT IN (SELECT user_id FROM profiles);

-- 3. Update any NULL actual_start_time/actual_end_time columns to use proper column names
UPDATE tournament_matches 
SET started_at = actual_start_time,
    completed_at = actual_end_time
WHERE actual_start_time IS NOT NULL OR actual_end_time IS NOT NULL;

-- 4. Create function to generate next round matches automatically
CREATE OR REPLACE FUNCTION generate_all_tournament_rounds(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_current_round INTEGER;
  v_completed_matches INTEGER;
  v_total_matches_in_round INTEGER;
  v_next_round_matches JSONB[];
  v_winners RECORD;
  v_match_number INTEGER;
  v_rounds_created INTEGER := 0;
BEGIN
  -- Get current highest round
  SELECT COALESCE(MAX(round_number), 0) INTO v_current_round
  FROM tournament_matches
  WHERE tournament_id = p_tournament_id;
  
  -- Loop through rounds until no more rounds can be generated
  WHILE v_current_round > 0 LOOP
    -- Count completed matches in current round
    SELECT COUNT(*) INTO v_completed_matches
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_current_round
    AND status = 'completed'
    AND winner_id IS NOT NULL;
    
    -- Count total matches in current round
    SELECT COUNT(*) INTO v_total_matches_in_round
    FROM tournament_matches
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_current_round;
    
    -- If current round is not complete, break
    IF v_completed_matches < v_total_matches_in_round THEN
      EXIT;
    END IF;
    
    -- If only 1 match in round, tournament is complete
    IF v_total_matches_in_round = 1 THEN
      EXIT;
    END IF;
    
    -- Check if next round already exists
    IF EXISTS (
      SELECT 1 FROM tournament_matches 
      WHERE tournament_id = p_tournament_id 
      AND round_number = v_current_round + 1
    ) THEN
      v_current_round := v_current_round + 1;
      CONTINUE;
    END IF;
    
    -- Generate next round matches
    v_match_number := 1;
    v_next_round_matches := ARRAY[]::JSONB[];
    
    -- Get winners from current round in pairs
    FOR v_winners IN
      SELECT 
        winner_id as player1,
        LEAD(winner_id) OVER (ORDER BY match_number) as player2,
        ROW_NUMBER() OVER (ORDER BY match_number) as rn
      FROM tournament_matches
      WHERE tournament_id = p_tournament_id 
      AND round_number = v_current_round
      AND status = 'completed'
      AND winner_id IS NOT NULL
    LOOP
      -- Only process odd-numbered rows (pairs)
      IF v_winners.rn % 2 = 1 AND v_winners.player2 IS NOT NULL THEN
        INSERT INTO tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          created_at,
          updated_at
        ) VALUES (
          p_tournament_id,
          v_current_round + 1,
          v_match_number,
          v_winners.player1,
          v_winners.player2,
          'scheduled',
          NOW(),
          NOW()
        );
        
        v_match_number := v_match_number + 1;
      ELSIF v_winners.rn % 2 = 1 AND v_winners.player2 IS NULL THEN
        -- Odd number of winners, last one gets a bye
        INSERT INTO tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          winner_id,
          created_at,
          updated_at
        ) VALUES (
          p_tournament_id,
          v_current_round + 1,
          v_match_number,
          v_winners.player1,
          NULL,
          'completed',
          v_winners.player1,
          NOW(),
          NOW()
        );
      END IF;
    END LOOP;
    
    v_rounds_created := v_rounds_created + 1;
    v_current_round := v_current_round + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'rounds_created', v_rounds_created,
    'current_round', v_current_round
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'current_round', v_current_round
  );
END;
$$;