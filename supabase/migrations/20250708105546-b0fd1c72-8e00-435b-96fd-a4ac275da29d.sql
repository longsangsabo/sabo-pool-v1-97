-- Cập nhật dữ liệu test cho tất cả 17 demo users
UPDATE public.tournament_registrations 
SET 
  payment_status = 'pending',
  status = 'pending', 
  payment_method = 'cash',
  payment_confirmed_at = NULL,
  admin_notes = 'Đã đóng tiền mặt tại CLB, chờ xác nhận',
  updated_at = now()
WHERE tournament_id = '33333333-3333-3333-3333-333333333333';

-- Reset tournament về trạng thái chờ xác nhận
UPDATE public.tournaments 
SET 
  current_participants = 0,
  status = 'registration_open',
  updated_at = now()
WHERE id = '33333333-3333-3333-3333-333333333333';