
-- Update SPA tournament rules to match the actual table
DELETE FROM public.spa_points_rules WHERE rule_type = 'tournament';

INSERT INTO public.spa_points_rules (rule_type, rule_key, rule_value) VALUES
-- Tournament rewards by rank and position (matching the actual table)
('tournament', 'champion', '{"rank_e": 1500, "rank_f": 1350, "rank_g": 1200, "rank_h": 1100, "rank_i": 1000, "rank_k": 900}'),
('tournament', 'runner_up', '{"rank_e": 1100, "rank_f": 1000, "rank_g": 900, "rank_h": 850, "rank_i": 800, "rank_k": 700}'),
('tournament', 'top_3', '{"rank_e": 900, "rank_f": 800, "rank_g": 700, "rank_h": 650, "rank_i": 600, "rank_k": 500}'),
('tournament', 'top_4', '{"rank_e": 650, "rank_f": 550, "rank_g": 500, "rank_h": 450, "rank_i": 400, "rank_k": 350}'),
('tournament', 'top_8', '{"rank_e": 320, "rank_f": 280, "rank_g": 250, "rank_h": 200, "rank_i": 150, "rank_k": 120}'),
('tournament', 'participation', '{"rank_e": 120, "rank_f": 110, "rank_g": 100, "rank_h": 100, "rank_i": 100, "rank_k": 100}');
