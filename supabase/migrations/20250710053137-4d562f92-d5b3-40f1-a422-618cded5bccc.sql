
-- Create tournament_matches table for match management
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES public.profiles(user_id),
  player2_id UUID REFERENCES public.profiles(user_id),
  winner_id UUID REFERENCES public.profiles(user_id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  referee_id UUID REFERENCES public.profiles(user_id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT tournament_matches_round_match_unique UNIQUE (tournament_id, round_number, match_number),
  CONSTRAINT tournament_matches_valid_players CHECK (player1_id IS NOT NULL OR player2_id IS NOT NULL),
  CONSTRAINT tournament_matches_valid_winner CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id)
);

-- Create match_results table for detailed scoring
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.tournament_matches(id) ON DELETE CASCADE,
  player1_id UUID NOT NULL REFERENCES public.profiles(user_id),
  player2_id UUID NOT NULL REFERENCES public.profiles(user_id),
  winner_id UUID REFERENCES public.profiles(user_id),
  player1_score INTEGER NOT NULL DEFAULT 0,
  player2_score INTEGER NOT NULL DEFAULT 0,
  player1_elo_before INTEGER,
  player2_elo_before INTEGER,
  player1_elo_after INTEGER,
  player2_elo_after INTEGER,
  player1_elo_change INTEGER,
  player2_elo_change INTEGER,
  player1_confirmed BOOLEAN DEFAULT FALSE,
  player2_confirmed BOOLEAN DEFAULT FALSE,
  result_status TEXT DEFAULT 'pending' CHECK (result_status IN ('pending', 'confirmed', 'verified', 'disputed')),
  verification_method TEXT CHECK (verification_method IN ('self_report', 'manual', 'photo', 'video', 'referee')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(user_id),
  entered_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT match_results_valid_winner CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id),
  CONSTRAINT match_results_valid_scores CHECK (player1_score >= 0 AND player2_score >= 0)
);

-- Create tournament_seeding table for bracket seeding
CREATE TABLE IF NOT EXISTS public.tournament_seeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(user_id),
  seed_position INTEGER NOT NULL,
  elo_rating INTEGER DEFAULT 1000,
  registration_order INTEGER,
  is_bye BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraints
  CONSTRAINT tournament_seeding_unique UNIQUE (tournament_id, seed_position),
  CONSTRAINT tournament_seeding_player_unique UNIQUE (tournament_id, player_id)
);

-- Create tournament_brackets table for bracket management
CREATE TABLE IF NOT EXISTS public.tournament_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE UNIQUE,
  bracket_data JSONB NOT NULL DEFAULT '{}',
  total_rounds INTEGER NOT NULL,
  total_players INTEGER NOT NULL,
  bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination', 'round_robin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_seeding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_brackets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tournament_matches
CREATE POLICY "Everyone can view tournament matches" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournament matches" ON public.tournament_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Players can view their matches" ON public.tournament_matches FOR SELECT USING (
  auth.uid() = player1_id OR auth.uid() = player2_id OR auth.uid() = referee_id
);

-- RLS Policies for match_results  
CREATE POLICY "Everyone can view match results" ON public.match_results FOR SELECT USING (true);
CREATE POLICY "Admins can manage match results" ON public.match_results FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Players can confirm their results" ON public.match_results FOR UPDATE USING (
  auth.uid() = player1_id OR auth.uid() = player2_id
);

-- RLS Policies for tournament_seeding
CREATE POLICY "Everyone can view tournament seeding" ON public.tournament_seeding FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournament seeding" ON public.tournament_seeding FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- RLS Policies for tournament_brackets
CREATE POLICY "Everyone can view tournament brackets" ON public.tournament_brackets FOR SELECT USING (true);
CREATE POLICY "Admins can manage tournament brackets" ON public.tournament_brackets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- Create indexes for performance
CREATE INDEX idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);
CREATE INDEX idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX idx_match_results_match_id ON public.match_results(match_id);
CREATE INDEX idx_tournament_seeding_tournament_id ON public.tournament_seeding(tournament_id);
CREATE INDEX idx_tournament_brackets_tournament_id ON public.tournament_brackets(tournament_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_tournament_matches_updated_at 
  BEFORE UPDATE ON public.tournament_matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_results_updated_at 
  BEFORE UPDATE ON public.match_results 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_brackets_updated_at 
  BEFORE UPDATE ON public.tournament_brackets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
