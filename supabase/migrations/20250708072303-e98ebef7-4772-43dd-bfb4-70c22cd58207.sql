-- Fix the get_available_demo_users function with correct column names
CREATE OR REPLACE FUNCTION public.get_available_demo_users(needed_count integer)
RETURNS TABLE(user_id uuid, full_name text, display_name text, skill_level text, elo integer, spa_points integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, 
    p.full_name, 
    p.display_name, 
    p.skill_level, 
    COALESCE(pr.elo_points, 1000),
    COALESCE(pr.spa_points, 50)
  FROM public.profiles p
  LEFT JOIN public.demo_user_pool dup ON dup.user_id = p.id
  LEFT JOIN public.player_rankings pr ON pr.player_id = p.id
  WHERE p.is_demo_user = true
  AND (dup.is_available = true OR dup.is_available IS NULL)
  ORDER BY COALESCE(pr.elo_points, 1000) DESC
  LIMIT needed_count;
END;
$$;