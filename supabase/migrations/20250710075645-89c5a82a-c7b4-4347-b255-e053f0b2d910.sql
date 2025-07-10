-- Create trigger for tournament completion processing
DROP TRIGGER IF EXISTS trigger_process_tournament_results ON public.tournaments;

CREATE TRIGGER trigger_process_tournament_results
  AFTER UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.process_tournament_results();