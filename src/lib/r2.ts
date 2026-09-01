import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      process.env.R2_PUBLIC_BASE_URL,
  );
}

let client: S3Client | null = null;

function r2Client(): S3Client {
  if (client) return client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 is not configured.");
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function publicObjectUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/${key}`;
}

export async function putR2Object(opts: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET is not set.");
  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: opts.body,
      ContentType: opts.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicObjectUrl(opts.key);
}
