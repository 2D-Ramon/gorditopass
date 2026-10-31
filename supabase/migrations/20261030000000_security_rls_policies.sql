-- Security hardening: explicit RLS policies for tables flagged "RLS enabled, no policy".
--
-- Context: every one of these tables is read/written ONLY by server code through the
-- service-role client (createOpsClient in src/lib/supabase.ts), which bypasses RLS.
-- The browser (anon/authenticated) client never queries them. So:
--   * member-owned rows  -> owner-only SELECT for `authenticated` (auth.uid() = owner col).
--     Writes stay server-only (no insert/update/delete policies) so points, codes,
--     seats and billing can't be forged from the browser.
--   * admin / ops / partner / CRM tables -> explicit RESTRICTIVE deny-all for anon and
--     authenticated. Same effective access as before (deny), but documented and the
--     advisor is satisfied.
-- No existing access is loosened; service_role is unaffected.
-- Idempotent: drop policy if exists / create policy.

-- ---------- member-owned: owner-only read ----------
drop policy if exists member_favorites_select_own on public.member_favorites;
create policy member_favorites_select_own on public.member_favorites
  for select to authenticated using (member_id = auth.uid());

drop policy if exists household_seats_select_own on public.household_seats;
create policy household_seats_select_own on public.household_seats
  for select to authenticated using (primary_member_id = auth.uid());

drop policy if exists reward_ledger_select_own on public.reward_ledger;
create policy reward_ledger_select_own on public.reward_ledger
  for select to authenticated using (member_id = auth.uid());

drop policy if exists redeem_codes_select_own on public.redeem_codes;
create policy redeem_codes_select_own on public.redeem_codes
  for select to authenticated using (member_id = auth.uid());

drop policy if exists pending_memberships_select_own on public.pending_memberships;
create policy pending_memberships_select_own on public.pending_memberships
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists listing_messages_select_own on public.listing_messages;
create policy listing_messages_select_own on public.listing_messages
  for select to authenticated using (member_id = auth.uid());

-- ---------- ops / admin / partner / CRM: explicit deny (service role only) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'business_accounts',    -- ops CRM
    'business_notes',       -- ops CRM notes
    'campaigns',            -- ops marketing
    'campaign_recipients',  -- ops marketing (emails/phones)
    'members',              -- CRM directory keyed by email, contains ops notes; not auth.uid()-keyed
    'ops_admins',           -- admin accounts incl. password_hash
    'partner_applications', -- restaurant applications (contact PII)
    'partner_digests',      -- cron output
    'listing_staff',        -- staff emails + scan PINs
    'redeem_reports'        -- partner reports about members
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_deny_client', t);
    execute format(
      'create policy %I on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      t || '_deny_client', t);
  end loop;
end $$;
