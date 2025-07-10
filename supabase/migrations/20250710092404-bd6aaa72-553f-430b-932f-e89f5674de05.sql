
-- Add third_place_match toggle to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN has_third_place_match BOOLEAN DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.tournaments.has_third_place_match IS 'Enable/disable third place match for single elimination tournaments';

-- Update existing single elimination tournaments to have third place match
UPDATE public.tournaments 
SET has_third_place_match = true 
WHERE tournament_type = 'single_elimination';

-- Update the generate_advanced_tournament_bracket function to consider third place match setting
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id uuid, 
  p_seeding_method text DEFAULT 'elo_ranking'::text, 
  p_force_regenerate boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_rounds INTEGER;
  v_bracket_data JSONB;
  v_matches JSONB[];
  v_current_match_id INTEGER := 1;
  v_round INTEGER;
  v_match_in_round INTEGER;
  v_players_in_round INTEGER;
  v_bracket_id UUID;
  v_seeded_participants JSONB[];
  v_bye_count INTEGER;
  v_participant_data JSONB;
  v_participant_cursor CURSOR FOR 
    SELECT 
      tr.player_id as user_id,
      COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
      COALESCE(pr.elo_points, 1000) as elo_rating,
      tr.registration_date,
      ROW_NUMBER() OVER (
        ORDER BY 
        CASE p_seeding_method
          WHEN 'elo_ranking' THEN COALESCE(pr.elo_points, 1000)
          WHEN 'registration_order' THEN EXTRACT(EPOCH FROM tr.registration_date)::INTEGER
          WHEN 'random' THEN RANDOM()
          ELSE RANDOM()
        END DESC
      ) as seed_order
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed'
    AND tr.player_id IS NOT NULL;
  v_participant RECORD;
  i INTEGER := 1;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found', 'tournament_id', p_tournament_id);
  END IF;
  
  -- Check if bracket already exists and not forcing regeneration
  IF NOT p_force_regenerate THEN
    SELECT id INTO v_bracket_id
    FROM public.tournament_brackets
    WHERE tournament_id = p_tournament_id;
    
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'Bracket already exists. Use force_regenerate=true to recreate.');
    END IF;
  END IF;
  
  -- Get participant count with valid profiles only
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations tr
  INNER JOIN public.profiles p ON tr.player_id = p.user_id
  WHERE tr.tournament_id = p_tournament_id 
  AND tr.registration_status = 'confirmed'
  AND tr.player_id IS NOT NULL;
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', format('Minimum 2 participants required. Found: %s', v_participant_count));
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('error', format('Maximum 64 participants allowed. Found: %s', v_participant_count));
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2^CEIL(LOG(2, v_participant_count));
  
  -- Calculate rounds - add extra round for 3rd place match if enabled
  v_rounds := LOG(2, v_bracket_size)::INTEGER;
  IF v_tournament.tournament_type = 'single_elimination' AND COALESCE(v_tournament.has_third_place_match, true) THEN
    v_rounds := v_rounds + 1;
  END IF;
  
  v_bye_count := v_bracket_size - v_participant_count;
  
  -- Clear existing data if regenerating
  DELETE FROM public.tournament_seeding WHERE tournament_id = p_tournament_id;
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  DELETE FROM public.tournament_brackets WHERE tournament_id = p_tournament_id;
  
  -- Generate seeded participants with byes
  v_seeded_participants := ARRAY[]::JSONB[];
  
  -- Add real participants
  FOR v_participant IN v_participant_cursor LOOP
    -- Insert seeding record
    INSERT INTO public.tournament_seeding (
      tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
    ) VALUES (
      p_tournament_id,
      v_participant.user_id,
      i,
      v_participant.elo_rating,
      i,
      false
    );
    
    v_seeded_participants := v_seeded_participants || jsonb_build_object(
      'player_id', v_participant.user_id,
      'name', v_participant.player_name,
      'seed', i,
      'elo', v_participant.elo_rating,
      'is_bye', false
    );
    
    i := i + 1;
  END LOOP;
  
  -- Add bye players if needed
  FOR j IN (v_participant_count + 1)..v_bracket_size LOOP
    INSERT INTO public.tournament_seeding (
      tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
    ) VALUES (
      p_tournament_id,
      NULL,
      j,
      0,
      j,
      true
    );
    
    v_seeded_participants := v_seeded_participants || jsonb_build_object(
      'player_id', NULL,
      'name', 'BYE',
      'seed', j,
      'elo', 0,
      'is_bye', true
    );
  END LOOP;
  
  -- Generate matches for single elimination - ONLY FIRST ROUND
  v_matches := ARRAY[]::JSONB[];
  
  IF v_tournament.tournament_type = 'single_elimination' THEN
    -- Only generate first round matches initially
    v_players_in_round := v_bracket_size;
    v_round := 1;
    v_match_in_round := 1;
    
    FOR match_idx IN 1..(v_players_in_round/2) LOOP
      v_matches := v_matches || jsonb_build_object(
        'match_id', v_current_match_id,
        'round', v_round,
        'match_number', v_match_in_round,
        'player1_seed', (2 * match_idx - 1),
        'player2_seed', (2 * match_idx),
        'status', 'scheduled'
      );
      
      v_current_match_id := v_current_match_id + 1;
      v_match_in_round := v_match_in_round + 1;
    END LOOP;
  END IF;
  
  -- Build final bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_type', v_tournament.tournament_type,
    'bracket_size', v_bracket_size,
    'participant_count', v_participant_count,
    'bye_count', v_bye_count,
    'rounds', v_rounds,
    'has_third_place_match', COALESCE(v_tournament.has_third_place_match, true),
    'seeding_method', p_seeding_method,
    'participants', v_seeded_participants,
    'matches', v_matches,
    'generated_at', now(),
    'status', 'generated'
  );
  
  -- Insert bracket record with all required columns
  INSERT INTO public.tournament_brackets (
    tournament_id, 
    bracket_data, 
    total_rounds, 
    total_players, 
    bracket_type, 
    created_at, 
    updated_at
  ) VALUES (
    p_tournament_id, 
    v_bracket_data, 
    v_rounds,
    v_participant_count,
    v_tournament.tournament_type,
    now(), 
    now()
  );
  
  -- Create tournament matches from bracket data - ONLY FIRST ROUND
  FOR match_idx IN 1..array_length(v_matches, 1) LOOP
    DECLARE
      v_player1_id UUID := NULL;
      v_player2_id UUID := NULL;
      v_player1_seed INTEGER;
      v_player2_seed INTEGER;
    BEGIN
      v_player1_seed := (v_matches[match_idx]->>'player1_seed')::INTEGER;
      v_player2_seed := (v_matches[match_idx]->>'player2_seed')::INTEGER;
      
      -- Set player IDs from seeded participants
      IF v_player1_seed IS NOT NULL AND v_player1_seed <= array_length(v_seeded_participants, 1) THEN
        -- Check if it's not a BYE
        IF v_seeded_participants[v_player1_seed]->>'is_bye' = 'false' THEN
          v_player1_id := (v_seeded_participants[v_player1_seed]->>'player_id')::UUID;
        END IF;
      END IF;
      
      IF v_player2_seed IS NOT NULL AND v_player2_seed <= array_length(v_seeded_participants, 1) THEN
        -- Check if it's not a BYE
        IF v_seeded_participants[v_player2_seed]->>'is_bye' = 'false' THEN
          v_player2_id := (v_seeded_participants[v_player2_seed]->>'player_id')::UUID;
        END IF;
      END IF;
      
      -- Only insert matches that have at least one real player
      IF v_player1_id IS NOT NULL OR v_player2_id IS NOT NULL THEN
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
          (v_matches[match_idx]->>'round')::INTEGER,
          (v_matches[match_idx]->>'match_number')::INTEGER,
          v_player1_id,
          v_player2_id,
          'scheduled',
          v_tournament.tournament_start,
          now(),
          now()
        );
      END IF;
    END;
  END LOOP;
  
  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'registration_closed',
      updated_at = now()
  WHERE id = p_tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'bracket_id', (SELECT id FROM public.tournament_brackets WHERE tournament_id = p_tournament_id),
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'rounds', v_rounds,
    'matches_created', array_length(v_matches, 1),
    'has_third_place_match', COALESCE(v_tournament.has_third_place_match, true),
    'bracket_data', v_bracket_data
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM,
      'details', SQLSTATE,
      'tournament_id', p_tournament_id,
      'participant_count', v_participant_count
    );
END;
$function$;

-- Update advance_tournament_winner to auto-create third place match
CREATE OR REPLACE FUNCTION public.advance_tournament_winner(
  p_match_id uuid,
  p_winner_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_match RECORD;
  v_tournament RECORD;
  v_next_round INTEGER;
  v_next_match_number INTEGER;
  v_max_round INTEGER;
  v_next_match_id UUID;
  v_third_place_match_id UUID;
  v_final_round INTEGER;
  v_semifinal_losers UUID[];
BEGIN
  -- Get current match details
  SELECT * INTO v_match
  FROM public.tournament_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match not found');
  END IF;
  
  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = v_match.tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Validate winner is one of the players
  IF p_winner_id != v_match.player1_id AND p_winner_id != v_match.player2_id THEN
    RETURN jsonb_build_object('error', 'Winner must be one of the match players');
  END IF;
  
  -- Get max round number
  SELECT MAX(round_number) INTO v_max_round
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id;
  
  -- Determine final round (considering third place match)
  v_final_round := v_max_round;
  IF v_tournament.tournament_type = 'single_elimination' AND COALESCE(v_tournament.has_third_place_match, true) THEN
    v_final_round := v_max_round - 1;
  END IF;
  
  -- If this is the final match, just update and finish
  IF v_match.round_number = v_final_round AND v_match.match_number = 1 THEN
    UPDATE public.tournament_matches
    SET winner_id = p_winner_id,
        status = 'completed',
        actual_end_time = now(),
        updated_at = now()
    WHERE id = p_match_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Tournament final completed',
      'tournament_winner', p_winner_id
    );
  END IF;
  
  -- Update current match
  UPDATE public.tournament_matches
  SET winner_id = p_winner_id,
      status = 'completed',
      actual_end_time = now(),
      updated_at = now()
  WHERE id = p_match_id;
  
  -- Check if this completes the semi-finals and we need to create third place match
  IF v_match.round_number = (v_final_round - 1) AND v_tournament.tournament_type = 'single_elimination' 
     AND COALESCE(v_tournament.has_third_place_match, true) THEN
    
    -- Get semi-final losers
    SELECT ARRAY_AGG(
      CASE 
        WHEN winner_id = player1_id THEN player2_id
        WHEN winner_id = player2_id THEN player1_id
        ELSE NULL
      END
    ) INTO v_semifinal_losers
    FROM public.tournament_matches
    WHERE tournament_id = v_match.tournament_id
    AND round_number = (v_final_round - 1)
    AND winner_id IS NOT NULL;
    
    -- If we have both semi-final losers, create third place match
    IF array_length(v_semifinal_losers, 1) = 2 AND v_semifinal_losers[1] IS NOT NULL AND v_semifinal_losers[2] IS NOT NULL THEN
      -- Check if third place match doesn't already exist
      IF NOT EXISTS (
        SELECT 1 FROM public.tournament_matches 
        WHERE tournament_id = v_match.tournament_id 
        AND round_number = v_max_round 
        AND match_number = 2
        AND is_third_place_match = true
      ) THEN
        INSERT INTO public.tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          is_third_place_match,
          scheduled_time,
          created_at,
          updated_at
        ) VALUES (
          v_match.tournament_id,
          v_max_round,
          2,
          v_semifinal_losers[1],
          v_semifinal_losers[2],
          'scheduled',
          true,
          v_tournament.tournament_start,
          now(),
          now()
        ) RETURNING id INTO v_third_place_match_id;
      END IF;
    END IF;
  END IF;
  
  -- Calculate next round for winner advancement
  v_next_round := v_match.round_number + 1;
  v_next_match_number := CEIL(v_match.match_number / 2.0);
  
  -- Skip third place match slot for final match advancement
  IF v_next_round = v_max_round AND v_next_match_number = 2 
     AND v_tournament.tournament_type = 'single_elimination' 
     AND COALESCE(v_tournament.has_third_place_match, true) THEN
    v_next_match_number := 1;
  END IF;
  
  -- Find or create next match
  SELECT id INTO v_next_match_id
  FROM public.tournament_matches
  WHERE tournament_id = v_match.tournament_id
  AND round_number = v_next_round
  AND match_number = v_next_match_number
  AND (is_third_place_match = false OR is_third_place_match IS NULL);
  
  IF v_next_match_id IS NULL THEN
    -- Create next round match
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
      v_match.tournament_id,
      v_next_round,
      v_next_match_number,
      CASE WHEN v_match.match_number % 2 = 1 THEN p_winner_id ELSE NULL END,
      CASE WHEN v_match.match_number % 2 = 0 THEN p_winner_id ELSE NULL END,
      'scheduled',
      v_tournament.tournament_start,
      now(),
      now()
    ) RETURNING id INTO v_next_match_id;
  ELSE
    -- Update existing next match with winner
    UPDATE public.tournament_matches
    SET 
      player1_id = CASE 
        WHEN player1_id IS NULL AND v_match.match_number % 2 = 1 THEN p_winner_id
        ELSE player1_id
      END,
      player2_id = CASE 
        WHEN player2_id IS NULL AND v_match.match_number % 2 = 0 THEN p_winner_id
        ELSE player2_id
      END,
      updated_at = now()
    WHERE id = v_next_match_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'current_match_id', p_match_id,
    'next_match_id', v_next_match_id,
    'winner_id', p_winner_id,
    'third_place_match_id', v_third_place_match_id,
    'round_advanced_to', v_next_round
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to advance winner: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$function$;
