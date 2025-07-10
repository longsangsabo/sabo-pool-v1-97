-- COMPREHENSIVE DATABASE CLEANUP - Remove all redundant tables and columns

-- Phase 1: Remove redundant columns from tournament_matches
ALTER TABLE public.tournament_matches 
DROP COLUMN IF EXISTS started_at,
DROP COLUMN IF EXISTS completed_at;

-- Phase 2: Drop empty notification partition tables
DROP TABLE IF EXISTS public.notifications_partitioned;
DROP TABLE IF EXISTS public.notifications_y2023m12;
DROP TABLE IF EXISTS public.notifications_y2024m01;
DROP TABLE IF EXISTS public.notifications_y2024m02;
DROP TABLE IF EXISTS public.notifications_y2024m03;

-- Phase 3: Drop test tables (backup data first if needed)
DROP TABLE IF EXISTS public.test_profiles CASCADE;
DROP TABLE IF EXISTS public.test_player_rankings CASCADE;
DROP TABLE IF EXISTS public.test_tournament_registrations CASCADE;

-- Phase 4: Drop empty ranking tables
DROP TABLE IF EXISTS public.ranking_history CASCADE;
DROP TABLE IF EXISTS public.ranking_snapshots CASCADE;
DROP TABLE IF EXISTS public.leaderboards CASCADE;
DROP TABLE IF EXISTS public.leaderboard_snapshots CASCADE;
DROP TABLE IF EXISTS public.season_rankings CASCADE;

-- Phase 5: Drop empty tournament_participants table (redundant with tournament_registrations)
DROP TABLE IF EXISTS public.tournament_participants CASCADE;

-- Log the cleanup operation
INSERT INTO public.system_logs (log_type, message, metadata)
VALUES (
  'database_cleanup',
  'Comprehensive database cleanup completed',
  jsonb_build_object(
    'tables_removed', 13,
    'columns_removed', 2,
    'cleanup_date', now()
  )
);