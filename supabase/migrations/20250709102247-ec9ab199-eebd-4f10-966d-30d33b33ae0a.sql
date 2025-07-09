
-- Thêm cột is_visible để kiểm soát việc hiển thị giải đấu
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Thêm index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_tournaments_is_visible 
ON public.tournaments(is_visible);

-- Cập nhật các giải đấu đã soft delete để không hiển thị
UPDATE public.tournaments 
SET is_visible = FALSE 
WHERE deleted_at IS NOT NULL;

-- Thêm comment để ghi chú
COMMENT ON COLUMN public.tournaments.is_visible IS 'Controls whether tournament is visible to regular users. FALSE for soft deleted tournaments.';
