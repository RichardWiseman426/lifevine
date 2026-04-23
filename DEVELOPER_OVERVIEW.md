# LifeVine — Developer Overview

> **Version:** 1.0.0 MVP  
> **Stack:** React Native (Expo SDK 54) · Supabase · TypeScript  
> **Platform:** iOS + Android (shared codebase)

---

## Table of Contents

1. [What Is LifeVine?](#what-is-lifevine)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Key User Flows](#key-user-flows)
6. [Frontend File Map](#frontend-file-map)
7. [State Management](#state-management)
8. [Image Storage](#image-storage)
9. [Authentication Flow](#authentication-flow)
10. [Tier System](#tier-system)
11. [Contributor Management](#contributor-management)
12. [Local Setup](#local-setup)
13. [Environment Variables](#environment-variables)
14. [Design System](#design-system)
15. [Key Design Decisions](#key-design-decisions)

---

## What Is LifeVine?

LifeVine is a **community connection platform** — not social media. It connects people with:

- **Churches, ministries, counseling, healthcare & nonprofits** (Contributors)
- **Volunteer opportunities with actionable steps** (Serve)
- **Local and virtual events** (Events)
- **Testimonies & community stories** (Community)
- **Support resources** (Resources)

The platform is designed around **real-world action and connection**, not engagement metrics, likes, or feeds.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Mobile (primary) | React Native 0.81 + Expo SDK 54 | Managed workflow |
| Routing | Expo Router v6 | File-system routing |
| Web (secondary) | Expo Web (shared codebase) | Same repo |
| Backend / DB | Supabase (PostgreSQL 15) | Cloud-hosted |
| Auth | Supabase Auth (JWT + email/password) | |
| Storage | Supabase Storage (S3-compatible) | Public + private buckets |
| Realtime | Supabase Realtime (WebSocket) | Messaging |
| Server Logic | Supabase Edge Functions (Deno) | |
| Scheduling | pg_cron (via Supabase) | |
| State | Zustand 5 | 3 active stores |
| Session Persistence | expo-secure-store | JWT stored on device |
| Image Picker | expo-image-picker v17 | PHPicker on iOS (no permission prompt) |
| Gradients | expo-linear-gradient | Auth + welcome screens only |
| Crash Reporting | Sentry (via @sentry/react-native) | |
| Language | TypeScript 5.9 | Strict mode |

---

## System Architecture

```
Client (React Native / Expo)
     │  HTTPS / WSS
Supabase Platform
  ├── Auth (JWT / email+password)
  ├── PostgREST (auto REST API)
  ├── Realtime (WebSocket channels)
  ├── Storage (S3-compatible buckets)
  └── Edge Functions (Deno)
          │
PostgreSQL 15 (RLS on all tables)
```

### Storage Buckets

| Bucket | Contents | Access |
|---|---|---|
| `avatars` | User profile photos | Public read |
| `org-assets` | Org logos, banners, gallery, pastor photos | Public read |
| `testimony-media` | Testimony image attachments | Auth read |
| `resource-files` | Downloadable support docs | Auth read |

---

## Database Schema

### Tables (13 migrations deployed)

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users — display name, avatar, location, platform role |
| `organizations` | Contributor orgs — church, ministry, counseling, healthcare, nonprofit |
| `org_members` | User membership in orgs — owner / admin / contributor roles |
| `org_invitations` | Pending invitations by email + token |
| `events` | Events posted by orgs |
| `event_schedules` | Recurrence rules (RFC 5545 RRULE) |
| `event_occurrences` | Materialized occurrences — what RSVPs attach to |
| `event_rsvps` | Per-user RSVPs with guest count |
| `opportunities` | Volunteer/service/prayer/mentorship opportunities |
| `opportunity_steps` | Ordered action steps per opportunity (powers "How to Help" buttons) |
| `opportunity_responses` | User responses — pending/accepted/declined/completed |
| `testimonies` | Community stories — moderated before public |
| `testimony_responses` | Replies to testimonies — moderated |
| `resources` | Support resources — crisis, housing, food, mental health, etc. |
| `conversations` | Messaging threads — direct, group, or context-bound |
| `conversation_participants` | Per-user participation state + last_read_at |
| `messages` | Individual messages with reply threading |
| `promoted_content` | Admin-only featured slots |
| `notifications` | Per-user notification log |
| `notification_preferences` | Per-user notification channel preferences |
| `audit_log` | Admin action trail |
| `tier_upgrade_requests` | Waitlist for Enhanced/Partner tier upgrades |
| `contributor_applications` | Applications to become a contributor org |

### Enumerations

| Type | Values |
|---|---|
| `platform_role` | `super_admin`, `moderator`, `standard` |
| `org_role` | `owner`, `admin`, `contributor` |
| `member_status` | `invited`, `active`, `suspended`, `removed` |
| `org_tier` | `free`, `enhanced`, `partner` |
| `moderation_status` | `draft`, `pending_review`, `approved`, `rejected`, `archived` |
| `opportunity_status` | `draft`, `open`, `filled`, `closed`, `archived` |
| `response_status` | `pending`, `accepted`, `declined`, `withdrawn`, `completed` |
| `resource_category` | `mental_health`, `crisis`, `housing`, `food`, `medical`, `legal`, `financial`, `substance`, `spiritual`, `community`, `other` |

### Key RLS Rules

- **Org management:** Only `owner` or `admin` org_members can INSERT/UPDATE/DELETE their org's events, opportunities, steps, and occurrences.
- **Public reads:** Approved events, open opportunities, and approved testimonies are readable by anyone (even unauthenticated).
- **Testimonies/resources:** Default to `pending_review` — must be approved by a moderator before public visibility.
- **Messaging:** Only conversation participants can read messages.
- **Contributor applications:** Admins and super_admins only.

---

## Key User Flows

### Authentication Flow

```
App Launch
  → No session? → Sign In screen (gradient, dark green)
  → Valid session + first time? → Welcome screen (gradient)
  → Valid session + returning? → Home tab (/(tabs))

Sign Up:
  Step 1: email + password
  Step 2: OTP verification code
  Step 3: username + display name

on-signup Edge Function fires on auth.users INSERT
  → auto-creates profiles row
```

### Contributor Management Flow

```
Profile Tab
  → My Organizations section
  → [Edit Profile] → org-edit/[id] — banner, logo, name, location, pastor, gallery, social, etc.
  → [Manage] → manage-org/[id] — opportunities + events dashboard
      → [+ New Opportunity] → opportunity-form (create mode)
          Fields: title, category, status, description, location, spots, dates,
                  commitment, contact info
          Step Builder: add unlimited "How to Help" steps
            Each step: title, description, action type (Link/Phone/Email/Form/ShowUp/Document),
                       URL/phone/email, button label
          → Saves to opportunities + opportunity_steps
          → Powers the "How to Help" section + action buttons on the detail page

      → [Tap existing opp] → opportunity-form (edit mode, pre-populated)

      → [+ New Event] → event-form (create mode)
          Fields: title, category, description, date+time, virtual/in-person,
                  location (city/state or virtual URL), max attendees
          → Saves to events + event_schedules + event_occurrences
          → Powers RSVP functionality on the detail page

      → [Tap existing event] → event-form (edit mode)
```

### Volunteer Opportunity Response Flow

```
Serve Tab → Opportunity card → Opportunity detail
  → "How to Help" section shows ordered action steps
  → Each step button: calls tel://, opens mailto://, opens URL, or just shows instructions
  → "I Want to Help" sticky button → inserts opportunity_responses row (status=pending)
  → Edge Function notifies org admin
```

### Event RSVP Flow

```
Events Tab → Event card → Event detail
  → RSVP button → inserts event_rsvps row
  → rsvp_count on event_occurrences updated by DB trigger
```

### Testimony Flow

```
Community Tab → "Share Your Story" CTA → submit-testimony screen
  → Inserts testimonies row (status=pending_review)
  → Moderator approves → visible in Community feed
```

### Tier Upgrade Flow

```
Profile Tab → Upgrade card → /upgrade screen
  → Free / Enhanced ($49/mo) / Partner ($99/mo)
  → Tap "Get Started" → org picker modal → submits tier_upgrade_requests row
  → LifeVine team contacts org owner manually (billing not yet live)
```

---

## Frontend File Map

```
app/
├── _layout.tsx                  Root layout — session guard, routing
├── welcome.tsx                  First-time welcome screen (gradient)
├── upgrade.tsx                  Tier pricing + waitlist signup
├── about.tsx                    About LifeVine
├── admin.tsx                    Super admin / moderation panel
├── contributor-apply.tsx        Apply to become a contributor org
├── submit-testimony.tsx         Story submission form
├── conversations.tsx            Inbox — all conversation threads
├── support.tsx                  Support / contact screen
│
├── (auth)/
│   ├── sign-in.tsx              Email + password login (gradient)
│   └── sign-up.tsx              3-step registration: email → OTP → profile (gradient)
│
├── (tabs)/
│   ├── _layout.tsx              Tab container (tab bar hidden, SideDrawer overlay)
│   ├── index.tsx                Home — featured orgs, affirmation, new contributors,
│   │                              activity bar, events near you, stories near you
│   ├── organizations.tsx        Contributors directory — search, category chips,
│   │                              near-you carousel, full list
│   ├── opportunities.tsx        Serve — volunteer/service/prayer opportunities
│   ├── events.tsx               Events — upcoming, near you carousel + full list
│   ├── testimonies.tsx          Community stories — category filter, near you, submit CTA
│   ├── profile.tsx              User profile — avatar, orgs (Edit + Manage buttons),
│   │                              settings, upgrade card, sign out
│   └── resources.tsx            Support resources — category filter, crisis first
│
├── org/[id].tsx                 Public contributor profile — full public display
├── org-edit/[id].tsx            Owner/admin org editor — all sections
├── manage-org/[id].tsx          Contributor hub — manage opportunities + events
├── opportunity-form.tsx         Create/edit opportunity + step builder
├── event-form.tsx               Create/edit event + schedule + occurrence
├── event/[id].tsx               Event detail + RSVP
├── opportunity/[id].tsx         Opportunity detail + How to Help steps + respond
├── testimony/[id].tsx           Story detail + responses
├── resource/[id].tsx            Resource detail
├── conversation/[id].tsx        Message thread (Realtime)
└── legal/                       Terms + privacy screens

src/
├── components/
│   ├── BackHeader.tsx           Back button header for all stack screens
│   ├── ScreenHeader.tsx         Tab header — hamburger (left), title, optional right element
│   ├── SideDrawer.tsx           Animated slide-out nav drawer
│   ├── EmptyState.tsx           Reusable empty state (geometric dots, no emojis)
│   ├── ErrorBoundary.tsx        Class-based error boundary + ErrorFallback UI
│   ├── EventCard.tsx            Event card for list views
│   ├── OpportunityCard.tsx      Opportunity card for list views
│   ├── ResourceCard.tsx         Resource card — crisis banner, contact chips
│   ├── TestimonyCard.tsx        Testimony card for Community feed
│   ├── OrgCard.tsx              Org card for directory
│   └── LegalScreen.tsx          Reusable legal text screen wrapper
│
├── hooks/
│   ├── useProfile.ts            Current user profile + my orgs + update
│   ├── useOrganizations.ts      Org list (search/filter) + single org
│   ├── useEvents.ts             Upcoming event occurrences
│   ├── useOpportunities.ts      Opportunity list + single + steps
│   ├── useTestimonies.ts        Approved testimony list + single
│   ├── useResources.ts          Resource list + single
│   └── useConversations.ts      Conversation list + messages + Realtime
│
├── lib/
│   ├── supabase.ts              Supabase client + SecureStore session adapter
│   ├── storage.ts               Image pick + upload (arrayBuffer, not blob)
│   └── sentry.ts                Sentry init + wrapped export
│
├── store/
│   ├── auth.ts                  Session, profile, loading state
│   ├── drawer.ts                Drawer open/close/toggle
│   └── settings.ts              hasSeenWelcome + persisted user prefs
│
└── types/
    └── database.ts              TypeScript types for all Supabase tables

supabase/
└── migrations/
    ├── 001_enums_and_extensions.sql       Enums, pg_trgm, uuid-ossp
    ├── 002_core_users_orgs.sql            profiles, organizations, org_members, invitations
    ├── 003_events_opportunities.sql       events, schedules, occurrences, rsvps,
    │                                       opportunities, steps, responses + RLS
    ├── 004_testimonies_resources_messaging.sql
    ├── 005_promotion_notifications_audit.sql
    ├── 006_auth_trigger_and_cron.sql      on-signup trigger, expand-recurrences cron
    ├── 007_profile_name_fields.sql        first_name, last_name on profiles
    ├── 008_contributor_applications.sql   contributor_applications table
    ├── 009_org_contact_gallery.sql        gallery_urls, contact fields on orgs
    ├── 010_org_extended_fields.sql        pastor fields, social links, services, denomination
    ├── 011_org_donation_url.sql           donation_url on organizations
    ├── 012_tier_partner_and_waitlist.sql  partner tier + tier_upgrade_requests
    └── 013_contributor_write_policies.sql RLS write policies for event_occurrences
                                            + opportunity_steps (contributor access)
```

---

## State Management

Three active Zustand stores:

| Store | Contents | Persisted? |
|---|---|---|
| `auth` | `session`, `profile`, `isLoading`, `signOut()` | JWT via expo-secure-store |
| `drawer` | `isOpen`, `open()`, `close()`, `toggle()` | No |
| `settings` | `hasSeenWelcome`, `setHasSeenWelcome()` | SecureStore |

Data fetching lives in **custom hooks** — each hook owns its loading/error state and fires a Supabase query on mount. No React Query, no SWR.

---

## Image Storage

All uploads use **`arrayBuffer`** — never `blob`. Blobs produce 0-byte or corrupted uploads in React Native with the Supabase JS client.

```
src/lib/storage.ts → pickAndUploadImage(bucket, path, options)
```

| Bucket | Used For | Path Pattern |
|---|---|---|
| `avatars` | User profile photos | `{userId}/avatar.jpg` |
| `org-assets` | Org logo | `{orgId}/logo.jpg` |
| `org-assets` | Org banner | `{orgId}/banner.jpg` |
| `org-assets` | Org gallery images | `{orgId}/gallery/{timestamp}.jpg` |
| `org-assets` | Pastor photo | `{orgId}/pastor.jpg` |

**iOS note:** expo-image-picker v17 uses PHPicker — no system permission prompt. `exif: false` prevents the "location included" snackbar.

---

## Authentication Flow Detail

```
Supabase Auth (email + password)
    ↓
JWT stored in expo-secure-store (not AsyncStorage)
    ↓
src/lib/supabase.ts — custom storage adapter reads/writes SecureStore
    ↓
src/store/auth.ts — listens to onAuthStateChange
    ↓
app/_layout.tsx:
  no session → /(auth)/sign-in
  session + first time (hasSeenWelcome=false) → /welcome
  session + returning → /(tabs)
```

The `on-signup` Edge Function (Supabase) fires on `auth.users` INSERT and auto-creates the `profiles` row.

---

## Tier System

Three tiers — billing not live yet, uses waitlist:

| Tier | Price | Key Limits |
|---|---|---|
| Free | $0 | Photo gallery, 1 event, 1 opportunity, 1 team member |
| Enhanced | $49/mo | 3 events, 3 opportunities, 5 members, featured placement, donation link |
| Partner | $99/mo | Up to 25 members, promoted slots, verified badge, direct LifeVine contact |

Upgrade flow: `/upgrade` screen → org picker → `tier_upgrade_requests` insert → LifeVine team follows up manually.

---

## Contributor Management

Org owners and admins have two buttons on their org rows in the Profile tab:

- **Edit Profile** → `org-edit/[id]` — banner, logo, name, mission, location, contact, social links, services, denomination, pastor/leadership, gallery
- **Manage** → `manage-org/[id]` — dashboard for opportunities and events

### Opportunities (`opportunity-form`)

The step builder is the core of opportunity actionability. Each step has:

| Field | Purpose |
|---|---|
| Title | What the user needs to do |
| Description | Extra context |
| Action Type | `link`, `phone`, `email`, `form`, `show_up`, `read` |
| URL / Phone / Email | The destination for the button |
| Button Label | Custom button text (e.g. "View the List", "Donate Online") |

Steps save to `opportunity_steps` ordered by `step_order`. On the detail page, each step renders as a numbered card with an action button that calls `Linking.openURL()` with the correct scheme (`tel://`, `mailto://`, or `https://`).

### Events (`event-form`)

Creates three linked records:
1. `events` — the base event record
2. `event_schedules` — date/time info, recurrence=none for single events
3. `event_occurrences` — the concrete occurrence that RSVPs attach to

---

## Local Setup

### Prerequisites

- Node.js 18+
- EAS CLI: `npm install -g eas-cli`
- Expo Go app on device (dev testing)

### Steps

```bash
# 1. Clone
git clone https://github.com/RichardWiseman426/lifevine
cd lifevine

# 2. Install dependencies
npm install

# 3. Environment config
cp .env.example .env.local
# Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

# 4. Run migrations (Supabase Dashboard → SQL Editor)
# Run each file in supabase/migrations/ in order: 001 → 013

# 5. Storage buckets (Supabase Dashboard → Storage)
# Create: avatars, org-assets, testimony-media, resource-files (all Public)

# 6. Start dev server
npx expo start

# 7. Scan QR code with Expo Go
```

### EAS Build (Production)

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production

# Required EAS secrets (set before build):
# SENTRY_ORG=kingdom-forge-studios
# SENTRY_PROJECT=react-native
```

---

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://ikiwhhuxodegpwuuqblz.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

These are the only required env vars. `EXPO_PUBLIC_` prefix exposes them to the RN bundle.

Sentry DSN is embedded in `sentry.ts` directly (not an env var).

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#F5F0E8` | Warm linen — all tab/stack screens |
| Gradient (auth/welcome) | `#052218` → `#0D4A2C` → `#1A7A4A` | Sign-in, sign-up, welcome only |
| Primary green | `#2D6A4F` | Buttons, icons, active states |
| Light green bg | `#E8F5E9` | Chips, card accents |
| Amber accent | `#B8864E` | Enhanced tier, featured badges |
| Purple accent | `#7C3AED` | Partner tier |
| Dark text | `#1C1917` | Headings |
| Body text | `#57534E` | Paragraphs |
| Muted text | `#78716C` | Labels, metadata |
| Card background | `#FFFFFF` | Section cards |
| Border | `#E5DDD4` | Card borders, dividers |

**No emojis in UI chrome.** Geometric shapes (dots, bars, circles) are used as indicators throughout.

**Typography:** System default (`-apple-system` / `Roboto`) — no custom font required for MVP.

**All styles use `StyleSheet.create()`** — no Tailwind, no inline style objects.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Tab bar hidden** | Navigation lives in `SideDrawer`. Tab system is routing container only. |
| **No follows / feed / likes** | Intentional — LifeVine is a connection platform, not social media. |
| **Moderation asymmetry** | Events default `approved`. Testimonies/resources default `pending_review`. Different trust levels. |
| **arrayBuffer uploads** | Blob uploads produce 0-byte files with Supabase JS in React Native. |
| **PHPicker on iOS** | expo-image-picker v17 — no upfront permission prompt. Better UX. |
| **Denormalized counters** | `rsvp_count`, `spots_filled`, `response_count` updated by DB triggers. Fast reads, no aggregate queries. |
| **Step builder for opportunities** | The "How to Help" steps are what make opportunities actionable — not just listings. Contributors configure real buttons (call, email, link, form). |
| **Waitlist tiers** | Billing not live yet. `tier_upgrade_requests` captures warm leads. LifeVine team follows up manually. |
| **Single-occurrence events** | MVP event form creates one event_schedule + one event_occurrence. Recurring events exist in schema (pg_cron + rrule) but not exposed in the form yet. |
| **Zustand over Redux** | Minimal boilerplate, works with Expo, no Context provider wrapping. |

---

## Supabase Project Reference

- **Project ID:** `ikiwhhuxodegpwuuqblz`
- **URL:** `https://ikiwhhuxodegpwuuqblz.supabase.co`
- **Auth providers:** Email/Password
- **RLS:** Enabled on all tables
- **Edge Functions:** `on-signup`, `expand-recurrences`
- **Sentry org:** `kingdom-forge-studios` / project: `react-native`

---

*Last updated: April 2026 — LifeVine v1.0.0 MVP*
