import { createBrowserClient } from "./supabase";

export async function getAccessToken(): Promise<string | null> {
  const sb = createBrowserClient();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function authedFetch(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
) {
  const token = accessToken || (await getAccessToken());
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
