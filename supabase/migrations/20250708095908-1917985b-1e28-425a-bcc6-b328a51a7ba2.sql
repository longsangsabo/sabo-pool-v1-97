-- Fix foreign key constraint issue by allowing NULL values for BYE players
-- and adding proper constraints for tournament_matches table

-- First, check current constraints
SELECT conname, conrelid::regclass, confrelid::regclass, conkey, confkey, contype
FROM pg_constraint 
WHERE conrelid = 'tournament_matches'::regclass
AND contype = 'f';

-- Allow NULL values for player1_id and player2_id to support BYE players
ALTER TABLE public.tournament_matches 
ALTER COLUMN player1_id DROP NOT NULL;

ALTER TABLE public.tournament_matches 
ALTER COLUMN player2_id DROP NOT NULL;

-- Add a check constraint to ensure at least one player is not NULL
-- (to prevent completely empty matches)
ALTER TABLE public.tournament_matches 
ADD CONSTRAINT tournament_matches_at_least_one_player_check 
CHECK (player1_id IS NOT NULL OR player2_id IS NOT NULL);

-- Update any existing foreign key constraints to handle NULL values properly
-- The foreign key constraints should already handle NULL properly by default,
-- but let's make sure they exist and are correct

-- Check if foreign key constraints exist, if not create them
DO $$
BEGIN
    -- Add foreign key for player1_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tournament_matches_player1_id_fkey' 
        AND conrelid = 'tournament_matches'::regclass
    ) THEN
        ALTER TABLE public.tournament_matches 
        ADD CONSTRAINT tournament_matches_player1_id_fkey 
        FOREIGN KEY (player1_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key for player2_id if not exists  
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tournament_matches_player2_id_fkey' 
        AND conrelid = 'tournament_matches'::regclass
    ) THEN
        ALTER TABLE public.tournament_matches 
        ADD CONSTRAINT tournament_matches_player2_id_fkey 
        FOREIGN KEY (player2_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;
    END IF;
END $$;