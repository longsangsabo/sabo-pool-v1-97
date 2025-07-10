
-- Create SPA points rules table if not exists
CREATE TABLE IF NOT EXISTS public.spa_points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- 'tournament_position' or 'match_result'
  condition_key TEXT NOT NULL, -- 'champion', 'runner_up', 'top_3', etc.
  rank_requirement TEXT NOT NULL, -- 'E', 'F', 'G', 'H', 'I', 'K'
  base_points INTEGER NOT NULL DEFAULT 0,
  multiplier NUMERIC DEFAULT 1.0,
  tournament_type TEXT DEFAULT 'normal', -- 'normal', 'season', 'open'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_spa_rules_unique 
ON public.spa_points_rules (rule_type, condition_key, rank_requirement, tournament_type) 
WHERE is_active = true;

-- Insert tournament position rules based on rank
INSERT INTO public.spa_points_rules (rule_type, condition_key, rank_requirement, base_points, tournament_type, description) VALUES
-- Champion points by rank
('tournament_position', 'champion', 'E', 100, 'normal', 'Vô địch giải hạng E'),
('tournament_position', 'champion', 'F', 80, 'normal', 'Vô địch giải hạng F'),
('tournament_position', 'champion', 'G', 60, 'normal', 'Vô địch giải hạng G'),
('tournament_position', 'champion', 'H', 50, 'normal', 'Vô địch giải hạng H'),
('tournament_position', 'champion', 'I', 40, 'normal', 'Vô địch giải hạng I'),
('tournament_position', 'champion', 'K', 30, 'normal', 'Vô địch giải hạng K'),

-- Runner-up points by rank
('tournament_position', 'runner_up', 'E', 70, 'normal', 'Á quân giải hạng E'),
('tournament_position', 'runner_up', 'F', 56, 'normal', 'Á quân giải hạng F'),
('tournament_position', 'runner_up', 'G', 42, 'normal', 'Á quân giải hạng G'),
('tournament_position', 'runner_up', 'H', 35, 'normal', 'Á quân giải hạng H'),
('tournament_position', 'runner_up', 'I', 28, 'normal', 'Á quân giải hạng I'),
('tournament_position', 'runner_up', 'K', 21, 'normal', 'Á quân giải hạng K'),

-- Top 3 points by rank
('tournament_position', 'top_3', 'E', 50, 'normal', 'Top 3 giải hạng E'),
('tournament_position', 'top_3', 'F', 40, 'normal', 'Top 3 giải hạng F'),
('tournament_position', 'top_3', 'G', 30, 'normal', 'Top 3 giải hạng G'),
('tournament_position', 'top_3', 'H', 25, 'normal', 'Top 3 giải hạng H'),
('tournament_position', 'top_3', 'I', 20, 'normal', 'Top 3 giải hạng I'),
('tournament_position', 'top_3', 'K', 15, 'normal', 'Top 3 giải hạng K'),

-- Top 4 points by rank
('tournament_position', 'top_4', 'E', 40, 'normal', 'Top 4 giải hạng E'),
('tournament_position', 'top_4', 'F', 32, 'normal', 'Top 4 giải hạng F'),
('tournament_position', 'top_4', 'G', 24, 'normal', 'Top 4 giải hạng G'),
('tournament_position', 'top_4', 'H', 20, 'normal', 'Top 4 giải hạng H'),
('tournament_position', 'top_4', 'I', 16, 'normal', 'Top 4 giải hạng I'),
('tournament_position', 'top_4', 'K', 12, 'normal', 'Top 4 giải hạng K'),

-- Top 8 points by rank
('tournament_position', 'top_8', 'E', 30, 'normal', 'Top 8 giải hạng E'),
('tournament_position', 'top_8', 'F', 24, 'normal', 'Top 8 giải hạng F'),
('tournament_position', 'top_8', 'G', 18, 'normal', 'Top 8 giải hạng G'),
('tournament_position', 'top_8', 'H', 15, 'normal', 'Top 8 giải hạng H'),
('tournament_position', 'top_8', 'I', 12, 'normal', 'Top 8 giải hạng I'),
('tournament_position', 'top_8', 'K', 9, 'normal', 'Top 8 giải hạng K'),

-- Participation points by rank
('tournament_position', 'participation', 'E', 15, 'normal', 'Tham gia giải hạng E'),
('tournament_position', 'participation', 'F', 12, 'normal', 'Tham gia giải hạng F'),
('tournament_position', 'participation', 'G', 9, 'normal', 'Tham gia giải hạng G'),
('tournament_position', 'participation', 'H', 7, 'normal', 'Tham gia giải hạng H'),
('tournament_position', 'participation', 'I', 5, 'normal', 'Tham gia giải hạng I'),
('tournament_position', 'participation', 'K', 3, 'normal', 'Tham gia giải hạng K')

ON CONFLICT (rule_type, condition_key, rank_requirement, tournament_type) 
WHERE is_active = true DO NOTHING;

-- Create SPA calculation audit log table
CREATE TABLE IF NOT EXISTS public.spa_calculation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  player_id UUID NOT NULL,
  calculation_type TEXT NOT NULL, -- 'tournament_reward', 'match_result', 'correction'
  position TEXT, -- 'champion', 'runner_up', etc.
  player_rank TEXT,
  tournament_type TEXT DEFAULT 'normal',
  base_points INTEGER NOT NULL,
  multiplier NUMERIC DEFAULT 1.0,
  final_points INTEGER NOT NULL,
  rule_used_id UUID REFERENCES public.spa_points_rules(id),
  calculated_by UUID, -- admin or system
  calculation_method TEXT DEFAULT 'automatic', -- 'automatic', 'manual', 'correction'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_spa_logs_tournament ON public.spa_calculation_logs(tournament_id);
CREATE INDEX IF NOT EXISTS idx_spa_logs_player ON public.spa_calculation_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_spa_logs_created ON public.spa_calculation_logs(created_at);

-- Create function to get SPA points for tournament position
CREATE OR REPLACE FUNCTION public.get_tournament_spa_points(
  p_position TEXT,
  p_player_rank TEXT,
  p_tournament_type TEXT DEFAULT 'normal'
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_points INTEGER;
  v_multiplier NUMERIC;
  v_final_points INTEGER;
BEGIN
  -- Get base points from rules table
  SELECT base_points, multiplier INTO v_base_points, v_multiplier
  FROM public.spa_points_rules
  WHERE rule_type = 'tournament_position'
  AND condition_key = p_position
  AND rank_requirement = p_player_rank
  AND tournament_type = p_tournament_type
  AND is_active = true;
  
  -- If no rule found, return 0
  IF v_base_points IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculate final points
  v_final_points := FLOOR(v_base_points * COALESCE(v_multiplier, 1.0));
  
  RETURN v_final_points;
END;
$$;

-- Create function to award tournament SPA with audit
CREATE OR REPLACE FUNCTION public.award_tournament_spa_with_audit(
  p_tournament_id UUID,
  p_player_id UUID,
  p_position TEXT,
  p_player_rank TEXT,
  p_tournament_type TEXT DEFAULT 'normal',
  p_calculated_by UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_points INTEGER;
  v_multiplier NUMERIC;
  v_final_points INTEGER;
  v_rule_id UUID;
  v_result JSONB;
BEGIN
  -- Get rule and calculate points
  SELECT id, base_points, multiplier 
  INTO v_rule_id, v_base_points, v_multiplier
  FROM public.spa_points_rules
  WHERE rule_type = 'tournament_position'
  AND condition_key = p_position
  AND rank_requirement = p_player_rank
  AND tournament_type = p_tournament_type
  AND is_active = true;
  
  -- If no rule found, return error
  IF v_rule_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No SPA rule found for position: ' || p_position || ', rank: ' || p_player_rank
    );
  END IF;
  
  v_final_points := FLOOR(v_base_points * COALESCE(v_multiplier, 1.0));
  
  -- Award the points
  PERFORM public.credit_spa_points(
    p_player_id,
    v_final_points,
    'tournament',
    'Giải đấu - ' || p_position || ' (Hạng ' || p_player_rank || ')',
    p_tournament_id::TEXT
  );
  
  -- Log the calculation
  INSERT INTO public.spa_calculation_logs (
    tournament_id, player_id, calculation_type, position, player_rank,
    tournament_type, base_points, multiplier, final_points, rule_used_id,
    calculated_by, calculation_method
  ) VALUES (
    p_tournament_id, p_player_id, 'tournament_reward', p_position, p_player_rank,
    p_tournament_type, v_base_points, v_multiplier, v_final_points, v_rule_id,
    COALESCE(p_calculated_by, auth.uid()), 'automatic'
  );
  
  -- Check and award milestones
  PERFORM public.check_and_award_milestones(p_player_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_final_points,
    'base_points', v_base_points,
    'multiplier', v_multiplier,
    'rule_id', v_rule_id
  );
END;
$$;

-- Create function to validate and fix SPA calculations
CREATE OR REPLACE FUNCTION public.validate_tournament_spa_calculations(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_expected_points INTEGER;
  v_actual_points INTEGER;
  v_corrections INTEGER := 0;
  v_errors JSONB := '[]';
BEGIN
  -- Get tournament info
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tournament not found');
  END IF;
  
  -- Check each participant's SPA calculation
  FOR v_participant IN 
    SELECT 
      tr.player_id,
      tr.final_position,
      COALESCE(pr.current_rank, 'K') as player_rank,
      COALESCE(tr.spa_points_awarded, 0) as awarded_points
    FROM public.tournament_registrations tr
    LEFT JOIN public.player_rankings pr ON tr.player_id = pr.player_id
    WHERE tr.tournament_id = p_tournament_id
    AND tr.final_position IS NOT NULL
  LOOP
    -- Calculate expected points
    v_expected_points := public.get_tournament_spa_points(
      v_participant.final_position,
      v_participant.player_rank,
      COALESCE(v_tournament.tournament_type, 'normal')
    );
    
    v_actual_points := v_participant.awarded_points;
    
    -- If points don't match, log the discrepancy
    IF v_expected_points != v_actual_points THEN
      v_errors := v_errors || jsonb_build_object(
        'player_id', v_participant.player_id,
        'position', v_participant.final_position,
        'expected_points', v_expected_points,
        'actual_points', v_actual_points,
        'difference', v_expected_points - v_actual_points
      );
      
      v_corrections := v_corrections + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'corrections_needed', v_corrections,
    'discrepancies', v_errors
  );
END;
$$;

-- Enable RLS
ALTER TABLE public.spa_points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spa_calculation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view active SPA rules" ON public.spa_points_rules
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage SPA rules" ON public.spa_points_rules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "Admins can view all SPA calculation logs" ON public.spa_calculation_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
  )
);

CREATE POLICY "System can insert SPA calculation logs" ON public.spa_calculation_logs
FOR INSERT WITH CHECK (true);

-- Create automated trigger for tournament completion
CREATE OR REPLACE FUNCTION public.auto_validate_spa_on_tournament_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When tournament status changes to completed, validate SPA calculations
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Schedule validation in background
    PERFORM public.validate_tournament_spa_calculations(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trigger_auto_validate_spa
AFTER UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.auto_validate_spa_on_tournament_complete();
