-- Add admin tracking columns to tournament_registrations
ALTER TABLE tournament_registrations 
ADD COLUMN IF NOT EXISTS added_by_admin UUID REFERENCES profiles(user_id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_admin 
ON tournament_registrations(added_by_admin) WHERE added_by_admin IS NOT NULL;

-- Create admin function to add users to tournament
CREATE OR REPLACE FUNCTION admin_add_users_to_tournament(
  p_tournament_id UUID,
  p_user_ids UUID[],
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  tournament_record RECORD;
  user_count INTEGER;
  available_slots INTEGER;
  registration_data jsonb[];
  result jsonb;
BEGIN
  -- Get tournament info
  SELECT * INTO tournament_record
  FROM public.tournaments 
  WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
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
      'requested', array_length(p_user_ids, 1)
    );
  END IF;
  
  -- Insert registrations
  INSERT INTO public.tournament_registrations (
    tournament_id, player_id, registration_status, payment_status,
    added_by_admin, admin_notes, registration_date
  )
  SELECT 
    p_tournament_id, 
    unnest(p_user_ids),
    'confirmed',
    'paid',
    p_admin_id,
    p_notes,
    now()
  ON CONFLICT (tournament_id, player_id) DO NOTHING;
  
  -- Update tournament participant count
  UPDATE public.tournaments 
  SET current_participants = (
    SELECT COUNT(*) FROM public.tournament_registrations 
    WHERE tournament_id = p_tournament_id
  )
  WHERE id = p_tournament_id;
  
  -- Reserve demo users if they are demo users
  UPDATE public.demo_user_pool 
  SET is_available = false, 
      currently_used_in = p_tournament_id::TEXT,
      last_used_at = now()
  WHERE user_id = ANY(p_user_ids);
  
  result := jsonb_build_object(
    'success', true,
    'added_count', array_length(p_user_ids, 1),
    'tournament_name', tournament_record.name,
    'new_participant_count', (
      SELECT COUNT(*) FROM public.tournament_registrations 
      WHERE tournament_id = p_tournament_id
    )
  );
  
  RETURN result;
END;
$$;