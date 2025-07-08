-- Create missing tables
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC DEFAULT 0,
  points_balance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL UNIQUE,
  elo_points INTEGER DEFAULT 1000,
  elo INTEGER DEFAULT 1000,
  spa_points INTEGER DEFAULT 0,
  total_matches INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_rankings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow demo user operations on wallets" ON public.wallets;
DROP POLICY IF EXISTS "Allow demo user operations on player_rankings" ON public.player_rankings;

-- Create permissive policies for demo users
CREATE POLICY "Allow demo user operations on wallets" 
ON public.wallets FOR ALL 
USING (true);

CREATE POLICY "Allow demo user operations on player_rankings" 
ON public.player_rankings FOR ALL 
USING (true);