-- Fix tournament completion automation
-- Disable the faulty trigger that references non-existent final_position column
DROP TRIGGER IF EXISTS trigger_process_tournament_results ON public.tournaments;

-- Remove the faulty function 
DROP FUNCTION IF EXISTS public.process_tournament_results();

-- The tournament completion should be handled manually by admins through the UI
-- or through the existing process_tournament_completion function that works correctly