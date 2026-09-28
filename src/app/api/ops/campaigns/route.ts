import { NextResponse } from "next/server";
import { packCampaign, type CampaignTarget } from "@/lib/ops-audience";
import { jsonError, withOps } from "../_util";

export async function GET() {
  const gate = await withOps("can_campaigns");
  if (!gate.ok) return gate.response;
  const { data, error } = await gate.supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: Request) {
  const gate = await withOps("can_campaigns");
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const text = String(body?.body ?? "").trim();
  const channel = body?.channel === "sms" ? "sms" : "email";
  const target = String(body?.target ?? body?.audience ?? "all_members") as CampaignTarget;
  const allowed: CampaignTarget[] = ["all_members", "city", "restaurant", "zip", "cuisine", "paused"];
  if (!allowed.includes(target)) return jsonError("Choose an audience.");
  const sendOn = String(body?.sendOn ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sendOn)) return jsonError("Choose the date to send.");
  const city = String(body?.city ?? "");
  const restaurantId = String(body?.restaurantId ?? "");
  const zip = String(body?.zip ?? "").trim();
  const cuisine = String(body?.cuisine ?? "");
  if (target === "city" && !city) return jsonError("Choose a city.");
  if (target === "restaurant" && !restaurantId) return jsonError("Choose a restaurant.");
  if (target === "zip" && !/^\d{5}$/.test(zip)) return jsonError("Enter a 5-digit ZIP code.");
  if (target === "cuisine" && !cuisine) return jsonError("Choose a restaurant type.");
  if (!name) return jsonError("Campaign name is required.");
  if (!text) return jsonError("Message body is required.");
  const packed = packCampaign(
    {
      target,
      city,
      restaurantId,
      zip,
      cuisine,
      sendOn,
      subject: String(body?.subject ?? "").trim(),
    },
    channel,
  );
  const row = {
    name,
    channel,
    audience: packed.audience,
    subject: packed.subject,
    body: text,
    status: "draft",
  };
  const { data, error } = await gate.supabase
    .from("campaigns")
    .insert(row)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ campaign: data });
}
