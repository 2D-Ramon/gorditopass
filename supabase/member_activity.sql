-- GorditoPass live member activity (badges, reviews, favorites, feed, seats).
-- Paste into Supabase → SQL Editor → Run. Safe to re-run.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists badges text[] not null default '{}';
alter table public.profiles
  add column if not exists completed_passports text[] not null default '{}';
alter table public.profiles
  add column if not exists passport_points_claimed text[] not null default '{}';

alter table public.redeem_codes
  add column if not exists savings_usd numeric not null default 0;
alter table public.redeem_codes
  add column if not exists revenue_usd numeric not null default 0;
alter table public.redeem_codes
  add column if not exists deal_title text;

alter table public.listing_menu
  add column if not exists status text not null default 'approved';
alter table public.listing_menu
  add column if not exists hidden boolean not null default false;

create table if not exists public.member_favorites (
  member_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id text not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, restaurant_id)
);

create table if not exists public.plate_reviews (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id text not null,
  author text,
  plates integer not null check (plates between 1 and 5),
  body text,
  from_feed boolean not null default false,
  menu_item_id text,
  menu_item_name text,
  deal_id text,
  deal_title text,
  cuisine text,
  created_at timestamptz not null default now()
);

create index if not exists plate_reviews_restaurant_idx
  on public.plate_reviews (restaurant_id, created_at desc);
create index if not exists plate_reviews_member_idx
  on public.plate_reviews (member_id);

create table if not exists public.city_posts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (id) on delete cascade,
  city text not null default 'dallas',
  title text not null,
  body text not null,
  restaurant_id text,
  restaurant_name text,
  plates integer,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists city_posts_city_idx
  on public.city_posts (city, created_at desc);

create table if not exists public.household_seats (
  id uuid primary key default gen_random_uuid(),
  primary_member_id uuid not null references public.profiles (id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  birthday date,
  home_address text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (primary_member_id, email)
);

create table if not exists public.listing_events (
  id text primary key,
  restaurant_id text not null references public.listings (id) on delete cascade,
  restaurant_name text,
  title text not null,
  description text,
  event_date text,
  event_time text,
  city text default 'dallas',
  emoji text default '🎉',
  address text,
  ticket_url text,
  ticket_price_usd numeric,
  status text not null default 'pending',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_jobs (
  id text primary key,
  restaurant_id text not null references public.listings (id) on delete cascade,
  restaurant_name text,
  title text not null,
  description text,
  job_type text default 'part-time',
  city text default 'dallas',
  pay_range text,
  apply_url text,
  status text not null default 'pending',
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.member_favorites enable row level security;
alter table public.plate_reviews enable row level security;
alter table public.city_posts enable row level security;
alter table public.household_seats enable row level security;
alter table public.listing_events enable row level security;
alter table public.listing_jobs enable row level security;

drop policy if exists reviews_public_read on public.plate_reviews;
create policy reviews_public_read on public.plate_reviews
  for select using (true);

drop policy if exists posts_public_read on public.city_posts;
create policy posts_public_read on public.city_posts
  for select using (hidden = false);

drop policy if exists events_public_read on public.listing_events;
create policy events_public_read on public.listing_events
  for select using (hidden = false and status = 'approved');

drop policy if exists jobs_public_read on public.listing_jobs;
create policy jobs_public_read on public.listing_jobs
  for select using (hidden = false and status = 'approved');

drop policy if exists menu_public_read on public.listing_menu;
create policy menu_public_read on public.listing_menu
  for select using (active = true and hidden = false and status = 'approved');

grant all on public.member_favorites to service_role;
grant all on public.plate_reviews to service_role;
grant all on public.city_posts to service_role;
grant all on public.household_seats to service_role;
grant all on public.listing_events to service_role;
grant all on public.listing_jobs to service_role;
grant all on public.listing_menu to service_role;

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
