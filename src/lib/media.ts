/** Photo kinds we compress before storing on Cloudflare R2. */

export const MEDIA_KINDS = [
  "avatar",
  "feed",
  "menu",
  "deal",
  "apply",
  "chat",
  "event",
  "job",
  "gif",
  "video",
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export type MediaPreset = {
  /** Longest edge in pixels. 0 = do not resize (gif/video). */
  maxEdge: number;
  /** WebP/JPEG quality 0–1 */
  quality: number;
  /** Crop to a square (avatars) */
  cover?: boolean;
  /** Soft cap after compress; we retry smaller if over this */
  maxBytes: number;
  /** Reject the original file above this (pre-compress) */
  maxInputBytes: number;
};

export const MEDIA_PRESETS: Record<MediaKind, MediaPreset> = {
  avatar: {
    maxEdge: 400,
    quality: 0.72,
    cover: true,
    maxBytes: 80_000,
    maxInputBytes: 8 * 1024 * 1024,
  },
  feed: {
    maxEdge: 1280,
    quality: 0.72,
    maxBytes: 220_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  menu: {
    maxEdge: 1200,
    quality: 0.74,
    maxBytes: 180_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  deal: {
    maxEdge: 1200,
    quality: 0.74,
    maxBytes: 180_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  apply: {
    maxEdge: 1600,
    quality: 0.72,
    maxBytes: 280_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  chat: {
    maxEdge: 1080,
    quality: 0.7,
    maxBytes: 180_000,
    maxInputBytes: 10 * 1024 * 1024,
  },
  event: {
    maxEdge: 1280,
    quality: 0.74,
    maxBytes: 220_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  job: {
    maxEdge: 1280,
    quality: 0.74,
    maxBytes: 220_000,
    maxInputBytes: 12 * 1024 * 1024,
  },
  gif: {
    maxEdge: 0,
    quality: 1,
    maxBytes: 2 * 1024 * 1024,
    maxInputBytes: 2 * 1024 * 1024,
  },
  video: {
    maxEdge: 0,
    quality: 1,
    maxBytes: 12 * 1024 * 1024,
    maxInputBytes: 12 * 1024 * 1024,
  },
};

export const APPLY_DOC_MAX_BYTES = 8 * 1024 * 1024;

export function isMediaKind(v: string): v is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(v);
}

export function parseImageUrls(row: Record<string, unknown>): string[] {
  const raw = row.image_urls ?? row.imageUrls ?? row.imageDataUrls;
  if (!Array.isArray(raw)) return [];
  return raw.map(String).filter(Boolean);
}

export function sanitizeImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(String)
    .filter(
      (u) =>
        u.startsWith("https://") ||
        u.startsWith("http://") ||
        u.startsWith("data:image/"),
    )
    .slice(0, 8);
}

export function extForContentType(type: string): string {
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("png")) return "png";
  if (type.includes("gif")) return "gif";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("webm")) return "webm";
  if (type.includes("pdf")) return "pdf";
  if (type.includes("msword")) return "doc";
  if (type.includes("officedocument.wordprocessingml")) return "docx";
  return "bin";
}
