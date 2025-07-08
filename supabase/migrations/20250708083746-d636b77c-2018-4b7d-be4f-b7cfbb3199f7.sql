-- Create the main generate_advanced_tournament_bracket function that works with 16 players

CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'elo_ranking',
  p_force_regenerate BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
          ELSE RANDOM()::INTEGER
        END DESC
      ) as seed_order
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.registration_status = 'confirmed';
  v_participant RECORD;
  i INTEGER := 1;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
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
  
  -- Get participant count
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id AND registration_status = 'confirmed';
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', 'Minimum 2 participants required');
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('error', 'Maximum 64 participants allowed');
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2^CEIL(LOG(2, v_participant_count));
  v_rounds := LOG(2, v_bracket_size)::INTEGER;
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
  
  -- Generate matches based on tournament type
  v_matches := ARRAY[]::JSONB[];
  
  IF v_tournament.tournament_type = 'single_elimination' THEN
    -- Generate single elimination bracket
    v_players_in_round := v_bracket_size;
    
    FOR v_round IN 1..v_rounds LOOP
      v_match_in_round := 1;
      
      FOR match_idx IN 1..(v_players_in_round/2) LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', v_round,
          'match_number', v_match_in_round,
          'player1_seed', CASE 
            WHEN v_round = 1 THEN (2 * match_idx - 1)
            ELSE NULL
          END,
          'player2_seed', CASE 
            WHEN v_round = 1 THEN (2 * match_idx)
            ELSE NULL
          END,
          'status', 'scheduled',
          'winner_advances_to_match', CASE 
            WHEN v_round < v_rounds THEN (v_current_match_id + v_players_in_round/2)
            ELSE NULL
          END
        );
        
        v_current_match_id := v_current_match_id + 1;
        v_match_in_round := v_match_in_round + 1;
      END LOOP;
      
      v_players_in_round := v_players_in_round / 2;
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
    'seeding_method', p_seeding_method,
    'participants', v_seeded_participants,
    'matches', v_matches,
    'generated_at', now(),
    'status', 'generated'
  );
  
  -- Insert bracket record
  INSERT INTO public.tournament_brackets (
    tournament_id, bracket_data, bracket_type, total_players, total_rounds, current_round, status, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_bracket_data, v_tournament.tournament_type, v_participant_count, v_rounds, 1, 'generated', now(), now()
  );
  
  -- Create tournament matches from bracket data
  FOR match_idx IN 1..array_length(v_matches, 1) LOOP
    INSERT INTO public.tournament_matches (
      tournament_id,
      round_number,
      match_number,
      player1_id,
      player2_id,
      status,
      scheduled_time,
      previous_match_1,
      previous_match_2
    ) VALUES (
      p_tournament_id,
      (v_matches[match_idx]->>'round')::INTEGER,
      (v_matches[match_idx]->>'match_number')::INTEGER,
      CASE 
        WHEN (v_matches[match_idx]->>'player1_seed')::INTEGER IS NOT NULL 
        AND (v_matches[match_idx]->>'player1_seed')::INTEGER <= array_length(v_seeded_participants, 1) THEN
          (v_seeded_participants[(v_matches[match_idx]->>'player1_seed')::INTEGER]->>'player_id')::UUID
        ELSE NULL
      END,
      CASE 
        WHEN (v_matches[match_idx]->>'player2_seed')::INTEGER IS NOT NULL
        AND (v_matches[match_idx]->>'player2_seed')::INTEGER <= array_length(v_seeded_participants, 1) THEN
          (v_seeded_participants[(v_matches[match_idx]->>'player2_seed')::INTEGER]->>'player_id')::UUID
        ELSE NULL
      END,
      'scheduled',
      v_tournament.tournament_start + INTERVAL '1 hour' * ((v_matches[match_idx]->>'round')::INTEGER - 1),
      CASE 
        WHEN (v_matches[match_idx]->>'round')::INTEGER > 1 THEN ((v_matches[match_idx]->>'match_number')::INTEGER * 2 - 1)
        ELSE NULL
      END,
      CASE 
        WHEN (v_matches[match_idx]->>'round')::INTEGER > 1 THEN ((v_matches[match_idx]->>'match_number')::INTEGER * 2)
        ELSE NULL
      END
    );
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
    'bracket_data', v_bracket_data
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM,
      'details', SQLSTATE
    );
END;
$$;