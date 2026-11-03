-- Rollback for 20261103000000_profiles_column_guard.sql. Restores the prod state captured
-- 2026-11-03 ~02:00 CST: anon + authenticated had table-wide INSERT and UPDATE on public.profiles.
drop trigger if exists profiles_column_guard on public.profiles;
drop function if exists public.profiles_column_guard();
revoke update (first_name, last_name, phone, email_opt_in, sms_opt_in, avatar_url) on table public.profiles from authenticated;
grant insert, update on table public.profiles to anon, authenticated;
