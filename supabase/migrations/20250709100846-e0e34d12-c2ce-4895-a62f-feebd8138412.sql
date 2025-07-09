-- Thêm cột deleted_at vào bảng tournaments để hỗ trợ soft delete
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Thêm index để tối ưu query cho việc lọc giải đấu đã xóa
CREATE INDEX IF NOT EXISTS idx_tournaments_deleted_at 
ON public.tournaments(deleted_at);

-- Thêm comment để ghi chú về cột mới
COMMENT ON COLUMN public.tournaments.deleted_at IS 'Timestamp when tournament was soft deleted. NULL means active tournament.';