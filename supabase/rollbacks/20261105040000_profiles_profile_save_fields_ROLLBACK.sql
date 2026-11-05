-- Rollback for 20261105040000_profiles_profile_save_fields.sql.
-- Restores the prior guard allowlist/grants. Drops only favorite_* columns added by this migration.
-- Does NOT drop birthday/home_address (they pre-existed on base schema / earlier envs).

drop trigger if exists profiles_column_guard on public.profiles;

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

create trigger profiles_column_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_column_guard();

revoke update on table public.profiles from anon, authenticated;
grant update (first_name, last_name, phone, email_opt_in, sms_opt_in, avatar_url)
  on table public.profiles to authenticated;

alter table public.profiles drop column if exists favorite_restaurant;
alter table public.profiles drop column if exists favorite_food_type;
