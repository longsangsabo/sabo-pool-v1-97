-- Cập nhật tournament hiện có với tên SABO và user hiện tại
UPDATE public.tournaments 
SET 
  name = 'SABO Tournament Test - 16 Players',
  description = 'Giải đấu test với 16 người chơi tại SABO Billiards Club. Hình thức loại trực tiếp.',
  status = 'registration_open',
  max_participants = 16,
  entry_fee = 50000,
  updated_at = now()
WHERE created_by = '3bd4ded0-2b7d-430c-b245-c10d079b333a'
LIMIT 1;