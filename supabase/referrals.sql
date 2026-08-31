-- Live referral codes + Plus One badge. Paste into SQL Editor → Run. Safe to re-run.

alter table public.profiles
  add column if not exists referral_code text;
alter table public.profiles
  add column if not exists referral_count integer not null default 0;
alter table public.profiles
  add column if not exists referred_by_code text;

create unique index if not exists profiles_referral_code_idx
  on public.profiles (referral_code)
  where referral_code is not null;

notify pgrst, 'reload schema';
