-- Run once in Supabase SQL Editor (safe if already added).
alter table public.profiles
  add column if not exists badges text[] not null default '{}';

notify pgrst, 'reload schema';
