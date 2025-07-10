-- Create automation functions for SPA and ELO system

-- 1. Enhanced credit_spa_points function with full automation support
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