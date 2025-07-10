-- Fix the null participant count issue in bracket generation
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id UUID,
  p_seeding_method TEXT DEFAULT 'elo_ranking',
  p_regenerate BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participants RECORD[];
  v_participant_count INTEGER;
  v_bracket_size INTEGER;
  v_rounds INTEGER;
  v_bye_count INTEGER;
  v_participant RECORD;
  v_seeded_participants JSONB[];
  v_matches JSONB[];
  v_players_in_round INTEGER;
  v_match_in_round INTEGER;
  v_current_match_id INTEGER := 1;
BEGIN
  -- Check if user is admin or tournament creator
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ) AND NOT EXISTS (
    SELECT 1 FROM public.tournaments 
    WHERE id = p_tournament_id AND created_by = auth.uid()
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized: Admin or tournament creator access required');
  END IF;

  -- Get tournament details
  SELECT * INTO v_tournament
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  IF NOT p_regenerate AND EXISTS (
    SELECT 1 FROM public.tournament_matches WHERE tournament_id = p_tournament_id
  ) THEN
    RETURN jsonb_build_object('error', 'Tournament bracket already exists');
  END IF;

  -- Clear existing matches if regenerating
  IF p_regenerate THEN
    DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  END IF;

  -- Get confirmed participants with seeding
  SELECT ARRAY(
    SELECT ROW(
      tr.user_id,
      COALESCE(p.full_name, p.email, 'Unknown Player'),
      COALESCE(pr.elo, 1000),
      tr.registration_date
    )::RECORD
  ) INTO v_participants
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.user_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.user_id = pr.player_id
  WHERE tr.tournament_id = p_tournament_id 
  AND tr.status = 'confirmed'
  ORDER BY 
    CASE p_seeding_method
      WHEN 'elo_ranking' THEN COALESCE(pr.elo, 1000)
      WHEN 'registration_order' THEN EXTRACT(EPOCH FROM tr.registration_date)::INTEGER
      ELSE RANDOM()::INTEGER
    END DESC;
  
  -- Fix the null issue by using COALESCE
  v_participant_count := COALESCE(array_length(v_participants, 1), 0);
  
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
  
  -- Clear existing seeding data
  DELETE FROM public.tournament_seeding WHERE tournament_id = p_tournament_id;
  
  -- Generate seeded participants with byes
  v_seeded_participants := ARRAY[]::JSONB[];
  
  -- Add real participants (only if we have participants)
  IF v_participant_count > 0 THEN
    FOR i IN 1..v_participant_count LOOP
      v_participant := v_participants[i];
      
      -- Insert seeding record
      INSERT INTO public.tournament_seeding (
        tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
      ) VALUES (
        p_tournament_id,
        (v_participant).f1::UUID,
        i,
        (v_participant).f3::INTEGER,
        i,
        false
      );
      
      v_seeded_participants := v_seeded_participants || jsonb_build_object(
        'player_id', (v_participant).f1,
        'name', (v_participant).f2,
        'seed', i,
        'elo', (v_participant).f3,
        'is_bye', false
      );
    END LOOP;
  END IF;
  
  -- Add bye players if needed
  IF v_bye_count > 0 THEN
    FOR i IN (v_participant_count + 1)..v_bracket_size LOOP
      INSERT INTO public.tournament_seeding (
        tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
      ) VALUES (
        p_tournament_id,
        NULL,
        i,
        0,
        i,
        true
      );
      
      v_seeded_participants := v_seeded_participants || jsonb_build_object(
        'player_id', NULL,
        'name', 'BYE',
        'seed', i,
        'elo', 0,
        'is_bye', true
      );
    END LOOP;
  END IF;
  
  -- Generate matches based on tournament type
  v_matches := ARRAY[]::JSONB[];
  
  IF v_tournament.tournament_type = 'single_elimination' THEN
    -- Generate single elimination bracket
    v_players_in_round := v_bracket_size;
    
    FOR v_round IN 1..v_rounds LOOP
      v_match_in_round := 1;
      
      FOR i IN 1..(v_players_in_round/2) LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', v_round,
          'match_number', v_match_in_round,
          'player1_seed', CASE 
            WHEN v_round = 1 THEN (2 * i - 1)
            ELSE NULL
          END,
          'player2_seed', CASE 
            WHEN v_round = 1 THEN (2 * i)
            ELSE NULL
          END,
          'status', 'pending'
        );
        
        v_current_match_id := v_current_match_id + 1;
        v_match_in_round := v_match_in_round + 1;
      END LOOP;
      
      v_players_in_round := v_players_in_round / 2;
    END LOOP;
  ELSE
    -- Generate double elimination bracket (simplified)
    v_players_in_round := v_bracket_size;
    
    FOR v_round IN 1..v_rounds LOOP
      FOR i IN 1..(v_players_in_round/2) LOOP
        v_matches := v_matches || jsonb_build_object(
          'match_id', v_current_match_id,
          'round', v_round,
          'match_number', i,
          'player1_seed', CASE 
            WHEN v_round = 1 THEN (2 * i - 1)
            ELSE NULL
          END,
          'player2_seed', CASE 
            WHEN v_round = 1 THEN (2 * i)
            ELSE NULL
          END,
          'bracket_type', 'winner',
          'status', 'pending'
        );
        
        v_current_match_id := v_current_match_id + 1;
      END LOOP;
      
      v_players_in_round := v_players_in_round / 2;
    END LOOP;
  END IF;
  
  -- Create tournament matches from bracket data
  IF array_length(v_matches, 1) > 0 THEN
    FOR i IN 1..array_length(v_matches, 1) LOOP
      DECLARE
        v_match JSONB := v_matches[i];
        v_player1_id UUID;
        v_player2_id UUID;
      BEGIN
        -- Get player IDs from seeding for first round
        IF (v_match->>'round')::INTEGER = 1 THEN
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
          COALESCE(v_match->>'status', 'pending'),
          COALESCE(v_match->>'bracket_type', 'main'),
          v_tournament.tournament_start
        );
      END;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participant_count', v_participant_count,
    'bracket_size', v_bracket_size,
    'rounds', v_rounds,
    'matches_created', array_length(v_matches, 1),
    'bye_count', v_bye_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Bracket generation failed: ' || SQLERRM
    );
END;
$$;