-- Partner dashboard: members, hours, sold-out, reports, inbox, review replies.
-- Paste into Supabase SQL Editor → Run. Safe to re-run.

alter table public.listings
  add column if not exists open_status text not null default 'hours';
alter table public.listings
  add column if not exists typical_weekly_tickets integer;
alter table public.listings
  add column if not exists google_maps_url text;

alter table public.listing_deals
  add column if not exists sold_out boolean not null default false;
alter table public.listing_menu
  add column if not exists sold_out boolean not null default false;

create table if not exists public.redeem_reports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.listings (id) on delete cascade,
  redeem_id uuid,
  code text,
  member_name text,
  note text not null,
  reported_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.plate_review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.plate_reviews (id) on delete cascade,
  restaurant_id text not null,
  body text not null,
  author_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.listing_messages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.listings (id) on delete cascade,
  member_id uuid,
  from_role text not null check (from_role in ('diner', 'staff')),
  from_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.partner_digests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references public.listings (id) on delete cascade,
  week_start date not null,
  scans integer not null default 0,
  repeats integer not null default 0,
  new_members integer not null default 0,
  top_deal text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (restaurant_id, week_start)
);

create index if not exists redeem_codes_restaurant_used_idx
  on public.redeem_codes (restaurant_id, status, used_at desc);
create index if not exists listing_messages_rest_idx
  on public.listing_messages (restaurant_id, created_at desc);
create index if not exists redeem_reports_rest_idx
  on public.redeem_reports (restaurant_id, created_at desc);
create unique index if not exists plate_review_replies_review_uidx
  on public.plate_review_replies (review_id);

alter table public.redeem_reports enable row level security;
alter table public.plate_review_replies enable row level security;
alter table public.listing_messages enable row level security;
alter table public.partner_digests enable row level security;

grant all on public.redeem_reports to service_role;
grant all on public.plate_review_replies to service_role;
grant all on public.listing_messages to service_role;
grant all on public.partner_digests to service_role;

drop policy if exists review_replies_public_read on public.plate_review_replies;
create policy review_replies_public_read on public.plate_review_replies
  for select using (true);

notify pgrst, 'reload schema';
