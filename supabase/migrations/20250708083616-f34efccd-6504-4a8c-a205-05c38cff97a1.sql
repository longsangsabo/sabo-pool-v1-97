-- Create comprehensive tournament bracket generation system

-- 1. Create tournament_brackets table if not exists
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  bracket_data JSONB NOT NULL DEFAULT '{}',
  bracket_type TEXT NOT NULL DEFAULT 'single_elimination',
  total_players INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 0,
  current_round INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'ongoing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id)
);

-- 2. Create tournament_seeding table if not exists
CREATE TABLE IF NOT EXISTS public.tournament_seeding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(user_id),
  seed_position INTEGER NOT NULL,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  registration_order INTEGER NOT NULL DEFAULT 1,
  is_bye BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, seed_position),
  UNIQUE(tournament_id, player_id)
);

-- 3. Add missing columns to tournament_matches table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_player1') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN score_player1 INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'score_player2') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN score_player2 INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'bracket_position') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN bracket_position INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'previous_match_1') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN previous_match_1 INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'previous_match_2') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN previous_match_2 INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_matches' AND column_name = 'next_match') THEN
    ALTER TABLE public.tournament_matches ADD COLUMN next_match INTEGER;
  END IF;
END $$;

-- 4. Enable RLS on new tables
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_seeding ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for tournament_brackets
CREATE POLICY "Anyone can view tournament brackets" 
ON public.tournament_brackets FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament brackets" 
ON public.tournament_brackets FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
);

-- 6. Create RLS policies for tournament_seeding
CREATE POLICY "Anyone can view tournament seeding" 
ON public.tournament_seeding FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament seeding" 
ON public.tournament_seeding FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_tournament_id ON public.tournament_seeding(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_seeding_position ON public.tournament_seeding(tournament_id, seed_position);

-- 8. Create can_generate_bracket function
CREATE OR REPLACE FUNCTION public.can_generate_bracket(p_tournament_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tournament RECORD;
  v_participant_count INTEGER;
  v_existing_bracket BOOLEAN;
BEGIN
  -- Get tournament
  SELECT * INTO v_tournament FROM public.tournaments WHERE id = p_tournament_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament not found');
  END IF;
  
  -- Check tournament status
  IF v_tournament.status NOT IN ('registration_closed', 'draft', 'registration_open') THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Tournament must be in registration_closed, draft, or registration_open status');
  END IF;
  
  -- Check participant count
  SELECT COUNT(*) INTO v_participant_count
  FROM public.tournament_registrations
  WHERE tournament_id = p_tournament_id AND registration_status = 'confirmed';
  
  IF v_participant_count < 2 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Minimum 2 participants required');
  END IF;
  
  IF v_participant_count > 64 THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'Maximum 64 participants allowed');
  END IF;
  
  -- Check if bracket already exists
  SELECT EXISTS(SELECT 1 FROM public.tournament_brackets WHERE tournament_id = p_tournament_id) 
  INTO v_existing_bracket;
  
  RETURN jsonb_build_object(
    'valid', true,
    'participant_count', v_participant_count,
    'bracket_exists', v_existing_bracket,
    'tournament_type', v_tournament.tournament_type
  );
END;
$$;