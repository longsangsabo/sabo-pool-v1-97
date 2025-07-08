-- Fix tournament bracket generation by ensuring demo users exist and foreign keys work
-- First ensure we have demo users with proper IDs
INSERT INTO public.profiles (
  id, user_id, full_name, display_name, phone, skill_level, elo,
  role, is_demo_user, email_verified, created_at, city, district
) VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'Demo Player 1', 'Player1', '0901111111', 'advanced', 1200, 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1'),
  ('22222222-2222-2222-2222-222222222222'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'Demo Player 2', 'Player2', '0902222222', 'advanced', 1150, 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1'),
  ('33333333-3333-3333-3333-333333333333'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'Demo Player 3', 'Player3', '0903333333', 'intermediate', 1100, 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1'),
  ('44444444-4444-4444-4444-444444444444'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'Demo Player 4', 'Player4', '0904444444', 'intermediate', 1050, 'player', true, true, now(), 'Hồ Chí Minh', 'Quận 1')
ON CONFLICT (user_id) DO NOTHING;

-- Create tournament registrations for demo users
INSERT INTO public.tournament_registrations (
  tournament_id, player_id, registration_status, payment_status, status, registration_date
) VALUES 
  ('6f103f18-00bf-4c40-a079-71fe5fb60c94'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'confirmed', 'paid', 'confirmed', now()),
  ('6f103f18-00bf-4c40-a079-71fe5fb60c94'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'confirmed', 'paid', 'confirmed', now()),
  ('6f103f18-00bf-4c40-a079-71fe5fb60c94'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'confirmed', 'paid', 'confirmed', now()),
  ('6f103f18-00bf-4c40-a079-71fe5fb60c94'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 'confirmed', 'paid', 'confirmed', now())
ON CONFLICT (tournament_id, player_id) DO NOTHING;