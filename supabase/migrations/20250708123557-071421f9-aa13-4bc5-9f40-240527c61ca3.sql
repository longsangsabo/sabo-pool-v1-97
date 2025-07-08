
-- Fix database constraint violations and add missing columns

-- 1. Fix tournaments_tier_check constraint violation
-- First check what values are causing issues and update them
UPDATE tournaments 
SET tier = 'open' 
WHERE tier NOT IN ('beginner', 'intermediate', 'advanced', 'pro', 'open');

-- 2. Fix tournament_registrations_registration_status_check constraint violation  
UPDATE tournament_registrations 
SET registration_status = 'confirmed'
WHERE registration_status NOT IN ('pending', 'confirmed', 'cancelled', 'waitlisted');

-- 3. Add missing match_date column to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS match_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing matches to have proper match_date based on created_at
UPDATE matches 
SET match_date = COALESCE(played_at, created_at)
WHERE match_date IS NULL;

-- 4. Ensure proper constraints are in place
-- Re-create the tier constraint if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'tournaments_tier_check'
    ) THEN
        ALTER TABLE tournaments 
        ADD CONSTRAINT tournaments_tier_check 
        CHECK (tier IN ('beginner', 'intermediate', 'advanced', 'pro', 'open'));
    END IF;
END $$;

-- Re-create registration status constraint if needed  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'tournament_registrations_registration_status_check'
    ) THEN
        ALTER TABLE tournament_registrations 
        ADD CONSTRAINT tournament_registrations_registration_status_check 
        CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'waitlisted'));
    END IF;
END $$;

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_tier ON tournaments(tier);
CREATE INDEX IF NOT EXISTS idx_tournament_registrations_status ON tournament_registrations(registration_status);

-- 6. Update any null or invalid data
UPDATE tournaments SET tier = 'open' WHERE tier IS NULL;
UPDATE tournament_registrations SET registration_status = 'pending' WHERE registration_status IS NULL;
