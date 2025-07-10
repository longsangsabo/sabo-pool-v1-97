-- 3. Enhanced automatic rank promotion function
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