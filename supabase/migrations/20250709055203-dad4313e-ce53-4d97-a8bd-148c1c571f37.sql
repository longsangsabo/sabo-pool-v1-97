
-- Create SPA Points Rules Configuration Table
CREATE TABLE public.spa_points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type TEXT NOT NULL, -- 'tournament', 'challenge', 'milestone', 'bonus'
  rule_key TEXT NOT NULL, -- 'champion_rank_e', 'streak_multiplier', etc.
  rule_value JSONB NOT NULL, -- flexible config values
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  effective_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(rule_type, rule_key)
);

-- Insert default SPA tournament rules based on rank
INSERT INTO public.spa_points_rules (rule_type, rule_key, rule_value) VALUES
-- Tournament rewards by rank and position
('tournament', 'champion', '{"rank_e": 1500, "rank_d": 1400, "rank_c": 1300, "rank_b": 1200, "rank_a": 1100, "rank_s": 1000, "rank_k": 900}'),
('tournament', 'runner_up', '{"rank_e": 1100, "rank_d": 1000, "rank_c": 950, "rank_b": 900, "rank_a": 850, "rank_s": 800, "rank_k": 700}'),
('tournament', 'top_3', '{"rank_e": 900, "rank_d": 850, "rank_c": 800, "rank_b": 750, "rank_a": 700, "rank_s": 650, "rank_k": 500}'),
('tournament', 'top_4', '{"rank_e": 650, "rank_d": 600, "rank_c": 550, "rank_b": 500, "rank_a": 450, "rank_s": 400, "rank_k": 350}'),
('tournament', 'top_8', '{"rank_e": 320, "rank_d": 280, "rank_c": 240, "rank_b": 200, "rank_a": 160, "rank_s": 140, "rank_k": 120}'),
('tournament', 'participation', '{"rank_e": 120, "rank_d": 115, "rank_c": 110, "rank_b": 108, "rank_a": 105, "rank_s": 102, "rank_k": 100}'),

-- Challenge rules
('challenge', 'bet_limits', '{"min_bet": 100, "max_bet": 650, "daily_limit": 2}'),
('challenge', 'win_multiplier', '{"base": 1.0, "rank_advantage_bonus": 0.25}'),
('challenge', 'loss_multiplier', '{"base": 0.5}'),
('challenge', 'overtime_penalty', '{"multiplier": 0.3}'),

-- Bonus system rules
('bonus', 'streak_multiplier', '{"per_win": 0.05, "max_multiplier": 0.5, "max_streak": 10}'),
('bonus', 'time_multiplier', '{"morning": {"start": "06:00", "end": "09:00", "multiplier": 1.5}, "evening": {"start": "19:00", "end": "22:00", "multiplier": 1.2}, "default": 1.0}'),
('bonus', 'comeback_bonus', '{"points": 50, "min_days": 14, "max_days": 30}'),

-- Milestone rules
('milestone', 'first_10_matches', '{"points": 100, "required": 10}'),
('milestone', '50_matches', '{"points": 200, "required": 50}'),
('milestone', '100_matches', '{"points": 500, "required": 100}'),
('milestone', 'win_rate_50', '{"points": 150, "min_matches": 20, "required_rate": 0.5}'),
('milestone', 'first_tournament_win', '{"points": 200}'),
('milestone', 'perfect_match', '{"points": 100}');

-- Enable RLS
ALTER TABLE public.spa_points_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view SPA rules" ON public.spa_points_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage SPA rules" ON public.spa_points_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Function to get SPA rule value
CREATE OR REPLACE FUNCTION public.get_spa_rule_value(
  p_rule_type TEXT,
  p_rule_key TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule_value JSONB;
BEGIN
  SELECT rule_value INTO rule_value
  FROM public.spa_points_rules
  WHERE rule_type = p_rule_type 
    AND rule_key = p_rule_key
    AND is_active = true
    AND (effective_until IS NULL OR effective_until > now());
  
  RETURN COALESCE(rule_value, '{}'::jsonb);
END;
$$;

-- Enhanced function to calculate streak bonus
CREATE OR REPLACE FUNCTION public.calculate_streak_bonus(
  p_player_id UUID,
  p_base_points INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak_count INTEGER := 0;
  streak_rules JSONB;
  per_win_bonus NUMERIC;
  max_multiplier NUMERIC;
  max_streak INTEGER;
  bonus_multiplier NUMERIC;
BEGIN
  -- Get streak rules
  SELECT public.get_spa_rule_value('bonus', 'streak_multiplier') INTO streak_rules;
  
  per_win_bonus := (streak_rules->>'per_win')::NUMERIC;
  max_multiplier := (streak_rules->>'max_multiplier')::NUMERIC;
  max_streak := (streak_rules->>'max_streak')::INTEGER;
  
  -- Calculate current win streak from last 10 matches
  WITH recent_matches AS (
    SELECT 
      winner_id,
      ROW_NUMBER() OVER (ORDER BY created_at DESC) as match_order
    FROM public.match_results mr
    WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id)
      AND mr.result_status = 'verified'
    ORDER BY created_at DESC
    LIMIT 10
  )
  SELECT COUNT(*) INTO streak_count
  FROM recent_matches
  WHERE winner_id = p_player_id
    AND match_order <= (
      SELECT COALESCE(MIN(match_order), 11)
      FROM recent_matches
      WHERE winner_id != p_player_id
    );
  
  -- Calculate bonus multiplier
  bonus_multiplier := LEAST(streak_count * per_win_bonus, max_multiplier);
  
  RETURN FLOOR(p_base_points * bonus_multiplier);
END;
$$;

-- Function to calculate time multiplier
CREATE OR REPLACE FUNCTION public.calculate_time_multiplier(
  p_match_time TIMESTAMP WITH TIME ZONE DEFAULT now()
) RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  time_rules JSONB;
  match_hour INTEGER;
  morning_start INTEGER;
  morning_end INTEGER;
  evening_start INTEGER;
  evening_end INTEGER;
BEGIN
  -- Get time multiplier rules
  SELECT public.get_spa_rule_value('bonus', 'time_multiplier') INTO time_rules;
  
  -- Extract hour from match time (Vietnam timezone)
  match_hour := EXTRACT(HOUR FROM p_match_time AT TIME ZONE 'Asia/Ho_Chi_Minh');
  
  -- Parse time rules
  morning_start := EXTRACT(HOUR FROM (time_rules->'morning'->>'start')::TIME);
  morning_end := EXTRACT(HOUR FROM (time_rules->'morning'->>'end')::TIME);
  evening_start := EXTRACT(HOUR FROM (time_rules->'evening'->>'start')::TIME);
  evening_end := EXTRACT(HOUR FROM (time_rules->'evening'->>'end')::TIME);
  
  -- Check time periods
  IF match_hour >= morning_start AND match_hour < morning_end THEN
    RETURN (time_rules->'morning'->>'multiplier')::NUMERIC;
  ELSIF match_hour >= evening_start AND match_hour < evening_end THEN
    RETURN (time_rules->'evening'->>'multiplier')::NUMERIC;
  ELSE
    RETURN (time_rules->>'default')::NUMERIC;
  END IF;
END;
$$;

-- Function to calculate comeback bonus
CREATE OR REPLACE FUNCTION public.calculate_comeback_bonus(
  p_player_id UUID
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_activity TIMESTAMP WITH TIME ZONE;
  comeback_rules JSONB;
  bonus_points INTEGER;
  min_days INTEGER;
  max_days INTEGER;
  days_inactive INTEGER;
BEGIN
  -- Get comeback bonus rules
  SELECT public.get_spa_rule_value('bonus', 'comeback_bonus') INTO comeback_rules;
  
  bonus_points := (comeback_rules->>'points')::INTEGER;
  min_days := (comeback_rules->>'min_days')::INTEGER;
  max_days := (comeback_rules->>'max_days')::INTEGER;
  
  -- Find last activity (match or challenge)
  SELECT GREATEST(
    COALESCE(MAX(mr.created_at), '1970-01-01'::TIMESTAMP WITH TIME ZONE),
    COALESCE(MAX(c.created_at), '1970-01-01'::TIMESTAMP WITH TIME ZONE)
  ) INTO last_activity
  FROM public.match_results mr
  FULL OUTER JOIN public.challenges c ON (
    c.challenger_id = p_player_id OR c.opponent_id = p_player_id
  )
  WHERE (mr.player1_id = p_player_id OR mr.player2_id = p_player_id);
  
  -- Calculate days inactive
  days_inactive := EXTRACT(DAY FROM now() - last_activity);
  
  -- Award comeback bonus if within range
  IF days_inactive >= min_days AND days_inactive <= max_days THEN
    RETURN bonus_points;
  END IF;
  
  RETURN 0;
END;
$$;

-- Enhanced function to complete challenge match with all bonuses
CREATE OR REPLACE FUNCTION public.complete_challenge_match_with_bonuses(
  p_challenge_id UUID,
  p_winner_id UUID,
  p_loser_id UUID,
  p_winner_score INTEGER,
  p_loser_score INTEGER,
  p_match_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  challenge_rec RECORD;
  base_points INTEGER;
  streak_bonus INTEGER := 0;
  comeback_bonus INTEGER := 0;
  time_multiplier NUMERIC := 1.0;
  total_winner_points INTEGER;
  loser_penalty_points INTEGER;
  result JSONB;
  match_result_id UUID;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_rec FROM public.challenges WHERE id = p_challenge_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found');
  END IF;
  
  -- Calculate base points from bet amount
  base_points := challenge_rec.bet_points;
  
  -- Calculate bonuses
  streak_bonus := public.calculate_streak_bonus(p_winner_id, base_points);
  comeback_bonus := public.calculate_comeback_bonus(p_winner_id);
  time_multiplier := public.calculate_time_multiplier(now());
  
  -- Calculate total points for winner
  total_winner_points := FLOOR((base_points + streak_bonus + comeback_bonus) * time_multiplier);
  
  -- Calculate penalty for loser (50% of base points)
  loser_penalty_points := FLOOR(base_points * 0.5);
  
  -- Create match result
  INSERT INTO public.match_results (
    player1_id, player2_id, winner_id, loser_id,
    player1_score, player2_score, 
    match_format, result_status, match_notes,
    created_by
  ) VALUES (
    challenge_rec.challenger_id, challenge_rec.opponent_id, p_winner_id, p_loser_id,
    CASE WHEN challenge_rec.challenger_id = p_winner_id THEN p_winner_score ELSE p_loser_score END,
    CASE WHEN challenge_rec.challenger_id = p_winner_id THEN p_loser_score ELSE p_winner_score END,
    'race_to_' || challenge_rec.race_to, 'verified', p_match_notes,
    p_winner_id
  ) RETURNING id INTO match_result_id;
  
  -- Award points to winner
  PERFORM public.credit_spa_points(
    p_winner_id,
    total_winner_points,
    'challenge_win',
    'Thắng thách đấu: ' || total_winner_points || ' SPA (Base: ' || base_points || 
    CASE WHEN streak_bonus > 0 THEN ', Streak: +' || streak_bonus ELSE '' END ||
    CASE WHEN comeback_bonus > 0 THEN ', Comeback: +' || comeback_bonus ELSE '' END ||
    CASE WHEN time_multiplier != 1.0 THEN ', Time: x' || time_multiplier ELSE '' END || ')',
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'match_result_id', match_result_id,
      'base_points', base_points,
      'streak_bonus', streak_bonus,
      'comeback_bonus', comeback_bonus,
      'time_multiplier', time_multiplier
    )
  );
  
  -- Deduct points from loser
  PERFORM public.debit_spa_points(
    p_loser_id,
    loser_penalty_points,
    'challenge_loss',
    'Thua thách đấu: -' || loser_penalty_points || ' SPA',
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'match_result_id', match_result_id
    )
  );
  
  -- Update challenge status
  UPDATE public.challenges 
  SET status = 'completed',
      updated_at = now()
  WHERE id = p_challenge_id;
  
  -- Check and award milestones
  PERFORM public.check_and_award_milestones(p_winner_id);
  PERFORM public.check_and_award_milestones(p_loser_id);
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'match_result_id', match_result_id,
    'winner_points', total_winner_points,
    'loser_penalty', loser_penalty_points,
    'bonuses', jsonb_build_object(
      'base_points', base_points,
      'streak_bonus', streak_bonus,
      'comeback_bonus', comeback_bonus,
      'time_multiplier', time_multiplier
    )
  );
  
  RETURN result;
END;
$$;

-- Function to check and award milestones
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(
  p_player_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_matches INTEGER;
  total_wins INTEGER;
  win_rate NUMERIC;
  milestone_rule JSONB;
  milestone_rec RECORD;
BEGIN
  -- Get player stats
  SELECT 
    COALESCE(COUNT(*), 0) as matches,
    COALESCE(SUM(CASE WHEN winner_id = p_player_id THEN 1 ELSE 0 END), 0) as wins
  INTO total_matches, total_wins
  FROM public.match_results
  WHERE (player1_id = p_player_id OR player2_id = p_player_id)
    AND result_status = 'verified';
  
  win_rate := CASE WHEN total_matches > 0 THEN total_wins::NUMERIC / total_matches ELSE 0 END;
  
  -- Check match count milestones
  FOR milestone_rec IN 
    SELECT rule_key, rule_value 
    FROM public.spa_points_rules 
    WHERE rule_type = 'milestone' 
      AND rule_key IN ('first_10_matches', '50_matches', '100_matches')
      AND is_active = true
  LOOP
    milestone_rule := milestone_rec.rule_value;
    
    IF total_matches >= (milestone_rule->>'required')::INTEGER THEN
      -- Check if not already awarded
      IF NOT EXISTS (
        SELECT 1 FROM public.wallet_transactions
        WHERE user_id = p_player_id 
          AND transaction_type = 'credit'
          AND source_type = 'milestone'
          AND (metadata->>'milestone_type') = milestone_rec.rule_key
      ) THEN
        PERFORM public.credit_spa_points(
          p_player_id,
          (milestone_rule->>'points')::INTEGER,
          'milestone',
          'Cột mốc: ' || (milestone_rule->>'required')::TEXT || ' trận đấu',
          jsonb_build_object('milestone_type', milestone_rec.rule_key)
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Check win rate milestone
  IF total_matches >= 20 AND win_rate >= 0.5 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.wallet_transactions
      WHERE user_id = p_player_id 
        AND transaction_type = 'credit'
        AND source_type = 'milestone'
        AND (metadata->>'milestone_type') = 'win_rate_50'
    ) THEN
      SELECT rule_value INTO milestone_rule
      FROM public.spa_points_rules
      WHERE rule_type = 'milestone' AND rule_key = 'win_rate_50';
      
      PERFORM public.credit_spa_points(
        p_player_id,
        (milestone_rule->>'points')::INTEGER,
        'milestone',
        'Cột mốc: Tỷ lệ thắng 50%',
        jsonb_build_object('milestone_type', 'win_rate_50')
      );
    END IF;
  END IF;
END;
$$;

-- Create trigger for automatic milestone checking
CREATE OR REPLACE FUNCTION public.trigger_milestone_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check milestones for both players when match is verified
  IF NEW.result_status = 'verified' AND (OLD.result_status IS NULL OR OLD.result_status != 'verified') THEN
    PERFORM public.check_and_award_milestones(NEW.player1_id);
    PERFORM public.check_and_award_milestones(NEW.player2_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS milestone_check_trigger ON public.match_results;
CREATE TRIGGER milestone_check_trigger
  AFTER INSERT OR UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_milestone_check();
