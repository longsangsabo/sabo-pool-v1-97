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

-- 5. Enhanced credit_spa_points function with full automation support
CREATE OR REPLACE FUNCTION public.credit_spa_points(
  p_user_id UUID,
  p_amount INTEGER,
  p_category TEXT DEFAULT 'match',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Create SPA transaction record
  INSERT INTO public.spa_transactions (
    user_id, amount, transaction_type, category, description, 
    reference_id, reference_type, metadata, status
  ) VALUES (
    p_user_id, p_amount, 
    CASE 
      WHEN p_amount > 0 THEN COALESCE(p_category || '_win', 'match_win')
      ELSE COALESCE(p_category || '_loss', 'match_loss')
    END,
    p_category, p_description, p_reference_id, p_reference_type, p_metadata, 'completed'
  ) RETURNING id INTO v_transaction_id;

  -- Update wallet balance
  INSERT INTO public.wallets (user_id, points_balance, status)
  VALUES (p_user_id, p_amount, 'active')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    points_balance = wallets.points_balance + p_amount,
    updated_at = NOW()
  RETURNING points_balance INTO v_new_balance;

  -- Get previous balance
  v_current_balance := v_new_balance - p_amount;

  -- Update player rankings SPA points
  INSERT INTO public.player_rankings (player_id, spa_points, updated_at)
  VALUES (p_user_id, p_amount, NOW())
  ON CONFLICT (player_id)
  DO UPDATE SET
    spa_points = player_rankings.spa_points + p_amount,
    updated_at = NOW();

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'user_id', p_user_id,
    'amount_credited', p_amount,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'category', p_category,
    'description', p_description
  );

  RETURN v_result;
END;
$$;

-- 6. Enhanced automatic ELO calculation function
CREATE OR REPLACE FUNCTION public.calculate_and_update_match_elo(
  p_match_result_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_player1_elo INTEGER;
  v_player2_elo INTEGER;
  v_player1_new_elo INTEGER;
  v_player2_new_elo INTEGER;
  v_elo_change1 INTEGER;
  v_elo_change2 INTEGER;
  v_expected_score1 NUMERIC;
  v_actual_score1 NUMERIC;
  v_k_factor INTEGER := 32; -- Fixed K-factor
  v_result JSONB;
BEGIN
  -- Get match result details
  SELECT * INTO v_match FROM public.match_results WHERE id = p_match_result_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Match result not found');
  END IF;

  -- Get current ELO ratings
  SELECT COALESCE(elo_points, 1000) INTO v_player1_elo 
  FROM public.player_rankings WHERE player_id = v_match.player1_id;
  
  SELECT COALESCE(elo_points, 1000) INTO v_player2_elo 
  FROM public.player_rankings WHERE player_id = v_match.player2_id;

  -- Calculate expected scores
  v_expected_score1 := 1.0 / (1.0 + POWER(10, (v_player2_elo - v_player1_elo) / 400.0));
  
  -- Calculate actual score (1 for win, 0 for loss)
  v_actual_score1 := CASE 
    WHEN v_match.winner_id = v_match.player1_id THEN 1.0
    WHEN v_match.winner_id = v_match.player2_id THEN 0.0
    ELSE 0.5 -- Draw case
  END;

  -- Calculate ELO changes
  v_elo_change1 := ROUND(v_k_factor * (v_actual_score1 - v_expected_score1));
  v_elo_change2 := -v_elo_change1; -- Zero-sum system

  -- Calculate new ELO ratings
  v_player1_new_elo := v_player1_elo + v_elo_change1;
  v_player2_new_elo := v_player2_elo + v_elo_change2;

  -- Update match result with ELO data
  UPDATE public.match_results SET
    player1_elo_before = v_player1_elo,
    player2_elo_before = v_player2_elo,
    player1_elo_after = v_player1_new_elo,
    player2_elo_after = v_player2_new_elo,
    player1_elo_change = v_elo_change1,
    player2_elo_change = v_elo_change2,
    updated_at = NOW()
  WHERE id = p_match_result_id;

  -- Update player rankings with new ELO
  INSERT INTO public.player_rankings (player_id, elo_points, elo, updated_at)
  VALUES 
    (v_match.player1_id, v_player1_new_elo, v_player1_new_elo, NOW()),
    (v_match.player2_id, v_player2_new_elo, v_player2_new_elo, NOW())
  ON CONFLICT (player_id) DO UPDATE SET
    elo_points = EXCLUDED.elo_points,
    elo = EXCLUDED.elo,
    updated_at = NOW();

  -- Log automation activity
  INSERT INTO public.match_automation_log (
    match_id, automation_type, status, result, processed_at
  ) VALUES (
    v_match.match_id, 'elo_calculation', 'completed',
    jsonb_build_object(
      'player1_elo_change', v_elo_change1,
      'player2_elo_change', v_elo_change2,
      'k_factor', v_k_factor
    ),
    NOW()
  );

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'player1_elo_change', v_elo_change1,
    'player2_elo_change', v_elo_change2,
    'player1_new_elo', v_player1_new_elo,
    'player2_new_elo', v_player2_new_elo,
    'k_factor', v_k_factor
  );

  RETURN v_result;
END;
$$;

-- 7. Enhanced automatic rank promotion function
CREATE OR REPLACE FUNCTION public.check_and_update_ranks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player RECORD;
  v_new_rank TEXT;
  v_promotions INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Loop through all players and check for rank promotions
  FOR v_player IN 
    SELECT player_id, elo_points, current_rank
    FROM public.player_rankings
    WHERE elo_points IS NOT NULL
  LOOP
    -- Determine new rank based on ELO
    v_new_rank := CASE 
      WHEN v_player.elo_points >= 2100 THEN 'E+'
      WHEN v_player.elo_points >= 2000 THEN 'E'
      WHEN v_player.elo_points >= 1900 THEN 'F+'
      WHEN v_player.elo_points >= 1800 THEN 'F'
      WHEN v_player.elo_points >= 1700 THEN 'G+'
      WHEN v_player.elo_points >= 1600 THEN 'G'
      WHEN v_player.elo_points >= 1500 THEN 'H+'
      WHEN v_player.elo_points >= 1400 THEN 'H'
      WHEN v_player.elo_points >= 1300 THEN 'I+'
      WHEN v_player.elo_points >= 1200 THEN 'I'
      WHEN v_player.elo_points >= 1100 THEN 'K+'
      ELSE 'K'
    END;

    -- Update rank if changed
    IF v_new_rank != COALESCE(v_player.current_rank, 'K') THEN
      UPDATE public.player_rankings
      SET current_rank = v_new_rank, updated_at = NOW()
      WHERE player_id = v_player.player_id;

      -- Update profile rank as well
      UPDATE public.profiles
      SET current_rank = v_new_rank, updated_at = NOW()
      WHERE user_id = v_player.player_id;

      v_promotions := v_promotions + 1;

      -- Create notification for rank change
      INSERT INTO public.notifications (user_id, type, title, message, priority)
      VALUES (
        v_player.player_id,
        'rank_promotion',
        'Thăng hạng!',
        'Chúc mừng! Bạn đã thăng hạng lên ' || v_new_rank,
        'high'
      );
    END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'promotions_processed', v_promotions,
    'processed_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- 8. Create comprehensive milestone checking function
CREATE OR REPLACE FUNCTION public.check_and_award_milestones(
  p_player_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player_stats RECORD;
  v_milestones_awarded INTEGER := 0;
  v_total_spa_awarded INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get current player stats
  SELECT 
    total_matches, wins, 
    CASE WHEN total_matches > 0 THEN (wins::NUMERIC / total_matches * 100) ELSE 0 END as win_rate,
    spa_points, elo_points
  INTO v_player_stats
  FROM public.player_rankings
  WHERE player_id = p_player_id;

  -- Check various milestones and award if achieved

  -- 1. First 10 matches milestone
  IF v_player_stats.total_matches >= 10 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.spa_transactions 
      WHERE user_id = p_player_id AND transaction_type = 'milestone_reward' 
      AND description = 'Milestone: 10 matches completed'
    ) THEN
      PERFORM public.credit_spa_points(
        p_player_id, 100, 'milestone', 'Milestone: 10 matches completed',
        NULL, 'milestone', '{"milestone_type": "matches_10"}'
      );
      v_milestones_awarded := v_milestones_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + 100;
    END IF;
  END IF;

  -- 2. 50 matches milestone  
  IF v_player_stats.total_matches >= 50 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.spa_transactions 
      WHERE user_id = p_player_id AND transaction_type = 'milestone_reward' 
      AND description = 'Milestone: 50 matches completed'
    ) THEN
      PERFORM public.credit_spa_points(
        p_player_id, 200, 'milestone', 'Milestone: 50 matches completed',
        NULL, 'milestone', '{"milestone_type": "matches_50"}'
      );
      v_milestones_awarded := v_milestones_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + 200;
    END IF;
  END IF;

  -- 3. 100 matches milestone
  IF v_player_stats.total_matches >= 100 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.spa_transactions 
      WHERE user_id = p_player_id AND transaction_type = 'milestone_reward' 
      AND description = 'Milestone: 100 matches completed'
    ) THEN
      PERFORM public.credit_spa_points(
        p_player_id, 500, 'milestone', 'Milestone: 100 matches completed',
        NULL, 'milestone', '{"milestone_type": "matches_100"}'
      );
      v_milestones_awarded := v_milestones_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + 500;
    END IF;
  END IF;

  -- 4. 50% win rate milestone (minimum 20 matches)
  IF v_player_stats.total_matches >= 20 AND v_player_stats.win_rate >= 50 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.spa_transactions 
      WHERE user_id = p_player_id AND transaction_type = 'milestone_reward' 
      AND description = 'Milestone: 50% win rate achieved'
    ) THEN
      PERFORM public.credit_spa_points(
        p_player_id, 150, 'milestone', 'Milestone: 50% win rate achieved',
        NULL, 'milestone', '{"milestone_type": "win_rate_50"}'
      );
      v_milestones_awarded := v_milestones_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + 150;
    END IF;
  END IF;

  -- 5. ELO milestones
  IF v_player_stats.elo_points >= 1500 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.spa_transactions 
      WHERE user_id = p_player_id AND transaction_type = 'milestone_reward' 
      AND description = 'Milestone: Reached 1500 ELO'
    ) THEN
      PERFORM public.credit_spa_points(
        p_player_id, 300, 'milestone', 'Milestone: Reached 1500 ELO',
        NULL, 'milestone', '{"milestone_type": "elo_1500"}'
      );
      v_milestones_awarded := v_milestones_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + 300;
    END IF;
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'milestones_awarded', v_milestones_awarded,
    'total_spa_awarded', v_total_spa_awarded,
    'player_id', p_player_id
  );

  RETURN v_result;
END;
$$;

-- 9. Create tournament automation function
CREATE OR REPLACE FUNCTION public.process_tournament_completion(
  p_tournament_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tournament RECORD;
  v_participant RECORD;
  v_results_awarded INTEGER := 0;
  v_total_spa_awarded INTEGER := 0;
  v_total_elo_awarded INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Get tournament details
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Tournament not found');
  END IF;

  -- Award tournament rewards to all participants
  FOR v_participant IN
    SELECT 
      tr.player_id,
      p.current_rank,
      CASE 
        WHEN tm_final.winner_id = tr.player_id THEN 'CHAMPION'
        WHEN tm_final.player1_id = tr.player_id OR tm_final.player2_id = tr.player_id THEN 'RUNNER_UP'
        WHEN tm_third.winner_id = tr.player_id THEN 'THIRD_PLACE'
        ELSE 'PARTICIPATION'
      END as position
    FROM public.tournament_registrations tr
    LEFT JOIN public.profiles p ON tr.player_id = p.user_id
    LEFT JOIN public.tournament_matches tm_final ON tm_final.tournament_id = p_tournament_id 
      AND tm_final.round_number = (SELECT MAX(round_number) FROM public.tournament_matches WHERE tournament_id = p_tournament_id)
      AND tm_final.match_number = 1 AND tm_final.is_third_place_match = false
    LEFT JOIN public.tournament_matches tm_third ON tm_third.tournament_id = p_tournament_id 
      AND tm_third.is_third_place_match = true
    WHERE tr.tournament_id = p_tournament_id AND tr.registration_status = 'confirmed'
  LOOP
    DECLARE
      v_spa_reward INTEGER;
      v_elo_reward INTEGER;
      v_rank_code TEXT := COALESCE(v_participant.current_rank, 'K');
    BEGIN
      -- Calculate SPA reward based on position and rank
      v_spa_reward := CASE v_participant.position
        WHEN 'CHAMPION' THEN 
          CASE v_rank_code
            WHEN 'E+', 'E' THEN 1500
            WHEN 'F+', 'F' THEN 1200
            WHEN 'G+', 'G' THEN 1000
            WHEN 'H+', 'H' THEN 900
            WHEN 'I+', 'I' THEN 800
            ELSE 700
          END
        WHEN 'RUNNER_UP' THEN
          CASE v_rank_code
            WHEN 'E+', 'E' THEN 1100
            WHEN 'F+', 'F' THEN 900
            WHEN 'G+', 'G' THEN 750
            WHEN 'H+', 'H' THEN 650
            WHEN 'I+', 'I' THEN 550
            ELSE 450
          END
        WHEN 'THIRD_PLACE' THEN
          CASE v_rank_code
            WHEN 'E+', 'E' THEN 800
            WHEN 'F+', 'F' THEN 650
            WHEN 'G+', 'G' THEN 550
            WHEN 'H+', 'H' THEN 450
            WHEN 'I+', 'I' THEN 350
            ELSE 250
          END
        ELSE 100 -- PARTICIPATION
      END;

      -- Calculate ELO reward
      v_elo_reward := CASE v_participant.position
        WHEN 'CHAMPION' THEN 200
        WHEN 'RUNNER_UP' THEN 150
        WHEN 'THIRD_PLACE' THEN 100
        ELSE 25 -- PARTICIPATION
      END;

      -- Award SPA points
      PERFORM public.credit_spa_points(
        v_participant.player_id, v_spa_reward, 'tournament',
        'Tournament reward: ' || v_participant.position,
        p_tournament_id, 'tournament',
        jsonb_build_object('position', v_participant.position, 'rank', v_rank_code)
      );

      -- Award ELO points (add to current ELO)
      UPDATE public.player_rankings
      SET elo_points = elo_points + v_elo_reward,
          elo = elo_points + v_elo_reward,
          updated_at = NOW()
      WHERE player_id = v_participant.player_id;

      v_results_awarded := v_results_awarded + 1;
      v_total_spa_awarded := v_total_spa_awarded + v_spa_reward;
      v_total_elo_awarded := v_total_elo_awarded + v_elo_reward;

      -- Check for milestones after tournament completion
      PERFORM public.check_and_award_milestones(v_participant.player_id);
    END;
  END LOOP;

  -- Update tournament status
  UPDATE public.tournaments 
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_tournament_id;

  -- Log automation activity
  INSERT INTO public.tournament_automation_log (
    tournament_id, automation_type, status, result, processed_at
  ) VALUES (
    p_tournament_id, 'reward_calculation', 'completed',
    jsonb_build_object(
      'participants_awarded', v_results_awarded,
      'total_spa_awarded', v_total_spa_awarded,
      'total_elo_awarded', v_total_elo_awarded
    ),
    NOW()
  );

  v_result := jsonb_build_object(
    'success', true,
    'tournament_id', p_tournament_id,
    'participants_awarded', v_results_awarded,
    'total_spa_awarded', v_total_spa_awarded,
    'total_elo_awarded', v_total_elo_awarded
  );

  RETURN v_result;
END;
$$;

-- 10. Create comprehensive automation trigger for match results
CREATE OR REPLACE FUNCTION public.trigger_match_automation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger automation when match is completed and verified
  IF NEW.result_status = 'verified' AND OLD.result_status != 'verified' THEN
    
    -- Calculate and update ELO
    PERFORM public.calculate_and_update_match_elo(NEW.id);
    
    -- Award SPA points to winner and loser
    IF NEW.winner_id IS NOT NULL THEN
      PERFORM public.credit_spa_points(
        NEW.winner_id, 150, 'match', 'Match victory',
        NEW.id, 'match', '{"match_type": "casual"}'
      );
    END IF;
    
    IF NEW.loser_id IS NOT NULL THEN
      PERFORM public.credit_spa_points(
        NEW.loser_id, 50, 'match', 'Match participation',
        NEW.id, 'match', '{"match_type": "casual"}'
      );
    END IF;

    -- Check milestones for both players
    IF NEW.winner_id IS NOT NULL THEN
      PERFORM public.check_and_award_milestones(NEW.winner_id);
    END IF;
    
    IF NEW.loser_id IS NOT NULL THEN
      PERFORM public.check_and_award_milestones(NEW.loser_id);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS match_result_automation_trigger ON public.match_results;
CREATE TRIGGER match_result_automation_trigger
  AFTER UPDATE ON public.match_results
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_match_automation();

-- 11. Create automation status view for admin monitoring
CREATE OR REPLACE VIEW public.automation_status AS
SELECT 
  'match_automation' as automation_type,
  COUNT(*) as total_processed,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(processed_at) as last_processed
FROM public.match_automation_log
UNION ALL
SELECT 
  'tournament_automation' as automation_type,
  COUNT(*) as total_processed,
  COUNT(*) FILTER (WHERE status = 'completed') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  MAX(processed_at) as last_processed
FROM public.tournament_automation_log;