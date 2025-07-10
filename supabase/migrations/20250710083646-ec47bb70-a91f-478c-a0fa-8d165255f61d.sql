-- Add metadata column to tournaments table for storing custom configuration
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for the new column
COMMENT ON COLUMN public.tournaments.metadata IS 'Custom configuration and additional data for tournaments';