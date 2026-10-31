-- Auto-renewal compliance (spec 00-UI-FSE-SPEC.md §3): consent log, notices, cancellations,
-- refunds, Stripe event ids. RLS: owner may SELECT own rows; all writes server-only via the
-- service role. consent_events is append-only (trigger), purged only by
-- public.purge_expired_legal_records() (service role) after the retention window.
-- Idempotent.

create extension if not exists pgcrypto;

-- ---------- consent_events ----------
create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- no FK: records must outlive account deletion (retention)
  email text not null,
  consented_at timestamptz not null default now(),          -- server time (UTC)
  ip text,
  user_agent text,
  page_url text,
  disclosure_key_version text not null,
  disclosure_text_sha256 text not null,
  checkbox_label_text text not null,
  checkbox_checked boolean not null default true check (checkbox_checked = true),
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  interval text not null default 'year',
  renewal_date_shown date,
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  screenshot_ref text,
  locale text,
  state_of_residence text,
  kind text not null default 'signup' check (kind in ('signup', 'resume'))
);
create index if not exists consent_events_user_idx on public.consent_events (user_id, consented_at desc);
create index if not exists consent_events_sub_idx on public.consent_events (stripe_subscription_id);

-- Append-only: no UPDATE except filling the Stripe ids once (webhook link);
-- no DELETE except inside the retention purge.
create or replace function public.consent_events_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('gordito.legal_purge', true) = 'on' then
      return old;
    end if;
    raise exception 'consent_events is append-only';
  end if;
  if (to_jsonb(new) - 'stripe_checkout_session_id' - 'stripe_customer_id' - 'stripe_subscription_id')
     is distinct from
     (to_jsonb(old) - 'stripe_checkout_session_id' - 'stripe_customer_id' - 'stripe_subscription_id')
     or (old.stripe_checkout_session_id is not null and new.stripe_checkout_session_id is distinct from old.stripe_checkout_session_id)
     or (old.stripe_customer_id is not null and new.stripe_customer_id is distinct from old.stripe_customer_id)
     or (old.stripe_subscription_id is not null and new.stripe_subscription_id is distinct from old.stripe_subscription_id) then
    raise exception 'consent_events is append-only (only empty Stripe ids may be filled)';
  end if;
  return new;
end;
$$;
revoke execute on function public.consent_events_guard() from public, anon, authenticated;
drop trigger if exists consent_events_append_only on public.consent_events;
create trigger consent_events_append_only
before update or delete on public.consent_events
for each row execute procedure public.consent_events_guard();

-- ---------- notices_sent ----------
create table if not exists public.notices_sent (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- no FK: records must outlive account deletion (retention)
  subscription_id text,
  type text not null check (type in ('welcome','renewal_reminder','price_change','material_change','cancel_confirm','refund')),
  template_version text not null,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  renewal_date date,
  amount_cents integer,
  error text,
  created_at timestamptz not null default now()
);
-- One renewal reminder per subscription per renewal period.
create unique index if not exists notices_sent_one_reminder_per_period
  on public.notices_sent (user_id, coalesce(subscription_id, ''), renewal_date)
  where type = 'renewal_reminder';
create index if not exists notices_sent_user_idx on public.notices_sent (user_id, created_at desc);

-- ---------- cancellations ----------
create table if not exists public.cancellations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- no FK: records must outlive account deletion (retention)
  subscription_id text not null,
  requested_at timestamptz not null default now(),
  channel text not null default 'web' check (channel in ('web','email','support')),
  retention_offer_shown boolean not null default false,
  retention_offer_accepted boolean not null default false,
  processed_at timestamptz,
  effective_at timestamptz,
  stripe_response_id text,
  confirmation_number text not null unique,
  superseded_at timestamptz   -- set when the member resumes; a later cancel creates a new row
);
-- Idempotency key = user_id + subscription_id (one open cancellation at a time).
create unique index if not exists cancellations_open_per_sub
  on public.cancellations (user_id, subscription_id) where superseded_at is null;

-- ---------- refunds ----------
create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- no FK: records must outlive account deletion (retention)
  stripe_refund_id text unique,
  reason text not null check (reason in ('window','renewal','partner_closure','error','dispute')),
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

-- ---------- stripe_events (webhook idempotency, spec §7) ----------
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

-- ---------- profile cancel state ----------
alter table public.profiles add column if not exists membership_cancel_at_period_end boolean not null default false;
alter table public.profiles add column if not exists membership_canceled_at timestamptz;
alter table public.profiles add column if not exists membership_access_ends_at timestamptz;

-- ---------- RLS ----------
alter table public.consent_events enable row level security;
alter table public.notices_sent enable row level security;
alter table public.cancellations enable row level security;
alter table public.refunds enable row level security;
alter table public.stripe_events enable row level security;

drop policy if exists consent_events_select_own on public.consent_events;
create policy consent_events_select_own on public.consent_events
  for select to authenticated using (user_id = auth.uid());
drop policy if exists notices_sent_select_own on public.notices_sent;
create policy notices_sent_select_own on public.notices_sent
  for select to authenticated using (user_id = auth.uid());
drop policy if exists cancellations_select_own on public.cancellations;
create policy cancellations_select_own on public.cancellations
  for select to authenticated using (user_id = auth.uid());
drop policy if exists refunds_select_own on public.refunds;
create policy refunds_select_own on public.refunds
  for select to authenticated using (user_id = auth.uid());
drop policy if exists stripe_events_deny_client on public.stripe_events;
create policy stripe_events_deny_client on public.stripe_events
  as restrictive for all to anon, authenticated using (false) with check (false);

-- Belt and braces: app roles get no write privileges on legal tables.
revoke insert, update, delete, truncate on public.consent_events, public.notices_sent,
  public.cancellations, public.refunds, public.stripe_events from anon, authenticated;

-- ---------- retention purge ----------
-- Keep >= 3 years from the record, or 1 year after termination, whichever is longer.
-- "Termination" = latest cancellation effective_at for that user; a user who is still a
-- member (or has no effective cancellation) is never purged.
create or replace function public.purge_expired_legal_records()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_consent int; n_notice int; n_cancel int; n_refund int;
begin
  perform set_config('gordito.legal_purge', 'on', true);
  create temp table if not exists _purgeable on commit drop as
    select c.user_id, max(c.effective_at) as terminated_at
      from public.cancellations c
      left join public.profiles p on p.id = c.user_id
     where c.superseded_at is null and coalesce(p.is_member, false) = false
     group by c.user_id
    having max(c.effective_at) < now() - interval '1 year';

  delete from public.consent_events e using _purgeable u
   where e.user_id = u.user_id and e.consented_at < now() - interval '3 years';
  get diagnostics n_consent = row_count;
  delete from public.notices_sent e using _purgeable u
   where e.user_id = u.user_id and e.created_at < now() - interval '3 years';
  get diagnostics n_notice = row_count;
  delete from public.refunds e using _purgeable u
   where e.user_id = u.user_id and e.created_at < now() - interval '3 years';
  get diagnostics n_refund = row_count;
  delete from public.cancellations e using _purgeable u
   where e.user_id = u.user_id and e.requested_at < now() - interval '3 years';
  get diagnostics n_cancel = row_count;
  delete from public.stripe_events where received_at < now() - interval '3 years';
  perform set_config('gordito.legal_purge', 'off', true);
  return jsonb_build_object('consent_events', n_consent, 'notices_sent', n_notice,
    'cancellations', n_cancel, 'refunds', n_refund);
end;
$$;
revoke execute on function public.purge_expired_legal_records() from public, anon, authenticated;
grant execute on function public.purge_expired_legal_records() to service_role;
