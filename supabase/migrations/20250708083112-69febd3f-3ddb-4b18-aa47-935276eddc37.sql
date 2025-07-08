-- Recreate the admin_add_users_to_tournament function with correct table references
-- Now that tournaments table exists, this should work properly

CREATE OR REPLACE FUNCTION public.admin_add_users_to_tournament(
  p_tournament_id UUID,
  p_user_ids UUID[],
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tournament_record RECORD;
  user_count INTEGER;
  available_slots INTEGER;
  inserted_count INTEGER := 0;
  result jsonb;
BEGIN
  -- Get tournament info (now this will work since tournaments table exists!)
  SELECT * INTO tournament_record
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Tournament not found',
      'tournament_id', p_tournament_id
    );
  END IF;
  
  -- Check available slots
  SELECT COUNT(*) INTO user_count
  FROM public.tournament_registrations 
  WHERE tournament_id = p_tournament_id;
  
  available_slots := tournament_record.max_participants - user_count;
  
  IF array_length(p_user_ids, 1) > available_slots THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Not enough slots available',
      'available_slots', available_slots,
      'requested', array_length(p_user_ids, 1),
      'current_participants', user_count,
      'max_participants', tournament_record.max_participants
    );
  END IF;
  
  -- Insert registrations
  INSERT INTO public.tournament_registrations (
    tournament_id, player_id, registration_status, payment_status,
    status, added_by_admin, admin_notes, registration_date
  )
  SELECT 
    p_tournament_id, 
    unnest(p_user_ids),
    'confirmed',
    'paid',
    'confirmed', 
    p_admin_id,
    p_notes,
    now()
  ON CONFLICT (tournament_id, player_id) DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  
  -- Update tournament participant count
  UPDATE public.tournaments 
  SET 
    current_participants = (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    ),
    updated_at = now()
  WHERE id = p_tournament_id;
  
  -- Mark demo users as in use
  UPDATE public.demo_user_pool 
  SET 
    is_available = false, 
    currently_used_in = p_tournament_id::TEXT,
    last_used_at = now()
  WHERE user_id = ANY(p_user_ids);
  
  result := jsonb_build_object(
    'success', true,
    'added_count', inserted_count,
    'tournament_name', tournament_record.name,
    'tournament_id', p_tournament_id,
    'new_participant_count', (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    ),
    'available_slots_remaining', tournament_record.max_participants - (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    )
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM,
    'error_code', SQLSTATE,
    'error_detail', SQLSTATE || ': ' || SQLERRM
  );
END;
$$;