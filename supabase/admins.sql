-- Extra admins + access flags. Paste into Supabase → SQL Editor → Run.
-- Safe on a live project: only adds a new table.

create table if not exists public.ops_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  is_owner boolean not null default false,
  active boolean not null default true,
  can_crm boolean not null default false,
  can_members boolean not null default false,
  can_campaigns boolean not null default false,
  can_applications boolean not null default false,
  can_content boolean not null default false,
  can_restaurants boolean not null default false,
  can_feed boolean not null default false,
  can_manage_admins boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ops_admins_one_owner
  on public.ops_admins (is_owner)
  where is_owner = true;

drop trigger if exists ops_admins_updated_at on public.ops_admins;
create trigger ops_admins_updated_at
before update on public.ops_admins
for each row execute procedure public.set_updated_at();

alter table public.ops_admins enable row level security;
