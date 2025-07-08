-- Thêm các cột thiếu vào bảng tournament_registrations
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone;