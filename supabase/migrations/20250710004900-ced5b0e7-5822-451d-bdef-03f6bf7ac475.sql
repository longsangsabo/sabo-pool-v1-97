-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create admin knowledge base table with vector embeddings
CREATE TABLE public.admin_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'faq', 'documentation', 'workflow', 'guide'
  category TEXT NOT NULL, -- 'user_management', 'tournament', 'match_results', 'analytics', etc.
  tags TEXT[] DEFAULT '{}',
  embedding vector(1536), -- OpenAI ada-002 embedding dimension
  metadata JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1, -- 1 = high, 2 = medium, 3 = low
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin workflows table for automated processes
CREATE TABLE public.admin_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL UNIQUE,
  description TEXT,
  trigger_keywords TEXT[] NOT NULL, -- Keywords that trigger this workflow
  intent_pattern TEXT, -- Regex pattern for intent matching
  required_data JSONB, -- What data needs to be fetched
  response_template TEXT, -- Template for response generation
  sql_queries JSONB, -- Pre-defined queries for this workflow
  priority INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_knowledge_base_category ON public.admin_knowledge_base(category);
CREATE INDEX idx_knowledge_base_content_type ON public.admin_knowledge_base(content_type);
CREATE INDEX idx_knowledge_base_tags ON public.admin_knowledge_base USING gin(tags);
CREATE INDEX idx_knowledge_base_embedding ON public.admin_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_base_active ON public.admin_knowledge_base(is_active) WHERE is_active = true;

CREATE INDEX idx_workflows_keywords ON public.admin_workflows USING gin(trigger_keywords);
CREATE INDEX idx_workflows_active ON public.admin_workflows(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.admin_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin knowledge base
CREATE POLICY "Admins can manage knowledge base" 
ON public.admin_knowledge_base FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- RLS Policies for admin workflows
CREATE POLICY "Admins can manage workflows" 
ON public.admin_workflows FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Insert initial knowledge base entries
INSERT INTO public.admin_knowledge_base (title, content, content_type, category, tags, priority) VALUES
('Quản lý người dùng', 'Admin có thể xem danh sách tất cả người dùng, chỉnh sửa thông tin, khóa/mở khóa tài khoản, và xem lịch sử hoạt động. Truy cập qua trang /admin/users', 'guide', 'user_management', ARRAY['users', 'management', 'admin'], 1),
('Tạo giải đấu mới', 'Để tạo giải đấu mới, admin cần: 1) Đặt tên giải đấu, 2) Chọn loại giải (single/double elimination), 3) Đặt thời gian đăng ký, 4) Đặt số lượng tối đa, 5) Cấu hình giải thưởng', 'workflow', 'tournament', ARRAY['tournament', 'create', 'setup'], 1),
('Xác thực kết quả trận đấu', 'Admin có thể xác thực kết quả trận đấu từ trang match results. Cần kiểm tra: 1) Cả 2 người chơi đã confirm, 2) Thông tin trận đấu chính xác, 3) Không có tranh chấp', 'workflow', 'match_results', ARRAY['match', 'verification', 'results'], 1),
('Thống kê hệ thống', 'Xem thống kê tổng quan tại dashboard: tổng số người dùng, trận đấu trong tháng, giải đấu đang diễn ra, doanh thu. Xuất báo cáo chi tiết theo tháng/quý', 'guide', 'analytics', ARRAY['statistics', 'dashboard', 'reports'], 2),
('Quản lý câu lạc bộ', 'Xét duyệt đăng ký câu lạc bộ mới, kiểm tra giấy phép kinh doanh, xác thực thông tin địa chỉ. Từ chối hoặc phê duyệt với ghi chú', 'workflow', 'club_management', ARRAY['club', 'approval', 'verification'], 1);

-- Insert initial workflow patterns
INSERT INTO public.admin_workflows (workflow_name, description, trigger_keywords, intent_pattern, required_data, response_template, sql_queries) VALUES
('user_stats_query', 'Truy vấn thống kê người dùng', ARRAY['người dùng', 'thống kê', 'user', 'stats'], 'thống kê.*người dùng|user.*stats|tổng số.*user', 
'{"tables": ["profiles"], "metrics": ["total_count", "new_this_month", "active_users"]}',
'Hiện tại hệ thống có {{total_users}} người dùng, trong đó {{new_users}} người dùng mới trong tháng này và {{active_users}} người dùng hoạt động.',
'{"total_users": "SELECT COUNT(*) FROM profiles", "new_users": "SELECT COUNT(*) FROM profiles WHERE created_at >= date_trunc(''month'', now())", "active_users": "SELECT COUNT(*) FROM profiles WHERE updated_at >= now() - interval ''30 days''"}'),

('tournament_stats_query', 'Truy vấn thống kê giải đấu', ARRAY['giải đấu', 'tournament', 'thống kê'], 'thống kê.*giải|tournament.*stats', 
'{"tables": ["tournaments"], "metrics": ["total_count", "ongoing", "completed"]}',
'Có {{total_tournaments}} giải đấu, {{ongoing_tournaments}} đang diễn ra, {{completed_tournaments}} đã hoàn thành.',
'{"total_tournaments": "SELECT COUNT(*) FROM tournaments", "ongoing_tournaments": "SELECT COUNT(*) FROM tournaments WHERE status = ''ongoing''", "completed_tournaments": "SELECT COUNT(*) FROM tournaments WHERE status = ''completed''"}'),

('match_verification_help', 'Hướng dẫn xác thực trận đấu', ARRAY['xác thực', 'verification', 'trận đấu', 'match'], 'xác thực.*trận|verify.*match', 
'{"context": "match_verification_process"}',
'Để xác thực trận đấu: 1) Kiểm tra cả 2 người chơi đã confirm kết quả, 2) Xem lại thông tin chi tiết trận đấu, 3) Kiểm tra không có tranh chấp nào, 4) Click "Xác thực" để hoàn tất. Sau khi xác thực, ELO sẽ được cập nhật tự động.',
'{}');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.admin_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.admin_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();