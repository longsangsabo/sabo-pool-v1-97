-- Create supporting functions for tournament bracket management

-- 1. Create reseed_tournament function 
CREATE OR REPLACE FUNCTION public.reseed_tournament(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'elo_ranking'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if tournament can be reseeded (only before matches start)
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND status IN ('ongoing', 'completed')
  ) THEN
    RETURN jsonb_build_object('error', 'Cannot reseed after matches have started');
  END IF;
  
  -- Regenerate bracket with new seeding
  RETURN public.generate_advanced_tournament_bracket(p_tournament_id, p_seeding_method, true);
END;
$$;

-- 2. Create enhanced advance_tournament_winner function
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
    
  ELSE
    -- This was probably the final match
    v_advancement_result := jsonb_build_object(
      'tournament_complete', true,
      'champion_id', v_completed_match.winner_id
    );
    
    -- Update tournament status if final
    IF v_completed_match.round_number = (
      SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id
    ) THEN
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

-- 3. Create function to complete a match and advance winner
CREATE OR REPLACE FUNCTION public.complete_tournament_match(
  p_match_id UUID,
  p_winner_id UUID,
  p_player1_score INTEGER DEFAULT 0,
  p_player2_score INTEGER DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_match RECORD;
  v_result JSONB;
BEGIN
  -- Get match details
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Validate winner is one of the players
  IF p_winner_id NOT IN (v_match.player1_id, v_match.player2_id) THEN
    RETURN jsonb_build_object('error', 'Winner must be one of the match players');
  END IF;
  
  -- Update match with results
  UPDATE public.tournament_matches
  SET 
    winner_id = p_winner_id,
    score_player1 = p_player1_score,
    score_player2 = p_player2_score,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = p_match_id;
  
  -- Advance winner to next round
  SELECT * INTO v_result
  FROM public.advance_tournament_winner(p_match_id, v_match.tournament_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to complete match: ' || SQLERRM
    );
END;
$$;

-- 4. Create function to get tournament bracket status
CREATE OR REPLACE FUNCTION public.get_tournament_bracket_status(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_bracket RECORD;
  v_matches_summary JSONB;
  v_current_round INTEGER;
  v_next_matches JSONB[];
BEGIN
  -- Get bracket info
  SELECT * INTO v_bracket
  FROM public.tournament_brackets
  WHERE tournament_id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bracket not found');
  END IF;
  
  -- Get matches summary
  SELECT jsonb_build_object(
    'total_matches', COUNT(*),
    'completed_matches', COUNT(*) FILTER (WHERE status = 'completed'),
    'ongoing_matches', COUNT(*) FILTER (WHERE status = 'ongoing'),
    'scheduled_matches', COUNT(*) FILTER (WHERE status = 'scheduled'),
    'by_round', jsonb_object_agg(
      round_number,
      jsonb_build_object(
        'total', round_count,
        'completed', round_completed,
        'status', CASE 
          WHEN round_completed = round_count THEN 'completed'
          WHEN round_completed > 0 THEN 'ongoing'
          ELSE 'scheduled'
        END
      )
    )
  ) INTO v_matches_summary
  FROM (
    SELECT 
      round_number,
      COUNT(*) as round_count,
      COUNT(*) FILTER (WHERE status = 'completed') as round_completed
    FROM public.tournament_matches
    WHERE tournament_id = p_tournament_id
    GROUP BY round_number
  ) round_stats;
  
  -- Get current round
  SELECT MIN(round_number) INTO v_current_round
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id 
  AND status IN ('scheduled', 'ongoing');
  
  RETURN jsonb_build_object(
    'tournament_id', p_tournament_id,
    'bracket_exists', true,
    'bracket_type', v_bracket.bracket_type,
    'total_players', v_bracket.total_players,
    'total_rounds', v_bracket.total_rounds,
    'current_round', COALESCE(v_current_round, v_bracket.total_rounds + 1),
    'status', v_bracket.status,
    'matches_summary', v_matches_summary,
    'created_at', v_bracket.created_at,
    'updated_at', v_bracket.updated_at
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to get bracket status: ' || SQLERRM
    );
END;
$$;