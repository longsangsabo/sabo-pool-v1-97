
-- Create AI usage statistics table
CREATE TABLE public.ai_usage_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  model_name TEXT NOT NULL,
  assistant_type TEXT NOT NULL CHECK (assistant_type IN ('user', 'admin')),
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  intent TEXT,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE public.ai_usage_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all AI usage statistics" 
ON public.ai_usage_statistics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "System can insert AI usage statistics" 
ON public.ai_usage_statistics 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_statistics_date ON public.ai_usage_statistics(date);
CREATE INDEX idx_ai_usage_statistics_assistant_type ON public.ai_usage_statistics(assistant_type);
CREATE INDEX idx_ai_usage_statistics_model_name ON public.ai_usage_statistics(model_name);
CREATE INDEX idx_ai_usage_statistics_user_id ON public.ai_usage_statistics(user_id);
CREATE INDEX idx_ai_usage_statistics_created_at ON public.ai_usage_statistics(created_at DESC);

-- Create materialized view for daily AI usage aggregation
CREATE MATERIALIZED VIEW public.mv_daily_ai_usage AS
SELECT 
  date,
  assistant_type,
  model_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE message_type = 'user') as user_messages,
  COUNT(*) FILTER (WHERE message_type = 'assistant') as ai_responses,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  SUM(tokens_used) as total_tokens,
  AVG(response_time_ms) as avg_response_time,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions
FROM public.ai_usage_statistics
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date, assistant_type, model_name
ORDER BY date DESC, assistant_type, model_name;

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_ai_usage_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_daily_ai_usage;
END;
$$;

-- Create function to get AI usage overview
CREATE OR REPLACE FUNCTION public.get_ai_usage_overview(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  assistant_type TEXT,
  model_name TEXT,
  total_requests BIGINT,
  successful_requests BIGINT,
  failed_requests BIGINT,
  total_tokens BIGINT,
  avg_response_time NUMERIC,
  unique_users BIGINT,
  unique_sessions BIGINT,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aus.assistant_type,
    aus.model_name,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE aus.success = true) as successful_requests,
    COUNT(*) FILTER (WHERE aus.success = false) as failed_requests,
    COALESCE(SUM(aus.tokens_used), 0) as total_tokens,
    ROUND(AVG(aus.response_time_ms)::NUMERIC, 2) as avg_response_time,
    COUNT(DISTINCT aus.user_id) as unique_users,
    COUNT(DISTINCT aus.session_id) as unique_sessions,
    ROUND((COUNT(*) FILTER (WHERE aus.success = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 2) as success_rate
  FROM public.ai_usage_statistics aus
  WHERE aus.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY aus.assistant_type, aus.model_name
  ORDER BY total_requests DESC;
END;
$$;

-- Create function to get hourly usage patterns
CREATE OR REPLACE FUNCTION public.get_ai_usage_patterns(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  hour_of_day INTEGER,
  assistant_type TEXT,
  request_count BIGINT,
  avg_response_time NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(HOUR FROM aus.created_at)::INTEGER as hour_of_day,
    aus.assistant_type,
    COUNT(*) as request_count,
    ROUND(AVG(aus.response_time_ms)::NUMERIC, 2) as avg_response_time
  FROM public.ai_usage_statistics aus
  WHERE aus.created_at >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  GROUP BY EXTRACT(HOUR FROM aus.created_at), aus.assistant_type
  ORDER BY hour_of_day, aus.assistant_type;
END;
$$;
