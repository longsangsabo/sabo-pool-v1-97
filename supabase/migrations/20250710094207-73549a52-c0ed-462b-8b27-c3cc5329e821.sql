-- Create tournament_registrations table
CREATE TABLE public.tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  registration_status TEXT NOT NULL DEFAULT 'pending'::text,
  payment_status TEXT DEFAULT 'unpaid'::text,
  status TEXT DEFAULT 'pending'::text,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  added_by_admin UUID REFERENCES public.profiles(user_id),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, player_id)
);

-- Enable RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view tournament registrations" 
ON public.tournament_registrations 
FOR SELECT 
USING (true);

CREATE POLICY "Users can register for tournaments" 
ON public.tournament_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own registrations" 
ON public.tournament_registrations 
FOR UPDATE 
USING (auth.uid() = player_id);

CREATE POLICY "Admins can manage all registrations" 
ON public.tournament_registrations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND is_admin = true
));

-- Create indexes for performance
CREATE INDEX idx_tournament_registrations_tournament_id ON public.tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_player_id ON public.tournament_registrations(player_id);
CREATE INDEX idx_tournament_registrations_status ON public.tournament_registrations(registration_status);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION public.update_tournament_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_registrations_updated_at
  BEFORE UPDATE ON public.tournament_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_tournament_registrations_updated_at();