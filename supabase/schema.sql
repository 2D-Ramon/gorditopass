-- GorditoPass in-house ops: business CRM, members, campaigns
-- Paste this entire file into Supabase → SQL Editor → Run

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Businesses you are recruiting / managing (CRM)
create table if not exists public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'lead'
    check (status in ('lead', 'contacting', 'applied', 'live', 'paused', 'lost')),
  city text,
  neighborhood text,
  cuisine text,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  address text,
  source text,
  next_follow_up date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_accounts (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists business_accounts_status_idx
  on public.business_accounts (status);
create index if not exists business_notes_business_idx
  on public.business_notes (business_id, created_at desc);

drop trigger if exists business_accounts_updated_at on public.business_accounts;
create trigger business_accounts_updated_at
before update on public.business_accounts
for each row execute procedure public.set_updated_at();

-- Members / customers (source of truth)
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  city text default 'dallas',
  plan_id text
    check (plan_id is null or plan_id in ('monthly', 'six_month', 'annual')),
  is_member boolean not null default false,
  status text not null default 'waitlist'
    check (status in ('waitlist', 'active', 'cancelled')),
  email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  birthday date,
  home_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_status_idx on public.members (status);
create index if not exists members_email_opt_idx on public.members (email_opt_in);
create index if not exists members_sms_opt_idx on public.members (sms_opt_in);

drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at
before update on public.members
for each row execute procedure public.set_updated_at();

-- Marketing campaigns (lists live here; delivery pipes connect later)
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('email', 'sms')),
  audience text not null default 'members_opted_in'
    check (audience in (
      'members_opted_in',
      'waitlist',
      'all_members',
      'businesses'
    )),
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'sent', 'failed')),
  subject text,
  body text not null,
  recipient_count integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  member_id uuid references public.members (id) on delete set null,
  business_id uuid references public.business_accounts (id) on delete set null,
  email text,
  phone text,
  name text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'skipped', 'failed')),
  error text
);

create index if not exists campaign_recipients_campaign_idx
  on public.campaign_recipients (campaign_id);

-- Lock tables down: only the server (service role) can read/write
alter table public.business_accounts enable row level security;
alter table public.business_notes enable row level security;
alter table public.members enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;

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

grant all on table public.ops_admins to postgres;
grant all on table public.ops_admins to service_role;

notify pgrst, 'reload schema';
