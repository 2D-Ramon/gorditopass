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
