# GorditoPass (working name) — web MVP

Local food membership platform: diners subscribe for exclusive deals; restaurants join free after approval.

**GitHub:** https://github.com/2D-Ramon/gorditopass

## Quick start

```bash
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

> On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Deploy (public URL — free)

This is a **Next.js** app (not static HTML), so host on **Vercel**:

1. Open [vercel.com/new](https://vercel.com/new)
2. Sign in with **GitHub** (account `2D-Ramon`)
3. Import **`2D-Ramon/gorditopass`**
4. Leave defaults → **Deploy**

You will get a URL like `https://gorditopass.vercel.app`.

## What’s in this demo

| Area | Status |
|------|--------|
| Marketing pages (home, how it works, pricing, about, FAQ, cities, legal) | yes |
| Explore + filters | yes |
| Restaurant profiles, plate reviews, deals | yes |
| Membership ($7 / $36 / $60, family-friends up to 6) | demo local |
| Full cart + checkout | demo |
| Redeem code + staff confirm | demo |
| **Rewards** (+10 pts / redeem, 100 pts = free item claim) | demo |
| City feed (templates, reviews, GIFs, share) | demo |
| Events + jobs pages (partner-created) | demo |
| Restaurant apply + partner dashboard (role-gated) | demo |
| **Admin queue** (apps, deals, live restaurants, feed hide) | demo |
| Supabase auth / DB | later |
| Stripe test mode | later |
| Google Maps tiles | later |

Demo state persists in **browser localStorage** (`gorditopass-mvp-v1`).

## Photo storage (Cloudflare R2)

Menus, feed, chat, avatars, and apply photos are **compressed to WebP** then stored on **Cloudflare R2** (start on the free 10 GB plan — not the $25 website plan).

1. Cloudflare dashboard → **R2 Object Storage** → create bucket `gorditopass-photos`
2. Enable a **public** development URL or attach a custom domain (`https://images.yourdomain.com`)
3. **Manage R2 API tokens** → create a token with Object Read & Write
4. Copy values into `web/.env.local` (see `.env.example`):

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=gorditopass-photos
R2_PUBLIC_BASE_URL=https://pub-xxxxx.r2.dev
```

5. In Supabase SQL Editor run `supabase/photos.sql`
6. Also add the same env vars in **Vercel → Settings → Environment Variables**

Until R2 keys are set, the app still compresses photos and keeps a small local preview so the demo works. Documents on apply (PDF) need R2 to actually store the file.

### Demo roles

| Role | How |
|------|-----|
| Diner | Account → Sign in as diner |
| Restaurant owner | Account → Sign in as restaurant (owner) |
| Restaurant employee | Account → Sign in as restaurant (employee) — redeem scan only |
| Admin | Account → Sign in as admin, or footer **Admin** |

### Try rewards

1. Sign in as diner and activate a membership (checkout flow)
2. Redeem a deal → earn **+10 points**
3. On **Account**, watch progress; at **100 pts** claim a free-item reward

### Try admin queue

1. Sign in as restaurant → create a new deal (goes **pending**)
2. Sign in as admin → **Deals** tab → Approve
3. Applications, restaurant live toggle, and feed moderation are on the same page
