-- Update bracket generation function to support 3rd place match
CREATE OR REPLACE FUNCTION public.generate_advanced_tournament_bracket(
  p_tournament_id uuid, 
  p_seeding_method text DEFAULT 'elo_ranking'::text, 
  p_force_regenerate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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
  -- For single elimination with 3rd place match, we need one extra round
  v_rounds := LOG(2, v_bracket_size)::INTEGER + 1;
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
  
  -- Build final bracket data (includes space for 3rd place match)
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_type', v_tournament.tournament_type,
    'bracket_size', v_bracket_size,
    'participant_count', v_participant_count,
    'bye_count', v_bye_count,
    'rounds', v_rounds,
    'has_third_place_match', true,
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
    'has_third_place_match', true,
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
$$;

-- Add function to create 3rd place match after semi-finals complete
CREATE OR REPLACE FUNCTION public.create_third_place_match(p_tournament_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_semifinal_losers UUID[];
  v_max_round INTEGER;
  v_third_place_match_id UUID;
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;
  
  -- Get max round number
  SELECT MAX(round_number) INTO v_max_round 
  FROM public.tournament_matches 
  WHERE tournament_id = p_tournament_id;
  
  -- Check if 3rd place match already exists
  IF EXISTS (
    SELECT 1 FROM public.tournament_matches 
    WHERE tournament_id = p_tournament_id 
    AND round_number = v_max_round 
    AND match_number = 2
    AND is_third_place_match = true
  ) THEN
    RETURN jsonb_build_object('error', 'Third place match already exists');
  END IF;
  
  -- Get losers from semi-finals (round before final)
  SELECT ARRAY_AGG(
    CASE 
      WHEN winner_id = player1_id THEN player2_id
      WHEN winner_id = player2_id THEN player1_id
      ELSE NULL
    END
  ) INTO v_semifinal_losers
  FROM public.tournament_matches
  WHERE tournament_id = p_tournament_id
  AND round_number = v_max_round - 1
  AND winner_id IS NOT NULL;
  
  -- Check if we have exactly 2 semi-final losers
  IF array_length(v_semifinal_losers, 1) != 2 OR v_semifinal_losers[1] IS NULL OR v_semifinal_losers[2] IS NULL THEN
    RETURN jsonb_build_object('error', 'Semi-finals not completed or invalid results');
  END IF;
  
  -- Create 3rd place match
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
    p_tournament_id,
    v_max_round, -- Same round as final
    2, -- Match number 2 (final is match 1)
    v_semifinal_losers[1],
    v_semifinal_losers[2],
    'scheduled',
    true,
    v_tournament.tournament_start,
    now(),
    now()
  ) RETURNING id INTO v_third_place_match_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'third_place_match_id', v_third_place_match_id,
    'player1_id', v_semifinal_losers[1],
    'player2_id', v_semifinal_losers[2]
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to create third place match: ' || SQLERRM
    );
END;
$function$;

-- Add column to track third place matches
ALTER TABLE public.tournament_matches 
ADD COLUMN IF NOT EXISTS is_third_place_match BOOLEAN DEFAULT false;