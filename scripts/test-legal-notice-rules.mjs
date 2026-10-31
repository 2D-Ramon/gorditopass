// Unit tests for legal notice date windows. Run: node scripts/test-legal-notice-rules.mjs
// Bundles src/lib/legal-notice-rules.ts with esbuild (no network, no DB).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
mkdirSync(join(process.cwd(), "node_modules/.cache"), { recursive: true });
const dir = mkdtempSync(join(process.cwd(), "node_modules/.cache/lnr-"));
const entry = join(dir, "e.ts");
writeFileSync(entry, `export * from "${process.cwd()}/src/lib/legal-notice-rules";`);
const out = join(dir, "b.mjs");
execFileSync("npx", ["esbuild", entry, "--bundle", "--platform=node", "--format=esm", `--outfile=${out}`, "--log-level=error"]);
const R = await import(out);
let fail = 0, n = 0;
const eq = (name, got, want) => { n++; if (JSON.stringify(got) !== JSON.stringify(want)) { fail++; console.log("FAIL", name, "got", got, "want", want); } };
const D = R.DAY_MS, NOW = Date.parse("2026-11-02T14:00:00Z");
const sub = (o) => ({ subscriptionId: "sub_1", status: "active", cancelAtPeriodEnd: false, intervalMonths: 12, periodEndMs: null, ...o });
// Renewal reminder 25-40 window, cron sends 25..30, backup 25..40
for (const [d, cron, bk] of [[41,false,false],[40,false,true],[35,false,true],[30,true,true],[25,true,true],[24.9,false,false]]) {
  eq(`renewal cron ${d}`, R.decideRenewalReminder(sub({ periodEndMs: NOW + d*D }), NOW).due, cron);
  eq(`renewal backup ${d}`, R.decideRenewalReminder(sub({ periodEndMs: NOW + d*D }), NOW, true).due, bk);
}
eq("renewal late flag", R.decideRenewalReminder(sub({ periodEndMs: NOW + 20*D }), NOW).late, true);
eq("6-month gets reminder", R.decideRenewalReminder(sub({ intervalMonths: 6, periodEndMs: NOW + 30*D }), NOW).due, true);
eq("monthly no renewal reminder", R.decideRenewalReminder(sub({ intervalMonths: 1, periodEndMs: NOW + 30*D }), NOW).reason, "short_term");
eq("canceling skipped", R.decideRenewalReminder(sub({ cancelAtPeriodEnd: true, periodEndMs: NOW + 30*D }), NOW).reason, "canceling");
eq("renewal key", R.decideRenewalReminder(sub({ periodEndMs: Date.parse("2026-12-02T14:00:00Z") }), NOW).periodKey, "sub_1:2026-12-02");
// Monthly: one per calendar year, on/after join month-day, not in join year
const anchor = Date.parse("2025-03-15T18:00:00Z");
const mo = sub({ intervalMonths: 1 });
eq("monthly join year", R.decideAnnualReminder(mo, Date.parse("2026-01-10T18:00:00Z"), NOW).reason, "join_year");
eq("monthly after join day", R.decideAnnualReminder(mo, anchor, NOW), { due: true, periodKey: "cal-2026", days: 0 });
eq("monthly before join day", R.decideAnnualReminder(mo, anchor, Date.parse("2026-03-14T18:00:00Z")).reason, "before_join_day");
eq("monthly on join day", R.decideAnnualReminder(mo, anchor, Date.parse("2026-03-15T15:00:00Z")).periodKey, "cal-2026");
eq("annual plan skips yearly", R.decideAnnualReminder(sub({ intervalMonths: 12 }), anchor, NOW).reason, "has_renewal_reminder");
eq("canceling monthly skipped", R.decideAnnualReminder(sub({ intervalMonths: 1, cancelAtPeriodEnd: true }), anchor, NOW).reason, "canceling");
// Dec sweep (Chicago)
eq("sweep not december", R.decideDecemberSweep(sub({}), null, NOW).reason, "not_december");
eq("sweep Nov30 23:30 Chicago is Nov", R.decideDecemberSweep(sub({}), null, Date.parse("2026-12-01T05:30:00Z")).reason, "not_december");
eq("sweep Dec1 Chicago", R.decideDecemberSweep(sub({}), null, Date.parse("2026-12-01T14:00:00Z")).periodKey, "cal-2026");
eq("sweep had one", R.decideDecemberSweep(sub({}), Date.parse("2026-03-01T00:00:00Z"), Date.parse("2026-12-01T14:00:00Z")).reason, "had_one_this_year");
eq("sweep last year's doesn't count", R.decideDecemberSweep(sub({}), Date.parse("2025-12-05T00:00:00Z"), Date.parse("2026-12-01T14:00:00Z")).due, true);
// New monthly members (< 60 days) skipped by sweep + yearly; annual plans not affected
const dec5 = Date.parse("2026-12-05T15:00:00Z");
eq("sweep skips monthly joined 30d ago", R.decideDecemberSweep(sub({ intervalMonths: 1 }), null, dec5, dec5 - 30*D).reason, "joined_recently");
eq("sweep skips monthly joined 59.9d ago", R.decideDecemberSweep(sub({ intervalMonths: 1 }), null, dec5, dec5 - 59.9*D).reason, "joined_recently");
eq("sweep sends monthly joined 60d ago", R.decideDecemberSweep(sub({ intervalMonths: 1 }), null, dec5, dec5 - 60*D).due, true);
eq("sweep sends annual joined 30d ago", R.decideDecemberSweep(sub({ intervalMonths: 12 }), null, dec5, dec5 - 30*D).due, true);
eq("sweep no anchor still sends", R.decideDecemberSweep(sub({ intervalMonths: 1 }), null, dec5).due, true);
eq("yearly skips monthly joined 40d ago (prev year)", R.decideAnnualReminder(mo, Date.parse("2025-12-20T18:00:00Z"), Date.parse("2026-01-29T18:00:00Z")).reason, "joined_recently");
eq("yearly next-year after grace", R.decideAnnualReminder(mo, Date.parse("2025-11-20T18:00:00Z"), Date.parse("2026-11-20T18:00:00Z")).periodKey, "cal-2026");
// Trial conversion
const tr = (len, d) => sub({ status: "trialing", convertsToPaid: true, amountCents: 999, trialStartMs: NOW + d*D - len*D, trialEndMs: NOW + d*D, periodEndMs: NOW + d*D });
eq("trial 31d at 10", R.decideTrialConversion(tr(31, 10), NOW).due, true);
eq("trial 31d at 11", R.decideTrialConversion(tr(31, 11), NOW).due, false);
eq("trial 30d no notice", R.decideTrialConversion(tr(30, 10), NOW).reason, "short_trial");
eq("trial 2.9 days late", R.decideTrialConversion(tr(60, 2.9), NOW).late, true);
console.log(`${n - fail}/${n} passed`);
process.exit(fail ? 1 : 0);
