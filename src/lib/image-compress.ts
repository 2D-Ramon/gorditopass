import sharp from "sharp";
import { MEDIA_PRESETS, type MediaKind } from "./media";

const PASSTHROUGH = new Set(["gif", "video"]);

export async function compressBuffer(
  input: Buffer,
  kind: MediaKind,
  mime: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (PASSTHROUGH.has(kind) || mime === "image/gif" || mime.startsWith("video/")) {
    return { buffer: input, contentType: mime || "application/octet-stream" };
  }
  if (!mime.startsWith("image/")) {
    return { buffer: input, contentType: mime || "application/octet-stream" };
  }

  const preset = MEDIA_PRESETS[kind];
  let edge = preset.maxEdge;
  let quality = Math.round(preset.quality * 100);
  let last = input;
  let lastType = mime;

  for (let i = 0; i < 5; i++) {
    let pipeline = sharp(input, { failOn: "none" }).rotate();
    if (preset.cover) {
      pipeline = pipeline.resize(edge, edge, {
        fit: "cover",
        position: "centre",
        withoutEnlargement: true,
      });
    } else {
      pipeline = pipeline.resize(edge, edge, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    const webp = await pipeline.webp({ quality, effort: 4 }).toBuffer();
    last = webp;
    lastType = "image/webp";
    if (webp.length <= preset.maxBytes || quality <= 50) break;
    quality = Math.max(50, quality - 8);
    edge = Math.max(preset.cover ? 256 : 640, Math.round(edge * 0.85));
  }

  if (last.length >= input.length && mime.startsWith("image/") && mime !== "image/gif") {
    return { buffer: last, contentType: lastType };
  }
  return { buffer: last, contentType: lastType };
}
