-- Fix tournament_brackets table schema issue
-- Check if table exists and add missing columns

-- Create tournament_brackets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'in_progress', 'completed')),
  total_players INTEGER,
  total_rounds INTEGER,
  total_matches INTEGER,
  current_round INTEGER DEFAULT 1,
  bracket_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add status column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_brackets' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_brackets 
    ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'in_progress', 'completed'));
  END IF;

  -- Add bracket_type column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_brackets' 
    AND column_name = 'bracket_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_brackets 
    ADD COLUMN bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin'));
  END IF;

  -- Add total_players column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_brackets' 
    AND column_name = 'total_players'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_brackets 
    ADD COLUMN total_players INTEGER;
  END IF;

  -- Add current_round column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tournament_brackets' 
    AND column_name = 'current_round'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.tournament_brackets 
    ADD COLUMN current_round INTEGER DEFAULT 1;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Anyone can view tournament brackets" ON public.tournament_brackets;
DROP POLICY IF EXISTS "Admins can manage tournament brackets" ON public.tournament_brackets;

CREATE POLICY "Anyone can view tournament brackets" 
ON public.tournament_brackets FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament brackets" 
ON public.tournament_brackets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (is_admin = true OR role = 'admin')
  )
);

-- Create database verification function
CREATE OR REPLACE FUNCTION public.verify_tournament_database()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb := '{}';
  table_count INTEGER;
  column_count INTEGER;
  missing_tables TEXT[] := '{}';
  missing_columns TEXT[] := '{}';
BEGIN
  -- Check required tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('tournaments', 'tournament_registrations', 'tournament_matches', 'tournament_brackets');
  
  result := jsonb_set(result, '{tables_found}', to_jsonb(table_count));
  result := jsonb_set(result, '{tables_expected}', to_jsonb(4));
  
  -- Check tournament_brackets columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'tournament_brackets' 
  AND table_schema = 'public'
  AND column_name IN ('id', 'tournament_id', 'status', 'bracket_type', 'total_players', 'current_round');
  
  result := jsonb_set(result, '{tournament_brackets_columns}', to_jsonb(column_count));
  result := jsonb_set(result, '{tournament_brackets_expected}', to_jsonb(6));
  
  -- Check if bracket generation function exists
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'generate_advanced_tournament_bracket'
    AND routine_schema = 'public'
  ) THEN
    result := jsonb_set(result, '{bracket_function_exists}', 'true');
  ELSE
    result := jsonb_set(result, '{bracket_function_exists}', 'false');
  END IF;
  
  -- Overall status
  IF table_count = 4 AND column_count = 6 THEN
    result := jsonb_set(result, '{status}', '"ready"');
  ELSE
    result := jsonb_set(result, '{status}', '"missing_components"');
  END IF;
  
  result := jsonb_set(result, '{timestamp}', to_jsonb(now()));
  
  RETURN result;
END;
$$;

-- Test the verification function
SELECT public.verify_tournament_database();