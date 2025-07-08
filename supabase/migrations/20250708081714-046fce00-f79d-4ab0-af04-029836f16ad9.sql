-- Fix foreign key constraint issue for tournament_registrations
-- The current player_id references auth.users but demo users only exist in profiles table

-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

-- Add new foreign key constraint that references profiles table
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins can manage tournament registrations" ON public.tournament_registrations;

-- Create new RLS policy for admins (PostgreSQL doesn't support IF NOT EXISTS for policies)
CREATE POLICY "Admins can manage tournament registrations" 
ON public.tournament_registrations FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND (role = 'admin' OR is_admin = true)
  )
);