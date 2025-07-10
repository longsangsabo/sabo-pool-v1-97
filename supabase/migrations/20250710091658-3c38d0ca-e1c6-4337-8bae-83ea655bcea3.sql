-- Update advance_tournament_winner to auto-create 3rd place match
CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
  p_match_id UUID,
  p_tournament_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_completed_match RECORD;
  v_next_match RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_winner_seed INTEGER;
  v_advancement_result JSONB;
  v_max_round INTEGER;
  v_third_place_result JSONB;
BEGIN
  -- Get the completed match details
  SELECT * INTO v_completed_match
  FROM public.tournament_matches 
  WHERE id = p_match_id AND tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  IF v_completed_match.winner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Match has no winner set');
  END IF;
  
  -- Get max round to determine if this is semi-final
  SELECT MAX(round_number) INTO v_max_round
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Calculate next round and match number for winner advancement
  v_next_round := v_completed_match.round_number + 1;
  v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
  
  -- Find the next round match where this winner should advance
  SELECT * INTO v_next_match
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF FOUND THEN
    -- Determine if winner goes to player1 or player2 slot in next match
    -- Odd match numbers advance to player1, even numbers to player2
    IF v_completed_match.match_number % 2 = 1 THEN
      -- Odd match winner goes to player1 slot
      UPDATE public.tournament_matches 
      SET player1_id = v_completed_match.winner_id,
          updated_at = now()
      WHERE id = v_next_match.id;
      
      v_advancement_result := jsonb_build_object(
        'advanced_to_slot', 'player1',
        'next_match_id', v_next_match.id,
        'next_round', v_next_round,
        'next_match_number', v_next_match_number
      );
    ELSE
      -- Even match winner goes to player2 slot  
      UPDATE public.tournament_matches 
      SET player2_id = v_completed_match.winner_id,
          updated_at = now()
      WHERE id = v_next_match.id;
      
      v_advancement_result := jsonb_build_object(
        'advanced_to_slot', 'player2',
        'next_match_id', v_next_match.id,
        'next_round', v_next_round,
        'next_match_number', v_next_match_number
      );
    END IF;
    
    -- Check if this completed the semi-finals and auto-create 3rd place match
    IF v_completed_match.round_number = v_max_round - 1 THEN
      -- This was a semi-final match, check if all semi-finals are complete
      DECLARE
        v_semis_complete BOOLEAN;
      BEGIN
        SELECT BOOL_AND(status = 'completed' AND winner_id IS NOT NULL) INTO v_semis_complete
        FROM public.tournament_matches
        WHERE tournament_id = p_tournament_id 
        AND round_number = v_max_round - 1;
        
        IF v_semis_complete THEN
          -- Try to create 3rd place match
          SELECT public.create_third_place_match(p_tournament_id) INTO v_third_place_result;
          
          IF v_third_place_result ? 'success' AND (v_third_place_result->>'success')::boolean THEN
            v_advancement_result := v_advancement_result || jsonb_build_object(
              'third_place_match_created', true,
              'third_place_match_id', v_third_place_result->>'third_place_match_id'
            );
          END IF;
        END IF;
      END;
    END IF;
    
    -- Log the advancement
    INSERT INTO public.system_logs (log_type, message, metadata)
    VALUES (
      'tournament_advancement',
      format('Player advanced from R%s M%s to R%s M%s', 
        v_completed_match.round_number, 
        v_completed_match.match_number,
        v_next_round, 
        v_next_match_number),
      jsonb_build_object(
        'tournament_id', p_tournament_id,
        'completed_match_id', p_match_id,
        'winner_id', v_completed_match.winner_id,
        'next_match_id', v_next_match.id
      )
    );
    
  ELSE
    -- This was probably the final match
    v_advancement_result := jsonb_build_object(
      'tournament_complete', true,
      'champion_id', v_completed_match.winner_id
    );
    
    -- Update tournament status if final
    IF v_completed_match.round_number = v_max_round THEN
      UPDATE public.tournaments 
      SET status = 'completed',
          updated_at = now()
      WHERE id = p_tournament_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_completed_match.winner_id,
    'advancement', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM
    );
END;
$$;