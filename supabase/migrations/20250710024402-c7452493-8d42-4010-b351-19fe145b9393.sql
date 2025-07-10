
-- Create game configuration tables for centralized management

-- Main game configurations table
CREATE TABLE public.game_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'elo', 'spa', 'ranks', 'tournaments'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ELO calculation rules
CREATE TABLE public.elo_calculation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'k_factor', 'tournament_bonus', 'penalty'
  conditions JSONB NOT NULL,
  value_formula TEXT NOT NULL,
  base_value NUMERIC NOT NULL,
  multiplier NUMERIC DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rank definitions and requirements
CREATE TABLE public.rank_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_code TEXT NOT NULL UNIQUE,
  rank_name TEXT NOT NULL,
  elo_requirement INTEGER NOT NULL,
  spa_requirement INTEGER DEFAULT 0,
  match_requirement INTEGER DEFAULT 0,
  rank_order INTEGER NOT NULL,
  rank_color TEXT DEFAULT '#gray',
  rank_description TEXT,
  promotion_requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SPA reward milestones
CREATE TABLE public.spa_reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_name TEXT NOT NULL,
  milestone_type TEXT NOT NULL, -- 'win_streak', 'tournament_position', 'daily_challenge'
  requirement_value INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  bonus_conditions JSONB,
  is_repeatable BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tournament reward structures
CREATE TABLE public.tournament_reward_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_type TEXT NOT NULL,
  position_name TEXT NOT NULL, -- 'CHAMPION', 'RUNNER_UP', etc.
  rank_category TEXT NOT NULL, -- 'E', 'F', 'G', etc.
  elo_reward INTEGER NOT NULL,
  spa_reward INTEGER NOT NULL,
  additional_rewards JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configuration change logs
CREATE TABLE public.game_config_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_table TEXT NOT NULL,
  config_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_calculation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_reward_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_reward_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_config_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access)
CREATE POLICY "Admins can manage game configurations" ON public.game_configurations
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can manage ELO rules" ON public.elo_calculation_rules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can manage rank definitions" ON public.rank_definitions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can manage SPA milestones" ON public.spa_reward_milestones
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can manage tournament rewards" ON public.tournament_reward_structures
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "Admins can view config logs" ON public.game_config_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  ));

-- Everyone can read active configurations (for game logic)
CREATE POLICY "Everyone can read active game configs" ON public.game_configurations
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read active ELO rules" ON public.elo_calculation_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read active rank definitions" ON public.rank_definitions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read active SPA milestones" ON public.spa_reward_milestones
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read active tournament rewards" ON public.tournament_reward_structures
  FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_game_configurations_category ON public.game_configurations(category);
CREATE INDEX idx_game_configurations_active ON public.game_configurations(is_active);
CREATE INDEX idx_elo_rules_type ON public.elo_calculation_rules(rule_type);
CREATE INDEX idx_rank_definitions_order ON public.rank_definitions(rank_order);
CREATE INDEX idx_spa_milestones_type ON public.spa_reward_milestones(milestone_type);
CREATE INDEX idx_tournament_rewards_type_rank ON public.tournament_reward_structures(tournament_type, rank_category);

-- Insert initial data based on current constants
INSERT INTO public.rank_definitions (rank_code, rank_name, elo_requirement, rank_order, rank_color) VALUES
  ('K', 'Hạng K', 1000, 1, '#64748b'),
  ('K+', 'Hạng K+', 1100, 2, '#64748b'),
  ('I', 'Hạng I', 1200, 3, '#f59e0b'),
  ('I+', 'Hạng I+', 1300, 4, '#f59e0b'),
  ('H', 'Hạng H', 1400, 5, '#10b981'),
  ('H+', 'Hạng H+', 1500, 6, '#10b981'),
  ('G', 'Hạng G', 1600, 7, '#3b82f6'),
  ('G+', 'Hạng G+', 1700, 8, '#3b82f6'),
  ('F', 'Hạng F', 1800, 9, '#8b5cf6'),
  ('F+', 'Hạng F+', 1900, 10, '#8b5cf6'),
  ('E', 'Hạng E', 2000, 11, '#ef4444'),
  ('E+', 'Hạng E+', 2100, 12, '#ef4444');

-- Insert ELO K-factor rules
INSERT INTO public.elo_calculation_rules (rule_name, rule_type, conditions, value_formula, base_value) VALUES
  ('New Player K-Factor', 'k_factor', '{"matches_played": {"<": 30}}', 'base_value', 40),
  ('Regular Player K-Factor', 'k_factor', '{"elo": {"<": 2100}, "matches_played": {">=": 30}}', 'base_value', 32),
  ('Advanced Player K-Factor', 'k_factor', '{"elo": {">=": 2100, "<": 2400}}', 'base_value', 24),
  ('Master Player K-Factor', 'k_factor', '{"elo": {">=": 2400}}', 'base_value', 16);

-- Insert tournament ELO rewards
INSERT INTO public.elo_calculation_rules (rule_name, rule_type, conditions, value_formula, base_value) VALUES
  ('Champion ELO Bonus', 'tournament_bonus', '{"position": "CHAMPION"}', 'base_value', 100),
  ('Runner-up ELO Bonus', 'tournament_bonus', '{"position": "RUNNER_UP"}', 'base_value', 50),
  ('Third Place ELO Bonus', 'tournament_bonus', '{"position": "THIRD_PLACE"}', 'base_value', 25),
  ('Fourth Place ELO Bonus', 'tournament_bonus', '{"position": "FOURTH_PLACE"}', 'base_value', 12.5),
  ('Top 8 ELO Bonus', 'tournament_bonus', '{"position": "TOP_8"}', 'base_value', 6),
  ('Top 16 ELO Bonus', 'tournament_bonus', '{"position": "TOP_16"}', 'base_value', 3),
  ('Participation ELO Bonus', 'tournament_bonus', '{"position": "PARTICIPATION"}', 'base_value', 1);

-- Insert SPA challenge rewards
INSERT INTO public.spa_reward_milestones (milestone_name, milestone_type, requirement_value, spa_reward, is_repeatable) VALUES
  ('Challenge Win', 'challenge_win', 1, 50, true),
  ('Challenge Loss', 'challenge_loss', 1, 10, true),
  ('Win Streak Bonus', 'win_streak', 1, 25, true),
  ('Comeback Bonus', 'comeback_win', 1, 100, true);

-- Insert tournament SPA rewards for each rank
INSERT INTO public.tournament_reward_structures (tournament_type, position_name, rank_category, elo_reward, spa_reward) VALUES
  -- E rank rewards
  ('single_elimination', 'CHAMPION', 'E', 100, 1500),
  ('single_elimination', 'RUNNER_UP', 'E', 50, 1100),
  ('single_elimination', 'THIRD_PLACE', 'E', 25, 900),
  ('single_elimination', 'FOURTH_PLACE', 'E', 12, 650),
  ('single_elimination', 'TOP_8', 'E', 6, 320),
  ('single_elimination', 'PARTICIPATION', 'E', 1, 120),
  
  -- F rank rewards  
  ('single_elimination', 'CHAMPION', 'F', 100, 1350),
  ('single_elimination', 'RUNNER_UP', 'F', 50, 1000),
  ('single_elimination', 'THIRD_PLACE', 'F', 25, 800),
  ('single_elimination', 'FOURTH_PLACE', 'F', 12, 550),
  ('single_elimination', 'TOP_8', 'F', 6, 280),
  ('single_elimination', 'PARTICIPATION', 'F', 1, 110),
  
  -- G rank rewards
  ('single_elimination', 'CHAMPION', 'G', 100, 1200),
  ('single_elimination', 'RUNNER_UP', 'G', 50, 900),
  ('single_elimination', 'THIRD_PLACE', 'G', 25, 700),
  ('single_elimination', 'FOURTH_PLACE', 'G', 12, 500),
  ('single_elimination', 'TOP_8', 'G', 6, 250),
  ('single_elimination', 'PARTICIPATION', 'G', 1, 100),
  
  -- H rank rewards
  ('single_elimination', 'CHAMPION', 'H', 100, 1100),
  ('single_elimination', 'RUNNER_UP', 'H', 50, 850),
  ('single_elimination', 'THIRD_PLACE', 'H', 25, 650),
  ('single_elimination', 'FOURTH_PLACE', 'H', 12, 450),
  ('single_elimination', 'TOP_8', 'H', 6, 200),
  ('single_elimination', 'PARTICIPATION', 'H', 1, 100),
  
  -- I rank rewards
  ('single_elimination', 'CHAMPION', 'I', 100, 1000),
  ('single_elimination', 'RUNNER_UP', 'I', 50, 800),
  ('single_elimination', 'THIRD_PLACE', 'I', 25, 600),
  ('single_elimination', 'FOURTH_PLACE', 'I', 12, 400),
  ('single_elimination', 'TOP_8', 'I', 6, 150),
  ('single_elimination', 'PARTICIPATION', 'I', 1, 100),
  
  -- K rank rewards
  ('single_elimination', 'CHAMPION', 'K', 100, 900),
  ('single_elimination', 'RUNNER_UP', 'K', 50, 700),
  ('single_elimination', 'THIRD_PLACE', 'K', 25, 500),
  ('single_elimination', 'FOURTH_PLACE', 'K', 12, 350),
  ('single_elimination', 'TOP_8', 'K', 6, 120),
  ('single_elimination', 'PARTICIPATION', 'K', 1, 100);

-- Insert basic game configurations
INSERT INTO public.game_configurations (config_key, config_value, description, category) VALUES
  ('daily_spa_limit', '500', 'Maximum SPA points per day from challenges', 'spa'),
  ('min_promotion_matches', '4', 'Minimum matches required for rank promotion', 'ranks'),
  ('min_promotion_days', '7', 'Minimum days between rank promotions', 'ranks'),
  ('default_elo_start', '1000', 'Starting ELO for new players', 'elo'),
  ('tournament_registration_hours', '24', 'Hours before tournament start to close registration', 'tournaments');

-- Function to log configuration changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.game_config_logs (
    config_table, config_id, action_type, old_values, new_values, changed_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    row_to_json(OLD),
    row_to_json(NEW),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for change logging
CREATE TRIGGER log_game_configurations_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.game_configurations
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER log_elo_rules_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.elo_calculation_rules
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER log_rank_definitions_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.rank_definitions
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER log_spa_milestones_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.spa_reward_milestones
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER log_tournament_rewards_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.tournament_reward_structures
  FOR EACH ROW EXECUTE FUNCTION log_config_change();
