
-- Tạo bảng translation_tasks để quản lý workflow dịch thuật
CREATE TABLE IF NOT EXISTS public.translation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  component_name TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'vi',
  translation_keys TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo bảng translation_dictionary để lưu từ điển dịch thuật
CREATE TABLE IF NOT EXISTS public.translation_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('vi', 'en')),
  value TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(key, language)
);

-- Tạo index để tối ưu hiệu suất
CREATE INDEX IF NOT EXISTS idx_translation_tasks_status ON public.translation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_translation_tasks_created_at ON public.translation_tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_translation_dictionary_key_lang ON public.translation_dictionary(key, language);

-- Tạo trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_translation_tasks_updated_at 
    BEFORE UPDATE ON public.translation_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translation_dictionary_updated_at 
    BEFORE UPDATE ON public.translation_dictionary 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.translation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_dictionary ENABLE ROW LEVEL SECURITY;

-- Tạo policies cho admin access
CREATE POLICY "Allow admin access to translation_tasks" ON public.translation_tasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Allow admin access to translation_dictionary" ON public.translation_dictionary
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Thêm một số mẫu dữ liệu
INSERT INTO public.translation_dictionary (key, language, value, context) VALUES
('workflow.auto_translation', 'vi', 'Dịch thuật tự động', 'Translation workflow'),
('workflow.auto_translation', 'en', 'Auto Translation', 'Translation workflow'),
('workflow.detect_new_pages', 'vi', 'Phát hiện trang mới', 'Translation workflow'),
('workflow.detect_new_pages', 'en', 'Detect New Pages', 'Translation workflow'),
('workflow.translation_queue', 'vi', 'Hàng đợi dịch thuật', 'Translation workflow'),
('workflow.translation_queue', 'en', 'Translation Queue', 'Translation workflow')
ON CONFLICT (key, language) DO NOTHING;
