-- profiles column guard (QA HIGH, 2026-11-03).
-- Problem: policy profiles_self (ALL, auth.uid() = id) + table-wide UPDATE/INSERT grants let a
-- signed-in user (anon key + own JWT) set is_member, plan_id, role, reward_points, banned, stripe_* ...
-- App audit: NO user-session code writes profiles; every write is server-side via service role
-- (createOpsClient). handle_new_auth_user() is SECURITY DEFINER (owner postgres) -> unaffected.
-- Fix: (1) column-level grants: anon/authenticated may UPDATE only self-editable columns;
--      (2) BEFORE INSERT/UPDATE trigger rejects any non-safe column change unless the caller is
--          service_role / postgres / supabase_admin (defense in depth, survives future re-grants).
-- No data is modified.

-- 1) Grants
revoke insert, update on table public.profiles from anon, authenticated;
grant update (first_name, last_name, phone, email_opt_in, sms_opt_in, avatar_url)
  on table public.profiles to authenticated;

-- 2) Trigger guard
create or replace function public.profiles_column_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  safe constant text[] := array['first_name','last_name','phone','email_opt_in','sms_opt_in','avatar_url','updated_at'];
begin
  if current_user in ('service_role','postgres','supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    raise exception 'profiles: direct insert is not allowed for role %', current_user
      using errcode = '42501';
  end if;
  if (to_jsonb(new) - safe) is distinct from (to_jsonb(old) - safe) then
    raise exception 'profiles: only % may be changed by role %', array_to_string(safe[1:6], ', '), current_user
      using errcode = '42501';
  end if;
  return new;
end $$;

revoke execute on function public.profiles_column_guard() from public, anon, authenticated;

drop trigger if exists profiles_column_guard on public.profiles;
create trigger profiles_column_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_column_guard();
