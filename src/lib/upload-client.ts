"use client";

import { createBrowserClient } from "./supabase";
import {
  APPLY_DOC_MAX_BYTES,
  MEDIA_PRESETS,
  type MediaKind,
} from "./media";

export type UploadedMedia = {
  url: string;
  bytes: number;
  contentType: string;
  stored: "r2" | "inline";
  fileName: string;
};

function authHeaders(token: string | null): Headers {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function sessionToken(): Promise<string | null> {
  const sb = createBrowserClient();
  if (!sb) return null;
  return (await sb.auth.getSession()).data.session?.access_token ?? null;
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
  if (!blob) throw new Error("Could not compress image.");
  return blob;
}

/** Shrink + convert still photos to WebP (JPEG fallback). GIFs/video pass through. */
export async function compressClientFile(
  file: File,
  kind: MediaKind,
): Promise<Blob> {
  const preset = MEDIA_PRESETS[kind];
  if (file.size > preset.maxInputBytes) {
    throw new Error(
      `That file is too large (${Math.round(file.size / 1024 / 1024)} MB). Max is ${Math.round(preset.maxInputBytes / 1024 / 1024)} MB.`,
    );
  }
  if (kind === "gif" || kind === "video" || file.type === "image/gif") {
    return file;
  }
  if (!file.type.startsWith("image/")) {
    if (file.size > APPLY_DOC_MAX_BYTES) {
      throw new Error("Document must be 8 MB or smaller.");
    }
    return file;
  }

  const img = await loadImage(file);
  let edge = preset.maxEdge;
  let quality = preset.quality;
  let best: Blob = file;

  for (let i = 0; i < 5; i++) {
    const canvas = document.createElement("canvas");
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return file;
    if (preset.cover) {
      const side = Math.min(edge, Math.max(w, h));
      canvas.width = side;
      canvas.height = side;
      const scale = Math.max(side / w, side / h);
      const dw = w * scale;
      const dh = h * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(img, (side - dw) / 2, (side - dh) / 2, dw, dh);
    } else {
      const scale = Math.min(1, edge / Math.max(w, h));
      canvas.width = Math.max(1, Math.round(w * scale));
      canvas.height = Math.max(1, Math.round(h * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    let next: Blob;
    try {
      next = await canvasToBlob(canvas, "image/webp", quality);
    } catch {
      next = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (next.size < best.size || i === 0) best = next;
    if (next.size <= preset.maxBytes || quality <= 0.5) break;
    quality = Math.max(0.5, quality - 0.08);
    edge = Math.max(preset.cover ? 256 : 640, Math.round(edge * 0.85));
  }

  return best.size < file.size ? best : file;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(blob);
  });
}

async function postOne(
  blob: Blob,
  file: File,
  kind: MediaKind,
  token: string | null,
): Promise<UploadedMedia> {
  const form = new FormData();
  const name = file.name || "upload";
  form.append("file", blob, name);
  form.append("kind", kind);

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: authHeaders(token),
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    bytes?: number;
    contentType?: string;
    stored?: "r2" | "inline";
    error?: string;
    configured?: boolean;
  };

  if (res.status === 503 || data.configured === false) {
    const url = blob.type.startsWith("image/")
      ? await blobToDataUrl(blob)
      : "";
    if (!url) {
      throw new Error(
        "Photo storage is not connected yet. Add Cloudflare R2 keys to upload documents.",
      );
    }
    return {
      url,
      bytes: blob.size,
      contentType: blob.type,
      stored: "inline",
      fileName: name,
    };
  }

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }
  return {
    url: data.url,
    bytes: data.bytes ?? blob.size,
    contentType: data.contentType ?? blob.type,
    stored: data.stored ?? "r2",
    fileName: name,
  };
}

/** Compress then store on R2. Falls back to a small data URL if R2 is not set. */
export async function uploadFiles(
  files: File[] | FileList,
  kind: MediaKind,
): Promise<UploadedMedia[]> {
  const list = Array.from(files);
  if (!list.length) return [];
  const token = await sessionToken();
  const out: UploadedMedia[] = [];
  for (const file of list) {
    const blob = await compressClientFile(file, kind);
    out.push(await postOne(blob, file, kind, token));
  }
  return out;
}

export async function uploadImageUrls(
  files: File[] | FileList | null,
  kind: MediaKind,
): Promise<string[]> {
  if (!files || (files as FileList).length === 0) return [];
  const uploaded = await uploadFiles(files as FileList, kind);
  return uploaded.map((u) => u.url).filter(Boolean);
}
