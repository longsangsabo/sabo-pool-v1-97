-- First, check for orphaned records in tournament_registrations
SELECT tr.player_id, COUNT(*) as registration_count
FROM public.tournament_registrations tr
LEFT JOIN public.profiles p ON tr.player_id = p.user_id
WHERE p.user_id IS NULL
GROUP BY tr.player_id;

-- Delete orphaned records that reference non-existent profiles
DELETE FROM public.tournament_registrations 
WHERE player_id NOT IN (
  SELECT user_id FROM public.profiles WHERE user_id IS NOT NULL
);

-- Now drop the old foreign key constraint
ALTER TABLE public.tournament_registrations 
DROP CONSTRAINT IF EXISTS tournament_registrations_player_id_fkey;

-- Add new foreign key constraint that references profiles table
ALTER TABLE public.tournament_registrations 
ADD CONSTRAINT tournament_registrations_player_id_fkey 
FOREIGN KEY (player_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;