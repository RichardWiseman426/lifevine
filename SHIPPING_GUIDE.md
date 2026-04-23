# LifeVine — Shipping & TestFlight Guide

This guide covers how to build and distribute LifeVine to testers **without needing the
terminal open on your machine** after the initial setup. Builds happen in the cloud via
Expo's EAS (Expo Application Services).

---

## How It Works

```
Your machine (one-time command)
    ↓
EAS Build servers (cloud — builds while your laptop is closed)
    ↓
iOS  → TestFlight → testers install from the TestFlight app
Android → APK download link → testers install directly
```

You run **one command** from terminal, then close your laptop. EAS builds it in the cloud
and emails you when it's done. Testers install from TestFlight or a link — no terminal,
no Expo Go required.

---

## One-Time Setup

### Step 1 — Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2 — Log in to Expo

```bash
eas login
```

Use your Expo account (create one free at expo.dev if you don't have one).

### Step 3 — Link the project

```bash
cd C:\Users\barga\OneDrive\Desktop\LifeVine
eas init
```

This creates a project ID in your Expo account and links it to this codebase.

### Step 4 — Store your Supabase secrets in EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://ikiwhhuxodegpwuuqblz.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key-here"
```

These secrets are injected at build time — never stored in the repo.

---

## iOS — TestFlight

TestFlight is Apple's official beta testing tool. Testers install the **TestFlight app**
from the App Store, then tap a link to join your test.

### What you need

- Apple Developer account: **$99/year** at developer.apple.com
- That's it — EAS handles all the certificates and provisioning profiles automatically

### Build and upload to TestFlight

```bash
eas build --platform ios --profile preview
```

EAS will:
1. Ask you to log in to your Apple account (one time)
2. Auto-create or reuse your signing certificates
3. Build the app in the cloud (~15–25 minutes)
4. Upload directly to App Store Connect / TestFlight

### Add testers

1. Go to **appstoreconnect.apple.com**
2. Select your app → TestFlight
3. Click **+** next to "Internal Testers" or "External Testers"
4. Enter their Apple ID email addresses
5. They get an email → install TestFlight → tap the link → done

**Internal testers** (up to 100): Added by Apple ID — no review required.  
**External testers** (up to 10,000): Requires a one-time Apple review (~24–48 hours).

For sharing with friends/early users, Internal Testers is all you need.

---

## Android — Direct APK Link

Android doesn't require a store or special account for testing. EAS builds an APK and
gives you a download link you can share directly.

### Build the APK

```bash
eas build --platform android --profile preview
```

Build takes ~10–20 minutes in the cloud. When it finishes, EAS prints a download URL like:

```
https://expo.dev/artifacts/eas/xxxxxxxxxxxx.apk
```

Share that link with Android testers. They tap it on their phone, allow "Install unknown
apps" once, and it installs. Done.

---

## Both Platforms at Once

```bash
eas build --platform all --profile preview
```

Kicks off both iOS and Android builds simultaneously. You'll get links/TestFlight upload
for both when they finish.

---

## Checking Build Status

You don't need to keep terminal open. Check anytime at:

**https://expo.dev** → your project → Builds

Or terminal:
```bash
eas build:list
```

EAS also emails you when builds succeed or fail.

---

## Update the App (Without Rebuilding)

For **JavaScript/UI changes** (no native code changes), you can push an instant over-the-air
update to all installed copies — no new TestFlight submission required:

```bash
eas update --branch preview --message "Fixed org detail page layout"
```

Testers get the update automatically next time they open the app.

This only works for JS/TS/asset changes. If you add a new native package (like a camera
library), you need a full build.

---

## Build Profiles Explained

| Profile | Purpose | Distribution |
|---|---|---|
| `preview` | Share with testers — full app, no debug tools | TestFlight / APK link |
| `development` | Developer builds with debug menu | Internal only |
| `production` | App Store / Play Store submission | Store review |

Use **preview** for TestFlight and friend testing.  
Use **production** when you're ready for the actual App Store.

---

## Full Preview Distribution Flow

```
1. Make code changes
2. Run: eas build --platform all --profile preview
3. Close terminal — build runs in cloud
4. ~20 min later: check expo.dev or email for completion
5. iOS: go to TestFlight, testers already see new build
6. Android: new APK link — share in group chat or email
7. Testers open app → new version
```

---

## Costs

| Service | Cost |
|---|---|
| EAS Build | Free tier: 30 builds/month. Paid: $29/mo for unlimited |
| Apple Developer Program | $99/year (required for TestFlight) |
| Google Play Developer | $25 one-time (only needed for Play Store, not APK sharing) |
| Supabase | Free tier covers MVP easily |
| Expo account | Free |

For early testing with friends, the **free EAS tier + $99 Apple dev account** is all you need.

---

## Quick Reference — Commands

```bash
# One-time setup
npm install -g eas-cli
eas login
eas init

# Store secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."

# Build for testing
eas build --platform ios --profile preview       # iOS only
eas build --platform android --profile preview   # Android only
eas build --platform all --profile preview       # Both

# Push a JS-only update instantly
eas update --branch preview --message "your message"

# Check builds
eas build:list
```

---

*LifeVine v1.0.0 — EAS Build / TestFlight Guide*
