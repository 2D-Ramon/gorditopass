-- GorditoPass legal notices (DRAFT rules, counsel to confirm). Depends on 20261031000000_legal_compliance.
-- Adds: idempotent notice keys, SMS consents, consent key versions, and a retention purge covering them.
-- (No price-change tables: prices are never raised.)
-- All new tables: RLS on, no anon/authenticated access; written only by the service role.

-- ---------- notices_sent ----------
alter table public.notices_sent add column if not exists recipient_email text;
alter table public.notices_sent add column if not exists period_key text;
alter table public.notices_sent add column if not exists last_attempt_at timestamptz;
alter table public.notices_sent drop constraint if exists notices_sent_type_check;
alter table public.notices_sent add constraint notices_sent_type_check check (type in (
  'welcome','renewal_reminder','annual_reminder','price_change',
  'trial_conversion','material_change','cancel_confirm','refund'));
-- Backfill legacy renewal reminders to the new key format "<sub>:<YYYY-MM-DD>".
update public.notices_sent set period_key = coalesce(subscription_id, '') || ':' || renewal_date::text
 where period_key is null and type = 'renewal_reminder' and renewal_date is not null;
-- Idempotency: one notice per (user, type, period).
create unique index if not exists notices_sent_user_type_period
  on public.notices_sent (user_id, type, period_key) where period_key is not null;

-- ---------- consent_events: which disclosure versions were shown ----------
alter table public.consent_events add column if not exists tos_key_version text;
alter table public.consent_events add column if not exists offers_key_version text;

-- ---------- SMS consents: DORMANT ----------
-- Nothing reads or writes this table yet (checkout does not collect phone or SMS consent).
-- Kept for a future SMS program; before use: consent UI + disclosure key, provider/10DLC, STOP/HELP.
create table if not exists public.sms_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- no FK: retention
  phone_e164 text not null check (phone_e164 ~ '^\+[0-9]{10,15}$'),
  consent_key_version text not null,
  consent_text text not null,
  source text not null default 'checkout' check (source in ('checkout','account','support')),
  consent_event_id uuid,
  ip text,
  user_agent text,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_source text
);
create index if not exists sms_consents_user_idx on public.sms_consents (user_id, consented_at desc);

-- ---------- RLS / privileges ----------
alter table public.sms_consents enable row level security;
-- No policies = deny-all for anon/authenticated; service role bypasses RLS.
revoke all on public.sms_consents from anon, authenticated;

-- ---------- retention purge ----------
-- Purge a record only after the LATER of: 3 years from the record, and 1 year after membership ended.
-- Membership end = greatest(last effective cancellation, profile access end/renewal date) for non-members;
-- deleted profiles use the last cancellation. Current members and users with no end are never purged.
create or replace function public.purge_expired_legal_records()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n_consent int; n_notice int; n_cancel int; n_refund int; n_sms int;
begin
  perform set_config('gordito.legal_purge', 'on', true);
  create temp table if not exists _ended on commit drop as
    select c.user_id,
           greatest(max(c.effective_at), max(p.membership_access_ends_at), max(p.membership_renews_at)) as ended_at
      from public.cancellations c
      left join public.profiles p on p.id = c.user_id
     where c.superseded_at is null and coalesce(p.is_member, false) = false
     group by c.user_id
    having greatest(max(c.effective_at), max(p.membership_access_ends_at), max(p.membership_renews_at)) < now() - interval '1 year';

  delete from public.consent_events e using _ended u
   where e.user_id = u.user_id and e.consented_at < now() - interval '3 years';
  get diagnostics n_consent = row_count;
  delete from public.notices_sent e using _ended u
   where e.user_id = u.user_id and e.created_at < now() - interval '3 years';
  get diagnostics n_notice = row_count;
  delete from public.refunds e using _ended u
   where e.user_id = u.user_id and e.created_at < now() - interval '3 years';
  get diagnostics n_refund = row_count;
  delete from public.sms_consents e using _ended u
   where e.user_id = u.user_id and coalesce(e.revoked_at, e.consented_at) < now() - interval '3 years';
  get diagnostics n_sms = row_count;
  delete from public.cancellations e using _ended u
   where e.user_id = u.user_id and e.requested_at < now() - interval '3 years';
  get diagnostics n_cancel = row_count;
  delete from public.stripe_events where received_at < now() - interval '3 years';
  perform set_config('gordito.legal_purge', 'off', true);
  return jsonb_build_object('consent_events', n_consent, 'notices_sent', n_notice, 'cancellations', n_cancel,
    'refunds', n_refund, 'sms_consents', n_sms);
end;
$$;
revoke execute on function public.purge_expired_legal_records() from public, anon, authenticated;
grant execute on function public.purge_expired_legal_records() to service_role;
