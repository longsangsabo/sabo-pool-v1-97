-- Create complete tournament system database schema
-- This will fix the missing tournaments table error

-- 1. Create tournaments table with complete structure
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  club_id UUID REFERENCES public.club_profiles(id),
  created_by UUID REFERENCES public.profiles(user_id),
  
  -- Tournament settings
  max_participants INTEGER NOT NULL DEFAULT 16,
  current_participants INTEGER NOT NULL DEFAULT 0,
  entry_fee NUMERIC(10,2) DEFAULT 0,
  prize_pool NUMERIC(10,2) DEFAULT 0,
  
  -- Tournament type and format
  game_type TEXT DEFAULT '9-ball',
  tournament_type TEXT DEFAULT 'single_elimination',
  tournament_format TEXT DEFAULT 'single_elimination',
  race_to INTEGER DEFAULT 8,
  
  -- Status management
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled')),
  management_status TEXT DEFAULT 'draft' CHECK (management_status IN ('draft', 'open', 'locked', 'ongoing', 'completed')),
  
  -- Scheduling
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  tournament_start TIMESTAMP WITH TIME ZONE,
  tournament_end TIMESTAMP WITH TIME ZONE,
  
  -- Location
  location TEXT,
  venue_details TEXT,
  
  -- Rules and settings
  rules TEXT,
  special_instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_participants CHECK (current_participants <= max_participants),
  CONSTRAINT valid_dates CHECK (registration_start < registration_end),
  CONSTRAINT valid_tournament_dates CHECK (registration_end <= tournament_start)
);

-- 2. Update tournament_registrations table to ensure proper relationships
-- Drop existing foreign key if it exists and recreate with correct reference
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_tournament_id_fkey;

ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_tournament_id_fkey 
FOREIGN KEY (tournament_id) REFERENCES public.tournaments(id) ON DELETE CASCADE;

-- Add missing columns to tournament_registrations if they don't exist
ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'checked_in', 'no_show', 'disqualified'));

ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS seed_number INTEGER;

ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS bracket_position INTEGER;

ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.tournament_registrations 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;

-- 3. Create tournament_matches table (renamed from matches to be more specific)
CREATE TABLE IF NOT EXISTS public.tournament_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  
  -- Match structure
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  bracket_type TEXT DEFAULT 'main' CHECK (bracket_type IN ('main', 'losers', 'finals')),
  
  -- Players
  player1_id UUID REFERENCES public.profiles(user_id),
  player2_id UUID REFERENCES public.profiles(user_id),
  winner_id UUID REFERENCES public.profiles(user_id),
  referee_id UUID REFERENCES public.profiles(user_id),
  
  -- Scores
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  
  -- Match status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'walkover')),
  
  -- Match flow
  previous_match_1 INTEGER,
  previous_match_2 INTEGER,
  next_match INTEGER,
  
  -- Scheduling
  scheduled_time TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Table assignment
  table_number INTEGER,
  
  -- Admin notes
  admin_notes TEXT,
  referee_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(tournament_id, round_number, match_number),
  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT valid_winner CHECK (winner_id IN (player1_id, player2_id) OR winner_id IS NULL)
);

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON public.tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON public.tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournaments_club_id ON public.tournaments(club_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON public.tournaments(tournament_start, tournament_end);

CREATE INDEX IF NOT EXISTS idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_player_id ON public.tournament_registrations(player_id);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON public.tournament_registrations(registration_status);

CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament_id ON public.tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_round ON public.tournament_matches(round_number);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON public.tournament_matches(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_players ON public.tournament_matches(player1_id, player2_id);

-- 5. Enable RLS on all tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies

-- Tournaments policies
CREATE POLICY "Anyone can view tournaments" 
ON public.tournaments FOR SELECT 
USING (true);

CREATE POLICY "Admins and club owners can create tournaments" 
ON public.tournaments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role IN ('admin', 'club_owner') OR is_admin = true)
  )
);

CREATE POLICY "Admins and creators can update tournaments" 
ON public.tournaments FOR UPDATE 
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
);

-- Tournament matches policies
CREATE POLICY "Anyone can view tournament matches" 
ON public.tournament_matches FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage tournament matches" 
ON public.tournament_matches FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
);

-- 7. Create trigger for updating tournament timestamps
CREATE OR REPLACE FUNCTION public.update_tournament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON public.tournaments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_updated_at();

CREATE TRIGGER update_tournament_matches_updated_at
  BEFORE UPDATE ON public.tournament_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_updated_at();