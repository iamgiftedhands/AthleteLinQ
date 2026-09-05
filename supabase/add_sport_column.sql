-- AthleteLinQ update: multi-sport support
-- Run ONCE in Supabase -> SQL Editor -> New query
alter table public.athletes add column if not exists sport text;
