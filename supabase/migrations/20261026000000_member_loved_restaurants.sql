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

-- RLS on (like member_favorites). The API uses service_role; own-row policies below.
alter table public.member_loved_restaurants enable row level security;
grant all on public.member_loved_restaurants to service_role;

-- Members (Supabase auth) may read/add/remove only their own rows.
-- profiles.id = auth.users.id, so member_id maps directly to auth.uid().
grant select, insert, delete on public.member_loved_restaurants to authenticated;

drop policy if exists loved_select_own on public.member_loved_restaurants;
create policy loved_select_own on public.member_loved_restaurants
  for select to authenticated using (member_id = auth.uid());

drop policy if exists loved_insert_own on public.member_loved_restaurants;
create policy loved_insert_own on public.member_loved_restaurants
  for insert to authenticated with check (member_id = auth.uid());

drop policy if exists loved_delete_own on public.member_loved_restaurants;
create policy loved_delete_own on public.member_loved_restaurants
  for delete to authenticated using (member_id = auth.uid());
