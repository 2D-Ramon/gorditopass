// Legacy path kept as an alias; the scheduled cron is /api/cron/legal-notices (vercel.json).
export { GET } from "../legal-notices/route";
export const dynamic = "force-dynamic";
export const maxDuration = 300;
