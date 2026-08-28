import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignAudience, CampaignChannel } from "./ops-types";

export async function loadAudience(
  supabase: SupabaseClient,
  channel: CampaignChannel,
  audience: CampaignAudience,
) {
  if (audience === "businesses") {
    const { data, error } = await supabase
      .from("business_accounts")
      .select("id, name, contact_email, contact_phone");
    if (error) throw new Error(error.message);
    return (data ?? [])
      .filter((b) =>
        channel === "email" ? Boolean(b.contact_email) : Boolean(b.contact_phone),
      )
      .map((b) => ({
        business_id: b.id as string,
        member_id: null as string | null,
        name: b.name as string,
        email: (b.contact_email as string | null) ?? null,
        phone: (b.contact_phone as string | null) ?? null,
      }));
  }

  let query = supabase
    .from("members")
    .select(
      "id, first_name, last_name, email, phone, status, email_opt_in, sms_opt_in, is_member",
    );

  if (audience === "waitlist") query = query.eq("status", "waitlist");
  if (audience === "all_members") query = query.eq("is_member", true);
  if (audience === "members_opted_in") {
    query =
      channel === "email"
        ? query.eq("email_opt_in", true)
        : query.eq("sms_opt_in", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((m) => (channel === "email" ? Boolean(m.email) : Boolean(m.phone)))
    .map((m) => ({
      member_id: m.id as string,
      business_id: null as string | null,
      name:
        [m.first_name, m.last_name].filter(Boolean).join(" ") ||
        (m.email as string),
      email: (m.email as string | null) ?? null,
      phone: (m.phone as string | null) ?? null,
    }));
}
