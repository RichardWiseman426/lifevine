# LifeVine

> **Community Supporting Community.**  
> A mobile-first platform for real-world connection, support, and action.

[![Expo SDK](https://img.shields.io/badge/Expo-54-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## What This Is

LifeVine connects people with churches, ministries, counseling and healthcare organizations, support groups, volunteer opportunities, events, and community resources. It's **not** social media — there is no feed, no follows, no likes. It is a structured, purposeful platform for showing up for real people in real communities.

The app is Christian-rooted but open to everyone. Faith is the heartbeat of the mission, not a gate to enter.

---

## For Developers Reading This Cold

If you are a developer who has just been handed this project and you need to understand everything, **read these in order**:

| # | Document | Purpose | Time to read |
|---|---|---|---|
| 1 | **`README.md`** (this file) | Map of the repo + quick-start | 5 min |
| 2 | **`DEVELOPER_OVERVIEW.md`** | Full architecture, database schema, user flows with diagrams, design decisions | 25 min |
| 3 | **`SHIPPING_GUIDE.md`** | How to build and ship the app to TestFlight / Google Play / APK | 10 min |
| 4 | **`supabase/migrations/*.sql`** | The authoritative database schema — 11 migrations, numbered in order | 20 min |
| 5 | **`app/`** directory | Expo Router file-based routing — every `.tsx` in here is a screen | browse |
| 6 | **`src/hooks/`** | Data fetching layer — one hook per domain (orgs, events, conversations, etc.) | browse |

After those, you can open any file and understand how it fits.

---

## Quick Reference

**Tech stack:** React Native + Expo SDK 54 + Supabase + TypeScript + Zustand  
**Routing:** Expo Router v6 (file-system based, in `app/`)  
**Database:** PostgreSQL via Supabase, RLS enabled on every table  
**Auth:** Supabase Auth (email + password, JWT in expo-secure-store)  
**Storage:** Supabase Storage (public buckets: `avatars`, `org-assets`, `testimony-media`, `resource-files`)  
**Styling:** `StyleSheet.create` — no Tailwind runtime, no CSS-in-JS library  
**State:** Zustand (4 stores: `auth`, `drawer`, `settings`, `intent`)

---

## Getting Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Environment variables — create .env.local
cat > .env.local << 'EOF'
EXPO_PUBLIC_SUPABASE_URL=https://ikiwhhuxodegpwuuqblz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
EOF

# 3. Start the dev server
npx expo start

# 4. Open Expo Go on your phone, scan the QR code
```

That's it. No native build required for development — runs in Expo Go.

---

## Directory Map

```
LifeVine/
├── app/                           Expo Router — every file is a screen
│   ├── (auth)/                    Sign in, sign up, forgot password
│   ├── (tabs)/                    Main app tabs (home, orgs, serve, events, community, profile)
│   ├── legal/                     Terms, privacy, donation policy
│   ├── org/[id].tsx               Public contributor profile
│   ├── org-edit/[id].tsx          Owner/admin org editor
│   ├── event/[id].tsx             Event detail
│   ├── opportunity/[id].tsx       Volunteer opportunity detail
│   ├── testimony/[id].tsx         Story detail
│   ├── conversation/[id].tsx      Message thread (Realtime)
│   ├── resource/[id].tsx          Support resource detail
│   ├── submit-testimony.tsx       Share-your-story flow
│   ├── contributor-apply.tsx      Apply to become a contributor
│   ├── conversations.tsx          Messages inbox
│   ├── support.tsx                Support LifeVine (donation page)
│   ├── about.tsx                  About / mission
│   ├── emergency.tsx              Crisis resources
│   ├── admin.tsx                  Super admin / moderation panel
│   └── _layout.tsx                Root layout + session guard
│
├── src/
│   ├── components/                Shared UI (SideDrawer, BackHeader, ScreenHeader, LegalScreen)
│   ├── hooks/                     Data layer (useProfile, useOrganizations, useEvents, etc.)
│   ├── lib/                       supabase client + image upload helper
│   ├── store/                     Zustand stores (auth, drawer, settings, intent)
│   └── types/                     TypeScript database types
│
├── supabase/
│   └── migrations/                011 SQL migration files — schema is authoritative here
│
├── assets/                        Brand images, icons, splash
├── app.json                       Expo config
├── eas.json                       EAS Build config (for TestFlight / APK builds)
├── package.json                   Dependencies
├── DEVELOPER_OVERVIEW.md          ← Read this second
├── SHIPPING_GUIDE.md              ← Read before shipping
└── README.md                      ← You are here
```

---

## What the App Does

Core features shipped in MVP v1.0.0:

| Feature | Where |
|---|---|
| Authentication (email + password) | `app/(auth)/` |
| User profile with avatar, city/state, org membership | `app/(tabs)/profile.tsx` |
| Contributor directory (churches, counseling, healthcare, support) | `app/(tabs)/organizations.tsx` |
| Full contributor profile editor (logo, banner, mission, services, pastor, gallery, donation link) | `app/org-edit/[id].tsx` |
| Volunteer opportunities with proximity sort | `app/(tabs)/opportunities.tsx` |
| Events with proximity sort + featured carousel | `app/(tabs)/events.tsx` |
| Community testimonies with moderation queue | `app/(tabs)/testimonies.tsx` |
| Support resources (crisis, mental health, housing, etc.) | `app/(tabs)/resources.tsx` |
| Context-aware messaging (user ↔ contributor) with Realtime | `app/conversations.tsx` + `app/conversation/[id].tsx` |
| Donation link on every contributor profile | `app/org/[id].tsx` (💛 Give button) |
| Platform support donations (Stripe Payment Link) | `app/support.tsx` |
| Legal policies (Terms, Privacy, Donations) | `app/legal/` |
| Admin/moderation surface | `app/admin.tsx` |

---

## Security Posture

- RLS enabled on every table
- Typed FKs + CHECK constraints (no polymorphic associations)
- JWT stored in `expo-secure-store` (not AsyncStorage — more secure)
- No card data ever touches LifeVine — donations route to Stripe Payment Links
- Storage buckets: public SELECT, authenticated INSERT/UPDATE
- Soft deletes on all long-lived content

See `DEVELOPER_OVERVIEW.md` → "Security Posture" for the full audit.

---

## What's NOT Built Yet (roadmap)

These are intentionally deferred, not oversights:

- Stripe Connect (currently using paste-your-own-link for donations)
- Push notifications (schema is ready, Edge Function not deployed)
- Full Edge Function suite (`expand-recurrences`, `notify-opportunity`, etc. are stubs)
- Native Stripe SDK (would require leaving Expo Go — current setup ships faster)
- Enhanced contributor tier billing (`org_tiers` table exists, no Stripe Subscriptions yet)
- Featured placement scheduling / promotion slot rotation
- Automated testing (no Jest / Detox yet — MVP-level tradeoff)

---

## Contact

Product owner: Richard — see git history for commit contact info.

---

*LifeVine v1.0.0 — April 2026*
