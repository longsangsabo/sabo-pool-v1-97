-- Create comprehensive automation system for SPA and ELO

-- 1. Create SPA transaction log table for tracking all SPA point transactions
CREATE TABLE IF NOT EXISTS public.spa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('match_win', 'match_loss', 'tournament_reward', 'challenge_win', 'challenge_loss', 'milestone_reward', 'admin_adjustment', 'daily_bonus', 'streak_bonus')),
  category TEXT NOT NULL DEFAULT 'match',
  description TEXT,
  reference_id UUID, -- Points to match, tournament, challenge, etc.
  reference_type TEXT, -- 'match', 'tournament', 'challenge', 'milestone'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed'))
);

-- Enable RLS for SPA transactions
ALTER TABLE public.spa_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for SPA transactions
CREATE POLICY "Users can view their own SPA transactions" ON public.spa_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage SPA transactions" ON public.spa_transactions
  FOR ALL USING (true);

-- 2. Create match automation table for tracking auto-processed matches
CREATE TABLE IF NOT EXISTS public.match_automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL,
  tournament_id UUID,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('elo_calculation', 'spa_award', 'rank_update', 'milestone_check')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB DEFAULT '{}',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create tournament automation table
CREATE TABLE IF NOT EXISTS public.tournament_automation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  automation_type TEXT NOT NULL CHECK (automation_type IN ('bracket_generation', 'reward_calculation', 'spa_distribution', 'elo_distribution', 'final_ranking')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result JSONB DEFAULT '{}',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Create automation configuration table
CREATE TABLE IF NOT EXISTS public.automation_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Insert default automation configurations
INSERT INTO public.automation_config (config_key, config_value, description) VALUES
('auto_elo_calculation', '{"enabled": true, "delay_seconds": 5}', 'Automatically calculate ELO after match completion'),
('auto_spa_award', '{"enabled": true, "delay_seconds": 3}', 'Automatically award SPA points after match completion'),
('auto_rank_promotion', '{"enabled": true, "check_frequency": "daily"}', 'Automatically promote players when eligible'),
('auto_milestone_check', '{"enabled": true, "delay_seconds": 10}', 'Automatically check and award milestones'),
('auto_tournament_rewards', '{"enabled": true, "delay_seconds": 30}', 'Automatically distribute tournament rewards'),
('daily_spa_decay', '{"enabled": false, "decay_rate": 0.001}', 'Daily SPA point decay for inactive players'),
('challenge_limits', '{"daily_limit": 2, "spa_reduction_after_limit": 0.3}', 'Daily challenge limits and penalties')
ON CONFLICT (config_key) DO NOTHING;