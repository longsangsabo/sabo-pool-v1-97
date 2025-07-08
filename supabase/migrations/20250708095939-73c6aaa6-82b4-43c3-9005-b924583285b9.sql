
-- Fix foreign key constraint issue by allowing NULL values for BYE players
-- and adding proper constraints for tournament_matches table

-- Allow NULL values for player1_id and player2_id to support BYE players
ALTER TABLE public.tournament_matches 
ALTER COLUMN player1_id DROP NOT NULL;

ALTER TABLE public.tournament_matches 
ALTER COLUMN player2_id DROP NOT NULL;

-- Add a check constraint to ensure at least one player is not NULL (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tournament_matches_at_least_one_player_check' 
        AND conrelid = 'tournament_matches'::regclass
    ) THEN
        ALTER TABLE public.tournament_matches 
        ADD CONSTRAINT tournament_matches_at_least_one_player_check 
        CHECK (player1_id IS NOT NULL OR player2_id IS NOT NULL);
    END IF;
END $$;

-- Ensure foreign key constraints exist and handle NULL values properly
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
