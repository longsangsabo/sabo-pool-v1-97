-- Fix foreign key constraint for tournament_matches.winner_id
-- Should reference profiles.user_id instead of auth.users.id

-- Drop existing constraint
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_winner_id_fkey;

-- Add correct constraint pointing to profiles
ALTER TABLE tournament_matches 
ADD CONSTRAINT tournament_matches_winner_id_fkey 
FOREIGN KEY (winner_id) 
REFERENCES profiles(user_id) 
ON DELETE SET NULL;