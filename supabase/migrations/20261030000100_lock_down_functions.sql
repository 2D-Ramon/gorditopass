-- handle_new_auth_user is a SECURITY DEFINER *trigger* function (on auth.users insert).
-- Nothing in src calls it via .rpc(); triggers fire regardless of EXECUTE grants.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
alter function public.handle_new_auth_user() set search_path = public;

-- set_updated_at: trigger-only helper; pin search_path (advisor: role mutable search_path).
alter function public.set_updated_at() set search_path = public;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
