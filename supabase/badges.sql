-- Prefer supabase/member_activity.sql (includes badges plus reviews, favorites, feed, seats).
-- This file is still safe if you only need the badges column.

alter table public.profiles
  add column if not exists badges text[] not null default '{}';

notify pgrst, 'reload schema';
