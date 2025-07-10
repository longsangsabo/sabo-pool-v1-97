-- 4. Create comprehensive milestone checking function
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