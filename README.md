# GorditoPass (working name) — web MVP

Local food membership platform: diners subscribe for exclusive deals; restaurants join free after approval.

## Quick start

```bash
cd web
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000).

> On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## What’s in this demo

| Area | Status |
|------|--------|
| Marketing pages (home, how it works, pricing, about, FAQ, cities, legal) | ✅ |
| Explore + filters + map pins (demo) | ✅ |
| Restaurant profiles, plate reviews, deals | ✅ |
| Membership ($7 / $36 / $60, family up to 6) | ✅ demo local |
| Full cart + checkout | ✅ demo |
| Dynamic redeem code + staff confirm | ✅ demo |
| City feed (posts + replies) | ✅ demo |
| Restaurant apply + partner dashboard | ✅ demo |
| Admin shell | ✅ demo |
| Supabase auth / DB | 🔜 env ready |
| Stripe test mode | 🔜 env ready |
| Google Maps tiles | 🔜 env ready |
| Real delivery | later |

Demo state persists in **browser localStorage** (`gorditopass-mvp-v1`).

### Demo roles

- Header **Demo sign in** → diner  
- `/account` → diner / restaurant / admin  
- Restaurant dashboard: `/restaurant/dashboard`  
- Admin: `/admin`

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4  
- Client store for MVP demo; Supabase + Stripe next  
- Free-first hosting target: **Vercel**

## Product brief

See `../PRODUCT-BRIEF.md` for full business rules.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm.cmd run dev` | Local dev server |
| `npm.cmd run build` | Production build |
| `npm.cmd run start` | Serve production build |
| `npm.cmd run lint` | ESLint |
