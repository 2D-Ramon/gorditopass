-- Heart "Favorites" (separate from Will try / member_favorites, which drives rewards).
-- Mirrors public.member_favorites. Safe to re-run.
create table if not exists public.member_loved_restaurants (
  member_id uuid not null references public.profiles (id) on delete cascade,
  restaurant_id text not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, restaurant_id)
);

create index if not exists member_loved_restaurants_member_idx
  on public.member_loved_restaurants (member_id, created_at desc);

-- Same as member_favorites: RLS on, no anon/authenticated policies; API uses service_role.
alter table public.member_loved_restaurants enable row level security;
grant all on public.member_loved_restaurants to service_role;
