
-- Create safe admin statistics function to replace execute_sql
CREATE OR REPLACE FUNCTION public.get_admin_stats_safely()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Get comprehensive admin statistics safely
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'new_users_this_month', (
      SELECT COUNT(*) FROM profiles 
      WHERE created_at >= date_trunc('month', now())
    ),
    'active_users', (
      SELECT COUNT(*) FROM profiles 
      WHERE updated_at >= now() - interval '30 days'
    ),
    'total_tournaments', (SELECT COUNT(*) FROM tournaments),
    'ongoing_tournaments', (
      SELECT COUNT(*) FROM tournaments 
      WHERE status = 'ongoing'
    ),
    'completed_tournaments', (
      SELECT COUNT(*) FROM tournaments 
      WHERE status = 'completed'
    ),
    'total_matches', (SELECT COUNT(*) FROM match_results),
    'verified_matches', (
      SELECT COUNT(*) FROM match_results 
      WHERE result_status = 'verified'
    ),
    'pending_matches', (
      SELECT COUNT(*) FROM match_results 
      WHERE result_status = 'pending'
    ),
    'total_clubs', (SELECT COUNT(*) FROM club_profiles),
    'verified_clubs', (
      SELECT COUNT(*) FROM club_profiles 
      WHERE verification_status = 'verified'
    ),
    'pending_club_registrations', (
      SELECT COUNT(*) FROM club_registrations 
      WHERE status = 'pending'
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM payment_transactions 
      WHERE status = 'success' 
      AND created_at >= date_trunc('month', now())
    ),
    'top_players', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', p.full_name,
          'elo', pr.elo,
          'wins', pr.wins
        )
      )
      FROM profiles p
      JOIN player_rankings pr ON p.user_id = pr.player_id
      ORDER BY pr.elo DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Update admin workflows with corrected SQL queries
UPDATE public.admin_workflows 
SET sql_queries = '{
  "total_users": "SELECT COUNT(*) as count FROM profiles",
  "new_users": "SELECT COUNT(*) as count FROM profiles WHERE created_at >= date_trunc(''month'', now())",
  "active_users": "SELECT COUNT(*) as count FROM profiles WHERE updated_at >= now() - interval ''30 days''"
}'::jsonb
WHERE workflow_name = 'user_stats_query';

UPDATE public.admin_workflows 
SET sql_queries = '{
  "total_tournaments": "SELECT COUNT(*) as count FROM tournaments",
  "ongoing_tournaments": "SELECT COUNT(*) as count FROM tournaments WHERE status = ''ongoing''",
  "completed_tournaments": "SELECT COUNT(*) as count FROM tournaments WHERE status = ''completed''"
}'::jsonb
WHERE workflow_name = 'tournament_stats_query';

-- Add more comprehensive workflows
INSERT INTO public.admin_workflows (workflow_name, description, trigger_keywords, intent_pattern, required_data, response_template, sql_queries) VALUES
('club_stats_query', 'Thống kê câu lạc bộ và xét duyệt', ARRAY['câu lạc bộ', 'club', 'xét duyệt'], 'thống kê.*club|club.*stats', 
'{"tables": ["club_profiles", "club_registrations"], "metrics": ["total_clubs", "pending_approvals"]}',
'Hiện có {{total_clubs}} câu lạc bộ đã đăng ký, {{verified_clubs}} đã được xác thực, và {{pending_registrations}} đang chờ xét duyệt.',
'{"total_clubs": "SELECT COUNT(*) as count FROM club_profiles", "verified_clubs": "SELECT COUNT(*) as count FROM club_profiles WHERE verification_status = ''verified''", "pending_registrations": "SELECT COUNT(*) as count FROM club_registrations WHERE status = ''pending''"}'),

('match_verification_stats', 'Thống kê xác thực trận đấu', ARRAY['trận đấu', 'match', 'xác thực', 'verification'], 'xác thực.*match|match.*verification', 
'{"tables": ["match_results"], "metrics": ["total_matches", "verified", "pending"]}',
'Có {{total_matches}} trận đấu, {{verified_matches}} đã được xác thực, {{pending_matches}} đang chờ xác thực.',
'{"total_matches": "SELECT COUNT(*) as count FROM match_results", "verified_matches": "SELECT COUNT(*) as count FROM match_results WHERE result_status = ''verified''", "pending_matches": "SELECT COUNT(*) as count FROM match_results WHERE result_status = ''pending''"}'),

('revenue_analytics', 'Phân tích doanh thu và giao dịch', ARRAY['doanh thu', 'revenue', 'tiền', 'thanh toán'], 'doanh thu|revenue|giao dịch', 
'{"tables": ["payment_transactions"], "metrics": ["monthly_revenue", "total_transactions"]}',
'Doanh thu tháng này: {{monthly_revenue}} VNĐ, tổng {{total_transactions}} giao dịch thành công.',
'{"monthly_revenue": "SELECT COALESCE(SUM(amount), 0) as count FROM payment_transactions WHERE status = ''success'' AND created_at >= date_trunc(''month'', now())", "total_transactions": "SELECT COUNT(*) as count FROM payment_transactions WHERE status = ''success''"}');

-- Add more knowledge base entries
INSERT INTO public.admin_knowledge_base (title, content, content_type, category, tags, priority) VALUES
('Xử lý tranh chấp trận đấu', 'Khi có tranh chấp: 1) Xem chi tiết từ match_disputes, 2) Kiểm tra evidence_urls, 3) Liên hệ cả 2 người chơi, 4) Quyết định dựa trên bằng chứng, 5) Cập nhật trạng thái và ghi chú phản hồi', 'workflow', 'match_results', ARRAY['dispute', 'tranh chấp', 'conflict'], 1),

('Quản lý hệ thống thanh toán', 'Theo dõi giao dịch: 1) Kiểm tra payment_transactions, 2) Xử lý hoàn tiền qua process_refund function, 3) Cập nhật membership sau thanh toán, 4) Theo dõi các giao dịch bất thường', 'guide', 'financial', ARRAY['payment', 'transaction', 'refund'], 1),

('Phân tích hiệu suất hệ thống', 'Sử dụng bảng api_performance_metrics và error_logs để: 1) Theo dõi response time, 2) Phát hiện lỗi thường xuyên, 3) Tối ưu các endpoint chậm, 4) Báo cáo weekly performance', 'guide', 'system_monitoring', ARRAY['performance', 'monitoring', 'optimization'], 2),

('Quản lý demo users', 'Demo users được tạo cho tournaments: 1) Sử dụng get_available_demo_users function, 2) Reserve qua reserve_demo_users, 3) Release sau tournament, 4) Kiểm tra trạng thái qua demo_user_pool table', 'workflow', 'user_management', ARRAY['demo', 'tournament', 'users'], 2);

-- Ensure openai_usage_logs table exists with proper structure
CREATE TABLE IF NOT EXISTS public.openai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  model_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
  response_time_ms INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  user_id UUID,
  function_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on openai_usage_logs if not already enabled
ALTER TABLE public.openai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for openai_usage_logs
DROP POLICY IF EXISTS "Admins can view OpenAI usage logs" ON public.openai_usage_logs;
CREATE POLICY "Admins can view OpenAI usage logs" 
ON public.openai_usage_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

DROP POLICY IF EXISTS "System can insert OpenAI usage logs" ON public.openai_usage_logs;
CREATE POLICY "System can insert OpenAI usage logs" 
ON public.openai_usage_logs FOR INSERT 
WITH CHECK (true);

-- Add some sample match results and tournaments for testing
INSERT INTO public.tournaments (id, name, tournament_type, status, max_participants, current_participants, tournament_start, tournament_end, registration_start, registration_end) VALUES
(gen_random_uuid(), 'Giải đấu Xuân 2024', 'single_elimination', 'ongoing', 32, 28, '2024-02-15 09:00:00+07', '2024-02-17 18:00:00+07', '2024-01-15 00:00:00+07', '2024-02-10 23:59:59+07'),
(gen_random_uuid(), 'Cup Mùa Hè 2024', 'double_elimination', 'completed', 16, 16, '2024-06-01 08:00:00+07', '2024-06-03 20:00:00+07', '2024-05-01 00:00:00+07', '2024-05-25 23:59:59+07'),
(gen_random_uuid(), 'Giải Trung Thu 2024', 'single_elimination', 'registration_open', 64, 12, '2024-09-15 09:00:00+07', '2024-09-18 18:00:00+07', '2024-08-15 00:00:00+07', '2024-09-10 23:59:59+07')
ON CONFLICT (id) DO NOTHING;
