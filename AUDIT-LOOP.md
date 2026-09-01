# GorditoPass CS / UX / UI / appearance loop

Paste the prompt below into a new Grok turn. Do not stop until every score is 10, or a score is blocked on a human decision (real domain email, photography, legal, brand lock). Never inflate a 10.

## Current scores (cycle 1, 2026-09-01)

| Area | Score | After this cycle |
|------|------:|------------------|
| Customer service | 4.0 | **6.5** |
| UX | 5.5 | **7.0** |
| UI | 6.0 | **7.0** |
| Appearance | 5.5 | **6.5** |

### Cycle 1 shipped

- Honest contact form (`/api/contact` + mailbox fallback); removed “demo form” copy
- Public demo-role buttons hidden except on localhost
- FAQ accordion + “Still stuck?” → contact; clearer redeem help
- Friendly 404; skip-to-content; focus rings
- Nav: Jobs out of primary; mobile Sign in / Join (no demo sign-in)
- Home CTA: “Membership from $7/mo” (not “as low as $5/mo”)
- Logo mark instead of plate emoji; cart/menu SVGs
- Footer: Help group, no public Admin, no “placeholder brand / MVP demo”

### Still open (next cycle)

- Support inbox is a personal Gmail until a GorditoPass domain mailbox exists
- Contact has no stored ticket history / SLA
- Restaurant cards still use cuisine emoji, not photos
- Home featured marquee duplicates cards (loop technique)
- Cart in header for an in-store redeem product
- Login/membership copy and empty states still uneven
- No photography or final wordmark

---

## Loop prompt (copy everything below)

You are continuing GorditoPass (`C:\Users\2D\Projects\Project-2-Restaurant-App\web`, live https://gorditopass.vercel.app).

Loop until **Customer service, UX, UI, and Appearance** are each **10/10**, or a gap is blocked on a human (domain email, original photography, attorney, final brand).

Each cycle:

1. Audit the **live site** and the code. Exercise diner, restaurant, and help paths: home, explore, restaurant, membership, login, redeem/scan, FAQ, contact, 404, mobile nav, footer.
2. Score CS, UX, UI, Appearance out of 10 with one-sentence evidence. A 10 means a first-time Dallas diner would not hit a demo leftover, a dead end, or a visual that looks like a template.
3. Name the **largest gap in the lowest-scoring area**. Write a short plan (3–7 concrete changes).
4. Apply those changes in the repo. Do not fake success (no “message sent (demo)”). Do not put Admin or demo roles on the public production UI.
5. Verify on local or live: the changed screens, plus mobile width, plus at least one other page that shares the component.
6. Update `AUDIT-LOOP.md` scores and “still open”. Commit and push so Vercel deploys.
7. If any score is under 10 and not blocked, **immediately start the next cycle** in the same turn. Repeat.

Constraints: keep GorditoPass in-house (Admin is the desk). Stay on free R2. Do not use tvaldez@axenrealty.com on git. Prefer real help over more marketing copy.

Start cycle 2 now.
