-- Profile save fields (birthday, home address, favorites) + expand profiles_column_guard allowlist.
-- birthday/home_address already exist on some envs (base schema); IF NOT EXISTS keeps this idempotent.
-- favorite_* are new. App writes go through service_role (PATCH /api/me); grants + trigger are defense in depth.

alter table public.profiles add column if not exists birthday date;
alter table public.profiles add column if not exists home_address text;
alter table public.profiles add column if not exists favorite_restaurant text;
alter table public.profiles add column if not exists favorite_food_type text;

revoke update on table public.profiles from anon, authenticated;
grant update (
  first_name,
  last_name,
  phone,
  email_opt_in,
  sms_opt_in,
  avatar_url,
  birthday,
  home_address,
  favorite_restaurant,
  favorite_food_type
) on table public.profiles to authenticated;

create or replace function public.profiles_column_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  safe constant text[] := array[
    'first_name',
    'last_name',
    'phone',
    'email_opt_in',
    'sms_opt_in',
    'avatar_url',
    'birthday',
    'home_address',
    'favorite_restaurant',
    'favorite_food_type',
    'updated_at'
  ];
begin
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    raise exception 'profiles: direct insert is not allowed for role %', current_user
      using errcode = '42501';
  end if;
  if (to_jsonb(new) - safe) is distinct from (to_jsonb(old) - safe) then
    raise exception 'profiles: only % may be changed by role %',
      array_to_string(safe[1:cardinality(safe) - 1], ', '),
      current_user
      using errcode = '42501';
  end if;
  return new;
end $$;

revoke execute on function public.profiles_column_guard() from public, anon, authenticated;

drop trigger if exists profiles_column_guard on public.profiles;
create trigger profiles_column_guard
  before insert or update on public.profiles
  for each row execute function public.profiles_column_guard();
