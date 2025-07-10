-- Fix tournament completion automation - remove faulty trigger and function
DROP TRIGGER IF EXISTS trigger_process_tournament_results ON public.tournaments CASCADE;
DROP TRIGGER IF EXISTS on_tournament_completed ON public.tournaments CASCADE;
DROP FUNCTION IF EXISTS public.process_tournament_results() CASCADE;

-- The tournament completion should be handled manually by admins through the UI
-- or through the existing process_tournament_completion function that works correctly