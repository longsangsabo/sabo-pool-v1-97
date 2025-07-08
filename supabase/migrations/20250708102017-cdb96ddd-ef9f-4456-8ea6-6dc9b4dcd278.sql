-- Tạo logic tự động cho việc quản lý đăng ký giải đấu với ưu tiên thanh toán

-- Tạo trigger function để tự động cập nhật trạng thái đăng ký khi thanh toán
CREATE OR REPLACE FUNCTION public.auto_confirm_paid_registration()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_tournament RECORD;
  v_confirmed_count INTEGER;
BEGIN
  -- Chỉ xử lý khi payment_status chuyển thành 'paid'
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Cập nhật registration_status thành 'confirmed'
    NEW.registration_status := 'confirmed';
    NEW.status := 'confirmed';
    NEW.updated_at := now();
    
    -- Lấy thông tin giải đấu
    SELECT * INTO v_tournament 
    FROM public.tournaments 
    WHERE id = NEW.tournament_id;
    
    -- Đếm số người đã được xác nhận thanh toán
    SELECT COUNT(*) INTO v_confirmed_count
    FROM public.tournament_registrations
    WHERE tournament_id = NEW.tournament_id 
    AND payment_status = 'paid' 
    AND registration_status = 'confirmed';
    
    -- Nếu đủ số lượng tối đa, tự động đóng đăng ký
    IF v_confirmed_count >= v_tournament.max_participants THEN
      -- Cập nhật trạng thái giải đấu
      UPDATE public.tournaments 
      SET 
        status = 'registration_closed',
        current_participants = v_confirmed_count,
        updated_at = now()
      WHERE id = NEW.tournament_id;
      
      -- Hủy các đăng ký chưa thanh toán
      UPDATE public.tournament_registrations
      SET 
        registration_status = 'waitlisted',
        status = 'waitlisted',
        updated_at = now()
      WHERE tournament_id = NEW.tournament_id 
      AND payment_status != 'paid';
      
      -- Tự động tạo bảng đấu
      PERFORM public.generate_advanced_tournament_bracket(
        NEW.tournament_id, 
        'elo_ranking', 
        false
      );
      
      -- Tạo thông báo cho tất cả người tham gia
      INSERT INTO public.notifications (user_id, type, title, message, priority)
      SELECT 
        tr.player_id,
        'tournament_bracket_ready',
        'Bảng đấu đã sẵn sàng!',
        format('Giải đấu "%s" đã đủ người và bảng đấu đã được tạo tự động.', v_tournament.name),
        'high'
      FROM public.tournament_registrations tr
      WHERE tr.tournament_id = NEW.tournament_id 
      AND tr.payment_status = 'paid'
      AND tr.registration_status = 'confirmed';
    ELSE
      -- Cập nhật số lượng người tham gia hiện tại
      UPDATE public.tournaments 
      SET 
        current_participants = v_confirmed_count,
        updated_at = now()
      WHERE id = NEW.tournament_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Tạo trigger cho tournament_registrations
DROP TRIGGER IF EXISTS auto_confirm_paid_registration_trigger ON public.tournament_registrations;
CREATE TRIGGER auto_confirm_paid_registration_trigger
  BEFORE UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_paid_registration();

-- Tạo function để club xác nhận thanh toán cho user
CREATE OR REPLACE FUNCTION public.club_confirm_payment(
  p_registration_id uuid,
  p_club_user_id uuid,
  p_payment_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_registration RECORD;
  v_tournament RECORD;
  v_club_profile RECORD;
BEGIN
  -- Lấy thông tin đăng ký
  SELECT * INTO v_registration 
  FROM public.tournament_registrations 
  WHERE id = p_registration_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Registration not found');
  END IF;
  
  -- Lấy thông tin giải đấu
  SELECT * INTO v_tournament 
  FROM public.tournaments 
  WHERE id = v_registration.tournament_id;
  
  -- Kiểm tra quyền của club (người tạo giải hoặc admin)
  IF v_tournament.created_by != p_club_user_id AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_club_user_id AND is_admin = true
  ) THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;
  
  -- Cập nhật trạng thái thanh toán
  UPDATE public.tournament_registrations
  SET 
    payment_status = 'paid',
    payment_confirmed_by = p_club_user_id,
    payment_confirmed_at = now(),
    payment_method = p_payment_method,
    admin_notes = COALESCE(admin_notes, '') || format(' [%s] Payment confirmed: %s', 
      to_char(now(), 'YYYY-MM-DD HH24:MI'), 
      COALESCE(p_notes, 'No notes')
    ),
    updated_at = now()
  WHERE id = p_registration_id;
  
  -- Tạo thông báo cho người chơi
  INSERT INTO public.notifications (user_id, type, title, message, priority)
  VALUES (
    v_registration.player_id,
    'payment_confirmed',
    'Thanh toán đã được xác nhận',
    format('Thanh toán của bạn cho giải đấu "%s" đã được xác nhận.', v_tournament.name),
    'normal'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Payment confirmed successfully',
    'registration_id', p_registration_id
  );
END;
$function$;

-- Tạo function để xem danh sách ưu tiên đăng ký
CREATE OR REPLACE FUNCTION public.get_tournament_registration_priority(p_tournament_id uuid)
 RETURNS TABLE(
   registration_id uuid,
   player_id uuid,
   player_name text,
   elo_rating integer,
   registration_date timestamp with time zone,
   payment_status text,
   registration_status text,
   priority_order integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id as registration_id,
    tr.player_id,
    COALESCE(p.full_name, p.display_name, 'Unknown') as player_name,
    COALESCE(pr.elo_points, 1000) as elo_rating,
    tr.registration_date,
    tr.payment_status,
    tr.registration_status,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE tr.payment_status 
          WHEN 'paid' THEN 1 
          WHEN 'pending' THEN 2 
          ELSE 3 
        END,
        COALESCE(pr.elo_points, 1000) DESC,
        tr.registration_date ASC
    )::integer as priority_order
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.player_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
  WHERE tr.tournament_id = p_tournament_id
  ORDER BY priority_order;
END;
$function$;

-- Cập nhật function generate bracket để tạo full bracket (16 rounds)
CREATE OR REPLACE FUNCTION public.generate_complete_tournament_bracket(
  p_tournament_id uuid, 
  p_seeding_method text DEFAULT 'elo_ranking'
)
 RETURNS jsonb
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
  v_seeded_participants JSONB[];
  v_participant_cursor CURSOR FOR 
    SELECT 
      tr.player_id as user_id,
      COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
      COALESCE(pr.elo_points, 1000) as elo_rating,
      tr.registration_date,
      ROW_NUMBER() OVER (ORDER BY COALESCE(pr.elo_points, 1000) DESC) as seed_order
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
    WHERE tr.tournament_id = p_tournament_id 
    AND tr.payment_status = 'paid'
    AND tr.registration_status = 'confirmed'
    ORDER BY COALESCE(pr.elo_points, 1000) DESC;
  v_participant RECORD;
  i INTEGER := 1;
  round_num INTEGER;
  matches_in_round INTEGER;
  match_num INTEGER;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  -- Get confirmed participants
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id 
  AND payment_status = 'paid'
  AND registration_status = 'confirmed';
  
  v_bracket_size := v_participant_count;
  v_rounds := CASE 
    WHEN v_bracket_size <= 2 THEN 1
    WHEN v_bracket_size <= 4 THEN 2  
    WHEN v_bracket_size <= 8 THEN 3
    WHEN v_bracket_size <= 16 THEN 4
    WHEN v_bracket_size <= 32 THEN 5
    ELSE 6
  END;
  
  -- Clear existing data
  DELETE FROM public.tournament_matches WHERE tournament_id = p_tournament_id;
  DELETE FROM public.tournament_seeding WHERE tournament_id = p_tournament_id;
  DELETE FROM public.tournament_brackets WHERE tournament_id = p_tournament_id;
  
  -- Generate seeded participants
  v_seeded_participants := ARRAY[]::JSONB[];
  FOR v_participant IN v_participant_cursor LOOP
    INSERT INTO public.tournament_seeding (
      tournament_id, player_id, seed_position, elo_rating, registration_order, is_bye
    ) VALUES (
      p_tournament_id, v_participant.user_id, i, v_participant.elo_rating, i, false
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
  
  -- Generate all rounds matches
  v_matches := ARRAY[]::JSONB[];
  matches_in_round := v_bracket_size / 2;
  
  FOR round_num IN 1..v_rounds LOOP
    FOR match_num IN 1..matches_in_round LOOP
      v_matches := v_matches || jsonb_build_object(
        'match_id', v_current_match_id,
        'round', round_num,
        'match_number', match_num,
        'player1_seed', CASE WHEN round_num = 1 THEN (2 * match_num - 1) ELSE NULL END,
        'player2_seed', CASE WHEN round_num = 1 THEN (2 * match_num) ELSE NULL END,
        'status', 'scheduled'
      );
      v_current_match_id := v_current_match_id + 1;
    END LOOP;
    matches_in_round := matches_in_round / 2;
  END LOOP;
  
  -- Build bracket data
  v_bracket_data := jsonb_build_object(
    'tournament_id', p_tournament_id,
    'tournament_type', 'single_elimination',
    'bracket_size', v_bracket_size,
    'participant_count', v_participant_count,
    'rounds', v_rounds,
    'participants', v_seeded_participants,
    'matches', v_matches,
    'generated_at', now(),
    'status', 'completed'
  );
  
  -- Insert bracket
  INSERT INTO public.tournament_brackets (
    tournament_id, bracket_data, total_rounds, total_players, 
    bracket_type, created_at, updated_at
  ) VALUES (
    p_tournament_id, v_bracket_data, v_rounds, v_participant_count,
    'single_elimination', now(), now()
  );
  
  -- Create all tournament matches
  FOR match_idx IN 1..array_length(v_matches, 1) LOOP
    DECLARE
      v_player1_id UUID := NULL;
      v_player2_id UUID := NULL;
      v_round INTEGER := (v_matches[match_idx]->>'round')::INTEGER;
      v_player1_seed INTEGER := (v_matches[match_idx]->>'player1_seed')::INTEGER;
      v_player2_seed INTEGER := (v_matches[match_idx]->>'player2_seed')::INTEGER;
    BEGIN
      -- Set players only for first round
      IF v_round = 1 THEN
        IF v_player1_seed IS NOT NULL AND v_player1_seed <= array_length(v_seeded_participants, 1) THEN
          v_player1_id := (v_seeded_participants[v_player1_seed]->>'player_id')::UUID;
        END IF;
        
        IF v_player2_seed IS NOT NULL AND v_player2_seed <= array_length(v_seeded_participants, 1) THEN
          v_player2_id := (v_seeded_participants[v_player2_seed]->>'player_id')::UUID;
        END IF;
      END IF;
      
      -- Insert match (first round has players, later rounds will be populated by winners)
      INSERT INTO public.tournament_matches (
        tournament_id, round_number, match_number,
        player1_id, player2_id, status,
        scheduled_time, created_at, updated_at
      ) VALUES (
        p_tournament_id, v_round, (v_matches[match_idx]->>'match_number')::INTEGER,
        v_player1_id, v_player2_id, 'scheduled',
        v_tournament.tournament_start + INTERVAL '1 hour' * (v_round - 1),
        now(), now()
      );
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'participant_count', v_participant_count,
    'rounds', v_rounds,
    'matches_created', array_length(v_matches, 1)
  );
END;
$function$;