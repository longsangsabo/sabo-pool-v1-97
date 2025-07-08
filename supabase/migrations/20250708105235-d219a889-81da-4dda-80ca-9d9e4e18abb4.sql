-- Drop function cũ nếu tồn tại
DROP FUNCTION IF EXISTS public.get_tournament_registration_priority(uuid);
DROP FUNCTION IF EXISTS public.club_confirm_payment(uuid, uuid, text, text);

-- Tạo function để lấy danh sách đăng ký giải đấu theo thứ tự ưu tiên
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
    COALESCE(pr.elo_points, 1000) as elo_rating,
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

-- Tạo function để CLB xác nhận thanh toán
CREATE OR REPLACE FUNCTION public.club_confirm_payment(
  p_registration_id uuid,
  p_club_user_id uuid,
  p_payment_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration RECORD;
  v_tournament RECORD;
  v_confirmed_count INTEGER;
  v_new_status TEXT;
BEGIN
  -- Lấy thông tin đăng ký
  SELECT * INTO v_registration
  FROM public.tournament_registrations
  WHERE id = p_registration_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Không tìm thấy đăng ký');
  END IF;
  
  -- Lấy thông tin giải đấu
  SELECT * INTO v_tournament
  FROM public.tournaments
  WHERE id = v_registration.tournament_id;
  
  -- Kiểm tra quyền CLB
  IF v_tournament.created_by != p_club_user_id THEN
    RETURN jsonb_build_object('error', 'Không có quyền xác nhận thanh toán cho giải đấu này');
  END IF;
  
  -- Đếm số người đã được xác nhận thanh toán
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.tournament_registrations
  WHERE tournament_id = v_registration.tournament_id
  AND payment_status = 'paid'
  AND status = 'confirmed';
  
  -- Xác định trạng thái mới
  IF v_confirmed_count < v_tournament.max_participants THEN
    v_new_status := 'confirmed';
  ELSE
    v_new_status := 'waitlisted';
  END IF;
  
  -- Cập nhật trạng thái thanh toán
  UPDATE public.tournament_registrations
  SET 
    payment_status = 'paid',
    status = v_new_status,
    payment_method = p_payment_method,
    payment_confirmed_at = now(),
    admin_notes = p_notes,
    updated_at = now()
  WHERE id = p_registration_id;
  
  -- Cập nhật số lượng participants trong tournament
  UPDATE public.tournaments
  SET 
    current_participants = (
      SELECT COUNT(*) 
      FROM public.tournament_registrations 
      WHERE tournament_id = v_registration.tournament_id 
      AND status = 'confirmed'
    ),
    updated_at = now()
  WHERE id = v_registration.tournament_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'new_status', v_new_status,
    'payment_method', p_payment_method,
    'confirmed_count', v_confirmed_count + 1
  );
END;
$$;