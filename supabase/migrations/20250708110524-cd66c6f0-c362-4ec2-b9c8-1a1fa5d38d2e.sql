
-- Fix the data type mismatch in get_tournament_registration_priority function
CREATE OR REPLACE FUNCTION public.get_tournament_registration_priority(p_tournament_id uuid)
RETURNS TABLE (
  registration_id uuid,
  player_id uuid,
  tournament_id uuid,
  payment_status text,
  registration_status text,
  registration_date timestamp with time zone,
  player_name text,
  elo_rating integer,
  priority_order integer,
  payment_method text,
  admin_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id as registration_id,
    tr.player_id,
    tr.tournament_id,
    tr.payment_status,
    tr.status as registration_status,
    tr.registration_date,
    COALESCE(p.full_name, p.display_name, 'Unknown Player') as player_name,
    COALESCE(pr.elo_points, 1000)::integer as elo_rating, -- Cast to integer
    ROW_NUMBER() OVER (ORDER BY tr.payment_confirmed_at ASC NULLS LAST, tr.registration_date ASC)::integer as priority_order,
    tr.payment_method,
    tr.admin_notes
  FROM public.tournament_registrations tr
  LEFT JOIN public.profiles p ON tr.player_id = p.user_id
  LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
  WHERE tr.tournament_id = p_tournament_id
  ORDER BY tr.payment_confirmed_at ASC NULLS LAST, tr.registration_date ASC;
END;
$$;
