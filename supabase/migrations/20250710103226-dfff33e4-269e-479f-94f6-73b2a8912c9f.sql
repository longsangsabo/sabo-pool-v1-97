-- 6. Create automation triggers and views

-- Create comprehensive automation trigger for match results
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

-- Create automation status view for admin monitoring
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