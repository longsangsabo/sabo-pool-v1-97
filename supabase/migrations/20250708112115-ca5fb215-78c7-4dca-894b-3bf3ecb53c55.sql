-- Update 16 người đầu thành đã thanh toán, 1 người cuối để pending
UPDATE tournament_registrations 
SET 
  payment_status = 'paid',
  registration_status = 'confirmed', 
  status = 'confirmed',
  admin_notes = 'Đã thanh toán và xác nhận'
WHERE tournament_id = '4a63b34f-7de0-40c6-9e55-33361d236a09'
AND id IN (
  SELECT id FROM tournament_registrations 
  WHERE tournament_id = '4a63b34f-7de0-40c6-9e55-33361d236a09'
  ORDER BY registration_date 
  LIMIT 16
);