-- Lock down trigger-only functions. Guarded: skips any function that doesn't exist.
-- handle_new_auth_user is a SECURITY DEFINER trigger on auth.users; nothing calls it via .rpc(),
-- and triggers fire regardless of EXECUTE grants.
do $$
begin
  if to_regprocedure('public.handle_new_auth_user()') is not null then
    revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
    alter function public.handle_new_auth_user() set search_path = public;
  end if;
  -- set_updated_at: trigger-only helper; pin search_path (advisor: role mutable search_path).
  if to_regprocedure('public.set_updated_at()') is not null then
    alter function public.set_updated_at() set search_path = public;
    revoke execute on function public.set_updated_at() from public, anon, authenticated;
  end if;
end $$;
