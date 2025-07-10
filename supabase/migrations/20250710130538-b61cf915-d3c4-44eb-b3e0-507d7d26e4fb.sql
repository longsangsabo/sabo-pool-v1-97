-- Simple fix for the null participant count issue
UPDATE public.tournaments SET has_third_place_match = COALESCE(has_third_place_match, true) WHERE has_third_place_match IS NULL;

-- Fix the participant count issue by ensuring it's never null
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
  
  -- Get participant count with valid profiles only - Fix null issue with COALESCE
  SELECT COALESCE(COUNT(*), 0) INTO v_participant_count
  FROM public.tournament_registrations tr
  INNER JOIN public.profiles p ON tr.player_id = p.user_id
  WHERE tr.tournament_id = p_tournament_id 
  AND tr.registration_status = 'confirmed'
  AND tr.player_id IS NOT NULL;
  
  -- Ensure participant count is never null
  v_participant_count := COALESCE(v_participant_count, 0);
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('error', format('Minimum 2 participants required. Found: %s', v_participant_count));
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('error', format('Maximum 64 participants allowed. Found: %s', v_participant_count));
  END IF;
  
  -- Calculate bracket size (next power of 2)
  v_bracket_size := 2^CEIL(LOG(2, v_participant_count));
  v_rounds := LOG(2, v_bracket_size)::INTEGER;
  v_bye_count := v_bracket_size - v_participant_count;
  
  -- Clear existing data if force regenerating
  IF p_force_regenerate THEN
    DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
    DELETE FROM public.tournament_seeding WHERE tournament_id = p_tournament_id;
    DELETE FROM public.tournament_brackets WHERE tournament_id = p_tournament_id;
  END IF;
  
  -- Create tournament bracket record
  INSERT INTO public.tournament_brackets (
    tournament_id,
    bracket_type,
    total_rounds,
    current_round,
    bracket_data,
    status
  ) VALUES (
    p_tournament_id,
    'single_elimination',
    v_rounds,
    1,
    jsonb_build_object('participants_count', v_participant_count, 'bracket_size', v_bracket_size),
    'active'
  ) RETURNING id INTO v_bracket_id;
  
  -- Generate seeded participants
  v_seeded_participants := ARRAY[]::JSONB[];
  i := 1;
  
  -- Open cursor and process participants - only if count > 0
  IF v_participant_count > 0 THEN
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
  END IF;
  
  -- Add bye players if needed
  IF v_bye_count > 0 THEN
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
  END IF;
  
  -- Generate matches for single elimination bracket
  v_matches := ARRAY[]::JSONB[];
  v_players_in_round := v_bracket_size;
  
  -- Generate regular rounds
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
        'bracket_type', 'main'
      );
      
      v_current_match_id := v_current_match_id + 1;
      v_match_in_round := v_match_in_round + 1;
    END LOOP;
    
    v_players_in_round := v_players_in_round / 2;
  END LOOP;
  
  -- Add third place match if enabled and we have enough participants
  IF v_tournament.has_third_place_match AND v_participant_count >= 4 THEN
    v_matches := v_matches || jsonb_build_object(
      'match_id', v_current_match_id,
      'round', v_rounds,
      'match_number', 999,
      'player1_seed', NULL,
      'player2_seed', NULL,
      'bracket_type', 'third_place'
    );
  END IF;

  -- Create tournament matches from bracket data
  IF array_length(v_matches, 1) > 0 THEN
    FOR match_idx IN 1..array_length(v_matches, 1) LOOP
      DECLARE
        v_match JSONB := v_matches[match_idx];
        v_player1_id UUID;
        v_player2_id UUID;
      BEGIN
        -- Get player IDs from seeding for first round only
        IF (v_match->>'round')::INTEGER = 1 AND (v_match->>'bracket_type')::TEXT = 'main' THEN
          SELECT player_id INTO v_player1_id 
          FROM public.tournament_seeding 
          WHERE tournament_id = p_tournament_id 
          AND seed_position = (v_match->>'player1_seed')::INTEGER;
          
          SELECT player_id INTO v_player2_id 
          FROM public.tournament_seeding 
          WHERE tournament_id = p_tournament_id 
          AND seed_position = (v_match->>'player2_seed')::INTEGER;
        END IF;
        
        INSERT INTO public.tournament_matches (
          tournament_id,
          round_number,
          match_number,
          player1_id,
          player2_id,
          status,
          bracket_type,
          scheduled_time
        ) VALUES (
          p_tournament_id,
          (v_match->>'round')::INTEGER,
          (v_match->>'match_number')::INTEGER,
          v_player1_id,
          v_player2_id,
          'pending',
          COALESCE(v_match->>'bracket_type', 'main'),
          v_tournament.tournament_start
        );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'bracket_id', v_bracket_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'rounds', v_rounds,
    'matches_created', array_length(v_matches, 1),
    'bye_count', v_bye_count,
    'has_third_place_match', v_tournament.has_third_place_match
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM,
      'detail', 'Check tournament participants and try again'
    );
END;
$function$;