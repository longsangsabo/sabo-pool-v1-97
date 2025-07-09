-- Create OpenAI usage logs table for real-time cost tracking
CREATE TABLE public.openai_usage_logs (
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

-- Create index for better query performance
CREATE INDEX idx_openai_usage_logs_timestamp ON public.openai_usage_logs(timestamp DESC);
CREATE INDEX idx_openai_usage_logs_model_task ON public.openai_usage_logs(model_id, task_type);
CREATE INDEX idx_openai_usage_logs_function ON public.openai_usage_logs(function_name);

-- Enable RLS
ALTER TABLE public.openai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all OpenAI usage logs" 
ON public.openai_usage_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create policy for system/edge functions to insert logs
CREATE POLICY "System can insert OpenAI usage logs" 
ON public.openai_usage_logs FOR INSERT 
WITH CHECK (true);

-- Create model configuration table for admin settings
CREATE TABLE public.openai_model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  cost_limit_daily DECIMAL(10,2),
  cost_limit_monthly DECIMAL(10,2),
  max_requests_per_hour INTEGER,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(model_id, task_type)
);

-- Enable RLS for model configs
ALTER TABLE public.openai_model_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for model configs
CREATE POLICY "Admins can manage OpenAI model configs" 
ON public.openai_model_configs FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Insert default model configurations
INSERT INTO public.openai_model_configs (model_id, task_type, enabled, priority) VALUES
('gpt-4.1-2025-04-14', 'translation', true, 1),
('gpt-4.1-mini-2025-04-14', 'translation', true, 2),
('o3-2025-04-16', 'alert_analysis', true, 1),
('gpt-4.1-2025-04-14', 'chat', true, 1),
('o3-2025-04-16', 'reasoning', true, 1),
('o4-mini-2025-04-16', 'reasoning', true, 2);