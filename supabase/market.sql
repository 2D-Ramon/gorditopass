-- GorditoPass market-ready tables. Paste into SQL Editor → Run.
-- Safe to re-run (IF NOT EXISTS). Then: notify pgrst, 'reload schema';

create extension if not exists pgcrypto;

-- Live restaurant listings (partner dashboard binds to these)
create table if not exists public.listings (
  id text primary key,
  name text not null,
  slug text,
  city text not null default 'dallas',
  neighborhood text,
  cuisine text,
  tagline text,
  story text,
  hours text,
  address text,
  lat double precision,
  lng double precision,
  emoji text,
  accent text,
  approved boolean not null default false,
  banned boolean not null default false,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'diner'
    check (role in ('diner', 'restaurant', 'admin')),
  first_name text,
  last_name text,
  phone text,
  city text default 'dallas',
  birthday date,
  home_address text,
  restaurant_id text references public.listings (id) on delete set null,
  staff_role text check (staff_role in ('owner', 'manager', 'marketing', 'employee')),
  is_member boolean not null default false,
  plan_id text,
  family_seats integer not null default 1,
  membership_activated_at timestamptz,
  membership_renews_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  reward_points integer not null default 0,
  reward_points_lifetime integer not null default 0,
  rewards_claimed integer not null default 0,
  banned boolean not null default false,
  badges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_deals (
  id text primary key,
  restaurant_id text not null references public.listings (id) on delete cascade,
  title text not null,
  description text,
  type text not null default 'free_item',
  value numeric,
  regular_price_usd numeric,
  member_only boolean not null default true,
  excludes_alcohol boolean not null default true,
  active boolean not null default true,
  hidden boolean not null default false,
  status text not null default 'approved',
  created_at timestamptz not null default now()
);

create table if not exists public.listing_menu (
  id text primary key,
  restaurant_id text not null references public.listings (id) on delete cascade,
  name text not null,
  description text,
  price_usd numeric not null default 0,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.listings (id) on delete cascade,
  email text not null,
  name text not null,
  staff_role text not null default 'employee',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, email)
);

create table if not exists public.partner_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  contact_name text,
  position text,
  address text,
  city text,
  promo text,
  payload jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  listing_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.pending_memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete cascade,
  plan_id text not null,
  seats integer not null default 1,
  members jsonb not null default '[]',
  email_opt_in boolean not null default false,
  sms_opt_in boolean not null default false,
  referral_code text,
  stripe_session_id text unique,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  deal_id text not null,
  restaurant_id text not null,
  member_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'used', 'expired')),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  points integer not null,
  note text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at before update on public.listings
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, role, first_name, last_name, phone)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'role', 'diner'),
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.listings enable row level security;
alter table public.profiles enable row level security;
alter table public.listing_deals enable row level security;
alter table public.listing_menu enable row level security;
alter table public.listing_staff enable row level security;
alter table public.partner_applications enable row level security;
alter table public.pending_memberships enable row level security;
alter table public.redeem_codes enable row level security;
alter table public.reward_ledger enable row level security;

drop policy if exists listings_public_read on public.listings;
create policy listings_public_read on public.listings
  for select using (approved = true and banned = false);

drop policy if exists deals_public_read on public.listing_deals;
create policy deals_public_read on public.listing_deals
  for select using (
    hidden = false and active = true and status = 'approved'
    and exists (
      select 1 from public.listings l
      where l.id = restaurant_id and l.approved = true and l.banned = false
    )
  );

drop policy if exists menu_public_read on public.listing_menu;
create policy menu_public_read on public.listing_menu
  for select using (active = true);

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

grant all on public.listings to service_role;
grant all on public.profiles to service_role;
grant all on public.listing_deals to service_role;
grant all on public.listing_menu to service_role;
grant all on public.listing_staff to service_role;
grant all on public.partner_applications to service_role;
grant all on public.pending_memberships to service_role;
grant all on public.redeem_codes to service_role;
grant all on public.reward_ledger to service_role;
grant all on public.members to service_role;

-- Seed Dallas demo listings if empty
insert into public.listings (id, name, slug, city, neighborhood, cuisine, tagline, story, hours, address, lat, lng, emoji, accent, approved)
values
  ('mi-tierra', 'Mi Tierra Cocina', 'mi-tierra-cocina', 'dallas', 'Oak Cliff', 'mexican', 'Home-style Mexican, made with heart', 'Family recipes, fresh salsas, and plates that taste like Sunday at abuela’s.', 'Tue–Sun 11am–9pm', 'Oak Cliff, Dallas, TX', 32.735, -96.82, '🌮', '#e85d04', true),
  ('andolinis', 'Andolini''s Pizza', 'andolinis-pizza', 'dallas', 'Deep Ellum', 'pizza', 'Serious slices, serious vibe', 'Neighborhood pizza with member-only BOGO slices.', 'Daily 11am–11pm', 'Deep Ellum, Dallas, TX', 32.784, -96.775, '🍕', '#dc2626', true),
  ('alpha-grill', 'Alpha Grill', 'alpha-grill', 'dallas', 'South Dallas', 'bbq', 'Smoke, sauce, and second helpings', 'Texas BBQ plates with member sandwich deals.', 'Wed–Sun 12–8pm', 'South Dallas, TX', 32.735, -96.76, '🍖', '#b45309', true)
on conflict (id) do nothing;

insert into public.listing_deals (id, restaurant_id, title, description, type, value, active, status)
values
  ('mt-free-fries', 'mi-tierra', 'Free side of fries', 'With any entrée for members. In-store redeem.', 'free_item', null, true, 'approved'),
  ('and-bogo', 'andolinis', 'BOGO slice', 'Buy one slice, get one free', 'bogo', null, true, 'approved'),
  ('ag-50', 'alpha-grill', '50% off sandwich', 'Any BBQ sandwich', 'percent_off', 50, true, 'approved')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
