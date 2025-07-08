-- Fix foreign key constraint issue for tournament_registrations
-- The current player_id references auth.users but demo users only exist in profiles table

-- First, check current constraints
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'tournament_registrations'
  AND tc.table_schema = 'public';

-- Drop the old foreign key constraint that references auth.users
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

-- Add new foreign key constraint that references profiles table
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Also ensure we have proper RLS policies for admins
CREATE POLICY IF NOT EXISTS "Admins can manage tournament registrations" 
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