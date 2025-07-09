-- Enhanced ELO System with Penalties and Tournament Tiers

-- Tournament Tiers Table
CREATE TABLE public.tournament_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  points_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  qualification_required BOOLEAN DEFAULT false,
  min_participants INTEGER DEFAULT 8,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default tournament tiers
INSERT INTO public.tournament_tiers (tier_name, tier_level, points_multiplier, qualification_required, min_participants, description) VALUES
('Club', 1, 1.0, false, 4, 'Local club tournaments'),
('Regional', 2, 1.5, true, 16, 'Regional competitions - requires club tournament wins'),
('National', 3, 2.0, true, 32, 'National championships - requires regional qualification'),
('Championship', 4, 3.0, true, 64, 'Elite championship events - invitation only');

-- ELO Rules Table (separate from SPA rules)
CREATE TABLE public.elo_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- 'tournament_position', 'penalty', 'bonus'
  condition_key TEXT NOT NULL, -- 'champion', 'runner_up', 'early_exit', 'no_show', etc.
  points_base INTEGER NOT NULL,
  points_multiplier NUMERIC(3,2) DEFAULT 1.0,
  tier_level INTEGER REFERENCES public.tournament_tiers(tier_level),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert ELO rules with penalties
INSERT INTO public.elo_rules (rule_type, condition_key, points_base, description) VALUES
-- Tournament position rewards
('tournament_position', 'champion', 100, 'Tournament champion'),
('tournament_position', 'runner_up', 50, 'Tournament runner-up'),
('tournament_position', 'semi_finalist', 25, 'Semi-finalist (3rd-4th place)'),
('tournament_position', 'quarter_finalist', 12, 'Quarter-finalist (5th-8th place)'),
('tournament_position', 'top_16', 6, 'Round of 16'),
('tournament_position', 'top_32', 3, 'Round of 32'),
('tournament_position', 'participation', 1, 'Tournament participation'),

-- Penalties
('penalty', 'early_exit', -15, 'Early elimination (first round out)'),
('penalty', 'no_show', -50, 'No-show penalty'),
('penalty', 'underperform', -10, 'Underperformed vs expected ranking'),
('penalty', 'forfeit', -25, 'Match forfeit'),

-- Bonuses
('bonus', 'upset_victory', 15, 'Defeating higher-ranked opponent'),
('bonus', 'perfect_run', 25, 'Winning tournament without losing a match'),
('bonus', 'comeback', 10, 'Winning from significant deficit');

-- Player ELO Decay Tracking
CREATE TABLE public.player_elo_decay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(user_id),
  last_tournament_date TIMESTAMP WITH TIME ZONE,
  last_match_date TIMESTAMP WITH TIME ZONE,
  decay_applied_at TIMESTAMP WITH TIME ZONE,
  decay_amount INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'inactive_30', 'inactive_60', 'dormant'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(player_id)
);

-- Tournament Qualifications Tracking
CREATE TABLE public.tournament_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.profiles(user_id),
  qualified_from_tournament_id UUID REFERENCES public.tournaments(id),
  qualified_for_tier_level INTEGER REFERENCES public.tournament_tiers(tier_level),
  qualification_type TEXT NOT NULL, -- 'champion', 'runner_up', 'top_4', 'invitation'
  qualification_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'used', 'expired'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update tournaments table to include tier
ALTER TABLE public.tournaments 
ADD COLUMN tier_level INTEGER REFERENCES public.tournament_tiers(tier_level) DEFAULT 1,
ADD COLUMN requires_qualification BOOLEAN DEFAULT false,
ADD COLUMN elo_multiplier NUMERIC(3,2) DEFAULT 1.0;

-- Enhanced ELO calculation function
CREATE OR REPLACE FUNCTION public.calculate_enhanced_elo(
  p_player_id UUID,
  p_tournament_id UUID,
  p_final_position INTEGER,
  p_total_participants INTEGER,
  p_match_results JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_player_elo INTEGER;
  v_base_points INTEGER := 0;
  v_penalty_points INTEGER := 0;
  v_bonus_points INTEGER := 0;
  v_final_points INTEGER;
  v_tier_multiplier NUMERIC(3,2);
  v_position_key TEXT;
  v_result JSONB;
BEGIN
  -- Get tournament and tier info
  SELECT t.*, tt.points_multiplier INTO v_tournament
  FROM public.tournaments t
  JOIN public.tournament_tiers tt ON t.tier_level = tt.tier_level
  WHERE t.id = p_tournament_id;
  
  -- Get current player ELO
  SELECT COALESCE(pr.elo_points, 1000) INTO v_player_elo
  FROM public.player_rankings pr
  WHERE pr.player_id = p_player_id;
  
  v_tier_multiplier := v_tournament.points_multiplier;
  
  -- Determine position key for base points
  v_position_key := CASE
    WHEN p_final_position = 1 THEN 'champion'
    WHEN p_final_position = 2 THEN 'runner_up'
    WHEN p_final_position <= 4 THEN 'semi_finalist'
    WHEN p_final_position <= 8 THEN 'quarter_finalist'
    WHEN p_final_position <= 16 THEN 'top_16'
    WHEN p_final_position <= 32 THEN 'top_32'
    ELSE 'participation'
  END;
  
  -- Get base points from rules
  SELECT points_base INTO v_base_points
  FROM public.elo_rules
  WHERE rule_type = 'tournament_position' 
  AND condition_key = v_position_key
  AND is_active = true;
  
  -- Apply early exit penalty if applicable
  IF p_final_position > (p_total_participants * 0.7) THEN
    SELECT points_base INTO v_penalty_points
    FROM public.elo_rules
    WHERE rule_type = 'penalty' 
    AND condition_key = 'early_exit'
    AND is_active = true;
  END IF;
  
  -- Check for upset bonus (simplified logic)
  IF p_final_position <= 4 AND v_player_elo < 1400 THEN
    SELECT points_base INTO v_bonus_points
    FROM public.elo_rules
    WHERE rule_type = 'bonus' 
    AND condition_key = 'upset_victory'
    AND is_active = true;
  END IF;
  
  -- Calculate final points with tier multiplier
  v_final_points := ROUND((v_base_points + v_penalty_points + v_bonus_points) * v_tier_multiplier);
  
  -- Update player ELO
  UPDATE public.player_rankings
  SET elo_points = elo_points + v_final_points,
      updated_at = now()
  WHERE player_id = p_player_id;
  
  -- Log the ELO change
  INSERT INTO public.elo_history (
    player_id, tournament_id, elo_before, elo_after, elo_change,
    match_result, created_at
  ) VALUES (
    p_player_id, p_tournament_id, v_player_elo, 
    v_player_elo + v_final_points, v_final_points,
    v_position_key, now()
  );
  
  -- Check for qualification to higher tier
  IF p_final_position <= 2 AND v_tournament.tier_level < 4 THEN
    INSERT INTO public.tournament_qualifications (
      player_id, qualified_from_tournament_id, qualified_for_tier_level,
      qualification_type, expires_at
    ) VALUES (
      p_player_id, p_tournament_id, v_tournament.tier_level + 1,
      CASE WHEN p_final_position = 1 THEN 'champion' ELSE 'runner_up' END,
      now() + INTERVAL '6 months'
    ) ON CONFLICT DO NOTHING;
  END IF;
  
  v_result := jsonb_build_object(
    'success', true,
    'base_points', v_base_points,
    'penalty_points', v_penalty_points,
    'bonus_points', v_bonus_points,
    'tier_multiplier', v_tier_multiplier,
    'final_points', v_final_points,
    'new_elo', v_player_elo + v_final_points,
    'qualification_earned', (p_final_position <= 2 AND v_tournament.tier_level < 4)
  );
  
  RETURN v_result;
END;
$$;

-- ELO Decay Function for inactive players
CREATE OR REPLACE FUNCTION public.apply_elo_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  decay_30_days INTEGER := 2; -- 2 points per week after 30 days
  decay_60_days INTEGER := 5; -- 5 points per week after 60 days
  affected_count INTEGER := 0;
BEGIN
  -- Apply decay to players inactive for 30+ days
  WITH inactive_players AS (
    UPDATE public.player_rankings pr
    SET elo_points = GREATEST(1000, elo_points - decay_30_days),
        updated_at = now()
    FROM public.profiles p
    WHERE pr.player_id = p.user_id
    AND pr.updated_at < now() - INTERVAL '30 days'
    AND pr.updated_at >= now() - INTERVAL '60 days'
    AND pr.elo_points > 1000
    RETURNING pr.player_id, decay_30_days as decay_amount
  )
  INSERT INTO public.elo_history (player_id, elo_before, elo_after, elo_change, match_result)
  SELECT 
    ip.player_id,
    pr.elo_points + ip.decay_amount,
    pr.elo_points,
    -ip.decay_amount,
    'decay_30_days'
  FROM inactive_players ip
  JOIN public.player_rankings pr ON pr.player_id = ip.player_id;
  
  -- Apply stronger decay to players inactive for 60+ days  
  WITH very_inactive_players AS (
    UPDATE public.player_rankings pr
    SET elo_points = GREATEST(1000, elo_points - decay_60_days),
        updated_at = now()
    FROM public.profiles p
    WHERE pr.player_id = p.user_id
    AND pr.updated_at < now() - INTERVAL '60 days'
    AND pr.elo_points > 1000
    RETURNING pr.player_id, decay_60_days as decay_amount
  )
  INSERT INTO public.elo_history (player_id, elo_before, elo_after, elo_change, match_result)
  SELECT 
    vip.player_id,
    pr.elo_points + vip.decay_amount,
    pr.elo_points,
    -vip.decay_amount,
    'decay_60_days'
  FROM very_inactive_players vip
  JOIN public.player_rankings pr ON pr.player_id = vip.decay_amount;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log decay application
  INSERT INTO public.system_logs (log_type, message, metadata)
  VALUES (
    'elo_decay',
    'Applied ELO decay to inactive players',
    jsonb_build_object(
      'affected_players', affected_count,
      'decay_30_days', decay_30_days,
      'decay_60_days', decay_60_days
    )
  );
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.tournament_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_elo_decay ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_qualifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view tournament tiers" ON public.tournament_tiers FOR SELECT USING (true);
CREATE POLICY "Everyone can view ELO rules" ON public.elo_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage ELO rules" ON public.elo_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Players can view their own decay status" ON public.player_elo_decay FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "System can manage decay tracking" ON public.player_elo_decay FOR ALL USING (true);
CREATE POLICY "Players can view their qualifications" ON public.tournament_qualifications FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "System can manage qualifications" ON public.tournament_qualifications FOR ALL USING (true);