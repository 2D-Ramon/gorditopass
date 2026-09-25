import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { TULSA_RESTAURANTS, tulsaPartnerAccounts } from "../src/lib/tulsa-restaurants.ts";

function envFromFile(path) {
  const out = {};
  for (const line of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

const env = envFromFile(new URL("../.env.local", import.meta.url));
const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "");
console.log("host " + new URL(base).host);
const sb = createClient(base, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = TULSA_RESTAURANTS.map((r) => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  city: r.city,
  neighborhood: r.neighborhood,
  cuisine: r.cuisine,
  tagline: r.tagline,
  story: r.story,
  hours: r.hours,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  emoji: r.emoji,
  accent: r.accent,
  approved: true,
  banned: false,
  owner_email: tulsaPartnerAccounts().find((a) => a.restaurantId === r.id)?.email ?? null,
}));

const { error: listErr } = await sb.from("listings").upsert(rows, { onConflict: "id" });
if (listErr) {
  console.log(
    "LISTINGS_FAIL " +
      listErr.message +
      " code=" +
      (listErr.code ?? "") +
      " hostOk=" +
      String(env.NEXT_PUBLIC_SUPABASE_URL || "").startsWith("https://"),
  );
  process.exit(1);
}
console.log("listings " + rows.length);

for (const acct of tulsaPartnerAccounts()) {
  const email = acct.email;
  const { data: existing } = await sb
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  let userId = existing?.id;
  if (!userId) {
    const created = await sb.auth.admin.createUser({
      email,
      password: acct.password,
      email_confirm: true,
      user_metadata: { role: "restaurant", first_name: acct.name },
    });
    if (created.error && !String(created.error.message).toLowerCase().includes("already")) {
      console.log("USER_FAIL " + email + " " + created.error.message);
      continue;
    }
    userId = created.data.user?.id;
    if (!userId) {
      const { data: again } = await sb.from("profiles").select("id").eq("email", email).maybeSingle();
      userId = again?.id;
    }
  }
  if (!userId) {
    console.log("NO_ID " + email);
    continue;
  }
  const { error: profErr } = await sb.from("profiles").upsert(
    {
      id: userId,
      email,
      role: "restaurant",
      first_name: acct.name,
      city: "tulsa",
      restaurant_id: acct.restaurantId,
      staff_role: "owner",
      is_member: false,
    },
    { onConflict: "id" },
  );
  console.log(profErr ? "PROFILE_FAIL " + email + " " + profErr.message : "ok " + email);
}
