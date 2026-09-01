import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { compressBuffer } from "@/lib/image-compress";
import {
  APPLY_DOC_MAX_BYTES,
  extForContentType,
  isMediaKind,
  MEDIA_PRESETS,
  type MediaKind,
} from "@/lib/media";
import { userFromRequest } from "@/lib/market";
import { isR2Configured, putR2Object } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_FILES = 8;

function kindFromForm(raw: string | null): MediaKind {
  const v = String(raw ?? "feed").trim();
  return isMediaKind(v) ? v : "feed";
}

export async function GET() {
  return NextResponse.json({ configured: isR2Configured() });
}

export async function POST(req: Request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      {
        configured: false,
        error: "Photo storage is not connected (Cloudflare R2).",
      },
      { status: 503 },
    );
  }

  const kind = kindFromForm(new URL(req.url).searchParams.get("kind"));
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const formKind = kindFromForm(
    typeof form.get("kind") === "string" ? String(form.get("kind")) : kind,
  );
  const files = form
    .getAll("file")
    .filter((v): v is File => typeof v !== "string" && typeof (v as File).arrayBuffer === "function");

  if (!files.length) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Max ${MAX_FILES} files per request.` }, { status: 400 });
  }

  const needsAuth = formKind !== "apply";
  if (needsAuth) {
    const profile = await userFromRequest(req);
    if (!profile) {
      // Demo diner (localStorage) still needs to post photos. Allow when
      // there is no bearer token; reject only if a token was sent and failed.
      const header = req.headers.get("authorization") || "";
      if (header.toLowerCase().startsWith("bearer ")) {
        return NextResponse.json({ error: "Sign in required." }, { status: 401 });
      }
    }
  }

  const uploaded = [];
  for (const file of files) {
    const mime = file.type || "application/octet-stream";
    const preset = MEDIA_PRESETS[formKind];
    const isDoc = !mime.startsWith("image/") && !mime.startsWith("video/");
    const cap = isDoc ? APPLY_DOC_MAX_BYTES : preset.maxInputBytes;
    if (file.size > cap) {
      return NextResponse.json(
        { error: `File ${file.name} is too large.` },
        { status: 413 },
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    const { buffer, contentType } = isDoc
      ? { buffer: input, contentType: mime }
      : await compressBuffer(input, formKind, mime);

    const ext = extForContentType(contentType);
    const now = new Date();
    const key = `${formKind}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomUUID()}.${ext}`;
    const url = await putR2Object({ key, body: buffer, contentType });
    uploaded.push({
      url,
      key,
      bytes: buffer.length,
      contentType,
      stored: "r2" as const,
      fileName: file.name,
    });
  }

  const first = uploaded[0];
  return NextResponse.json({
    configured: true,
    ...first,
    files: uploaded,
  });
}
