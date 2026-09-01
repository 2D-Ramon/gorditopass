import { NextResponse } from "next/server";
import { PLATFORM } from "@/lib/pricing";

const MAX = 4000;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    name?: string;
    email?: string;
    role?: string;
    message?: string;
  } | null;
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const role = String(body?.role ?? "diner").trim();
  const message = String(body?.message ?? "").trim();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
  }
  if (message.length > MAX) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from =
      process.env.RESEND_FROM || `GorditoPass <${PLATFORM.supportEmail}>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: PLATFORM.supportEmail,
        reply_to: email,
        subject: `GorditoPass contact (${role}): ${name}`,
        text: `From: ${name} <${email}>\nI am a: ${role}\n\n${message}`,
      }),
    });
    if (!r.ok) {
      return NextResponse.json({ ok: false, delivered: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true, delivered: true });
  }

  return NextResponse.json({ ok: true, delivered: false });
}
