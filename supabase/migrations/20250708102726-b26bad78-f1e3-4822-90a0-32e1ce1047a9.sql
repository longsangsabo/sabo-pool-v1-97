-- Tạo club SABO Billiards và tournament test
INSERT INTO public.profiles (
  id, user_id, full_name, display_name, phone, role, 
  is_admin, email_verified, created_at, city, district
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'SABO Billiards Club',
  'SABO Admin',
  '0999888777',
  'club_owner',
  false,
  true,
  now(),
  'Hồ Chí Minh',
  'Quận 1'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role;

-- Tạo club profile cho SABO Billiards
INSERT INTO public.club_profiles (
  id, user_id, club_name, address, phone, number_of_tables,
  verification_status, verified_at, verified_by, created_at, updated_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'SABO Billiards Club',
  '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  '0999888777',
  8,
  'approved',
  now(),
  (SELECT user_id FROM public.profiles WHERE is_admin = true LIMIT 1),
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  club_name = EXCLUDED.club_name,
  verification_status = 'approved',
  verified_at = now();

-- Tạo tournament test với SABO Billiards làm organizer
INSERT INTO public.tournaments (
  id, name, description, tournament_type, max_participants, entry_fee,
  tournament_start, tournament_end, registration_start, registration_end,
  created_by, club_id, status, current_participants, 
  prize_structure, rules, format_details, created_at, updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'SABO Tournament Test - 16 Players',
  'Giải đấu test với 16 người chơi tại SABO Billiards Club. Hình thức loại trực tiếp.',
  'single_elimination',
  16,
  50000,
  now() + INTERVAL '3 days',
  now() + INTERVAL '3 days' + INTERVAL '8 hours',
  now() - INTERVAL '1 day',
  now() + INTERVAL '2 days',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  'registration_open',
  0,
  '{"first": 500000, "second": 200000, "third": 100000}',
  'Luật thi đấu chuẩn 8-ball. Thi đấu loại trực tiếp, thắng 5 ván trước.',
  '{"race_to": 5, "break_format": "alternate", "time_limit": 60}',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  created_by = EXCLUDED.created_by,
  club_id = EXCLUDED.club_id,
  status = 'registration_open',
  updated_at = now();