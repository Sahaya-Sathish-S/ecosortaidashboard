
-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard WITH (security_invoker = true) AS
SELECT 
  gc.user_id,
  p.full_name,
  SUM(gc.credits) as total_credits,
  COUNT(gc.id) as total_disposals,
  RANK() OVER (ORDER BY SUM(gc.credits) DESC) as rank
FROM public.green_credits gc
LEFT JOIN public.profiles p ON p.user_id = gc.user_id
GROUP BY gc.user_id, p.full_name;
