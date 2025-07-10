-- Create function to advance tournament winner to next round
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
  v_advancement_result JSONB;
  v_tournament_bracket RECORD;
  v_total_rounds INTEGER;
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

  -- Get tournament bracket info
  SELECT * INTO v_tournament_bracket
  FROM public.tournament_brackets
  WHERE tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament bracket not found');
  END IF;
  
  v_total_rounds := v_tournament_bracket.total_rounds;
  
  -- Calculate next round and match number for winner advancement
  v_next_round := v_completed_match.round_number + 1;
  v_next_match_number := CEIL(v_completed_match.match_number::NUMERIC / 2);
  
  -- Check if this is the final match
  IF v_completed_match.round_number >= v_total_rounds THEN
    -- Update tournament status to completed
    UPDATE public.tournaments 
    SET status = 'completed',
        updated_at = now()
    WHERE id = p_tournament_id;
    
    RETURN jsonb_build_object(
      'tournament_complete', true,
      'champion_id', v_completed_match.winner_id,
      'message', 'Tournament completed'
    );
  END IF;
  
  -- Find or create the next round match
  SELECT * INTO v_next_match
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id 
    AND round_number = v_next_round 
    AND match_number = v_next_match_number;
  
  IF NOT FOUND THEN
    -- Create the next round match if it doesn't exist
    INSERT INTO public.tournament_matches (
      tournament_id,
      round_number,
      match_number,
      player1_id,
      player2_id,
      status,
      scheduled_time,
      created_at,
      updated_at
    ) VALUES (
      p_tournament_id,
      v_next_round,
      v_next_match_number,
      CASE 
        WHEN v_completed_match.match_number % 2 = 1 THEN v_completed_match.winner_id
        ELSE NULL
      END,
      CASE 
        WHEN v_completed_match.match_number % 2 = 0 THEN v_completed_match.winner_id
        ELSE NULL
      END,
      'scheduled',
      v_completed_match.scheduled_time + INTERVAL '1 hour',
      now(),
      now()
    ) RETURNING * INTO v_next_match;
    
    v_advancement_result := jsonb_build_object(
      'match_created', true,
      'advanced_to_slot', CASE 
        WHEN v_completed_match.match_number % 2 = 1 THEN 'player1'
        ELSE 'player2'
      END,
      'next_match_id', v_next_match.id,
      'next_round', v_next_round,
      'next_match_number', v_next_match_number
    );
  ELSE
    -- Update existing match with the winner
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
  END IF;

  -- Update current round in bracket if all matches in current round are completed
  DECLARE
    v_matches_in_round INTEGER;
    v_completed_matches_in_round INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_matches_in_round
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_completed_match.round_number;
    
    SELECT COUNT(*) INTO v_completed_matches_in_round
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_completed_match.round_number
    AND status = 'completed';
    
    IF v_matches_in_round = v_completed_matches_in_round THEN
      UPDATE public.tournament_brackets
      SET current_round = v_next_round,
          updated_at = now()
      WHERE tournament_id = p_tournament_id;
      
      -- Update tournament status if needed
      UPDATE public.tournaments
      SET status = CASE 
        WHEN v_next_round > v_total_rounds THEN 'completed'
        ELSE 'ongoing'
      END,
      updated_at = now()
      WHERE id = p_tournament_id;
    END IF;
  END;
  
  RETURN jsonb_build_object(
    'success', true,
    'match_id', p_match_id,
    'winner_id', v_completed_match.winner_id,
    'advancement', v_advancement_result
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Create trigger function to auto-advance winners
CREATE OR REPLACE FUNCTION public.trigger_advance_tournament_winner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Only trigger on matches that have been completed with a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND 
     (OLD.status IS NULL OR OLD.status != 'completed' OR OLD.winner_id IS NULL) THEN
    
    -- Call the advance winner function
    SELECT public.advance_tournament_winner(NEW.id, NEW.tournament_id) INTO v_result;
    
    -- Log the result (you can add logging table if needed)
    -- RAISE NOTICE 'Winner advancement result: %', v_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tournament_matches table
DROP TRIGGER IF EXISTS trigger_auto_advance_winner ON public.tournament_matches;
CREATE TRIGGER trigger_auto_advance_winner
  AFTER UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_advance_tournament_winner();

-- Function to generate all rounds at once (improved version)
CREATE OR REPLACE FUNCTION public.generate_all_tournament_rounds(
  p_tournament_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_bracket RECORD;
  v_total_rounds INTEGER;
  v_current_round INTEGER;
  v_matches_in_round INTEGER;
  v_match_counter INTEGER;
  v_round INTEGER;
BEGIN
  -- Get tournament and bracket info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  SELECT * INTO v_bracket FROM public.tournament_brackets WHERE tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament or bracket not found');
  END IF;
  
  v_total_rounds := v_bracket.total_rounds;
  v_matches_in_round := v_bracket.total_players / 2; -- Start with first round
  
  -- Generate matches for all rounds
  FOR v_round IN 2..v_total_rounds LOOP
    v_matches_in_round := v_matches_in_round / 2;
    
    -- Create placeholder matches for this round
    FOR v_match_counter IN 1..v_matches_in_round LOOP
      INSERT INTO public.tournament_matches (
        tournament_id,
        round_number,
        match_number,
        player1_id,
        player2_id,
        status,
        scheduled_time,
        created_at,
        updated_at
      ) VALUES (
        p_tournament_id,
        v_round,
        v_match_counter,
        NULL, -- Will be filled when previous round completes
        NULL, -- Will be filled when previous round completes
        'scheduled',
        v_tournament.tournament_start + (v_round - 1) * INTERVAL '1 hour',
        now(),
        now()
      );
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'rounds_created', v_total_rounds - 1,
    'total_rounds', v_total_rounds
  );
END;
$$;