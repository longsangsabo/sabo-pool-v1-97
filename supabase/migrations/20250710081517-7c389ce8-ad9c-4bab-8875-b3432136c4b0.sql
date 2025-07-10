-- Create spa_points_log table to track SPA points awarded from tournaments and other sources
CREATE TABLE public.spa_points_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('tournament', 'match', 'achievement', 'bonus', 'penalty')),
  source_id UUID,
  points_earned INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.spa_points_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own SPA points log" 
ON public.spa_points_log 
FOR SELECT 
USING (auth.uid() = player_id);

CREATE POLICY "Admins can view all SPA points logs" 
ON public.spa_points_log 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

CREATE POLICY "System can insert SPA points log" 
ON public.spa_points_log 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_spa_points_log_player_id ON public.spa_points_log(player_id);
CREATE INDEX idx_spa_points_log_source ON public.spa_points_log(source_type, source_id);
CREATE INDEX idx_spa_points_log_created_at ON public.spa_points_log(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_spa_points_log_updated_at
BEFORE UPDATE ON public.spa_points_log
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();