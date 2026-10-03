# SocialPilot AI Pro — Complete Setup & Installation Guide

Complete step-by-step guide to deploy your Mobile App + Web Admin Panel with Supabase backend.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ or v20+ | [nodejs.org](https://nodejs.org) |
| pnpm | v8+ | `npm install -g pnpm` |
| Supabase | Free tier | [supabase.com](https://supabase.com) |
| Git | Latest | [git-scm.com](https://git-scm.com) |

---

## Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd socialpilot-ai-pro

# Install all dependencies (monorepo)
pnpm install
```

---

## Step 2: Supabase Database Setup

### 2.1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **New Project** and fill in:
   - **Name**: `socialpilot-ai` (or any name)
   - **Database Password**: (save this somewhere safe)
   - **Region**: Choose closest to your users
3. Wait for the project to initialize (~2 minutes).

### 2.2 — Run the Master SQL Script

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar).
2. Click **New Query**.
3. Open the file `supabase/master-setup.sql` from this project.
4. Copy the **entire** content and paste it into the SQL Editor.
5. Click **Run** (or press `Ctrl+Enter`).

This single script does everything:
- Creates all 13 tables (profiles, posts, folders, templates, subscriptions, team_invites, analytics, notifications, ai_logs, generated_images, app_config, ai_config, admin_audit_logs)
- Sets up all custom ENUM types
- Enables Row Level Security (RLS) on every table
- Creates all RLS policies for proper data isolation
- Sets up the automatic profile creation trigger on user signup
- Creates auto-update triggers for `updated_at` columns
- Backfills profiles and subscriptions for any existing users
- Configures Realtime publication for live data sync

> The script is **idempotent** — safe to run multiple times. It won't duplicate data or throw errors on re-run.

### 2.3 — Promote Your Account to Super Admin

After running the master SQL, you need to make your user an admin.

**Option A: Via SQL Editor** (recommended)
```sql
-- Replace with YOUR email
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

**Option B: Via Table Editor**
1. Go to **Table Editor** → `profiles`
2. Find your row
3. Change `role` from `user` to `super_admin`

### 2.4 — Copy Your Supabase API Keys

1. Go to **Project Settings** → **API** (left sidebar under Settings)
2. Copy these values:
   - **Project URL** — looks like `https://abcdefg.supabase.co`
   - **anon public key** — a long string starting with `eyJ...`

---

## Step 3: Configure Environment Variables

### 3.1 — Mobile App

Copy the example file and fill in your values:

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ your-anon-key-here
EXPO_PUBLIC_APP_NAME="SocialPilot AI Pro"
```

### 3.2 — Web Admin Panel

Copy the example file and fill in your values:

```bash
cp apps/admin/.env.example apps/admin/.env.local
```

Edit `apps/admin/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ your-anon-key-here
```

> **Important**: The admin panel uses cookie-based auth via middleware. Both env vars must be correct or login will not work.

### 3.3 — Edge Functions (AI Features)

If you want AI content generation and AI image generation to work, set these secrets in Supabase:

1. Go to **Project Settings** → **Secrets** (or **Functions** → **Secrets**)
2. Add these secrets:

| Secret Name | Where to Get It | Purpose |
|-------------|-----------------|---------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | AI text/content generation |
| `REPLICATE_API_TOKEN` | [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) | AI image generation |

> These are only needed for AI features. The app and admin panel will work without them — AI generation buttons will just return an error.

---

## Step 4: Run the Mobile App

```bash
# From project root
cd apps/mobile

# Option A: Run on Android emulator
npx expo run:android --no-install

# Option B: Run on iOS simulator (Mac only)
npx expo run:ios --no-install

# Option C: Expo Go (scan QR code with phone)
npx expo start
```

> **First time?** Make sure you have Android Studio / Xcode installed for emulator, or use Expo Go on your physical device.

---

## Step 5: Run the Web Admin Panel

```bash
# From project root
pnpm --filter @socialpilot/admin dev
```

Open **http://localhost:3001/login** in your browser.

Login with your `super_admin` email and password.

---

## Step 6: App Icon & Splash Screen

The app uses these files for the icon:

| File | Path | Size |
|------|------|------|
| App Icon | `apps/mobile/src/assets/images/icon.png` | 1024x1024 px |
| Adaptive Icon (Android) | `apps/mobile/src/assets/images/adaptive-icon.png` | 1024x1024 px |

**To replace with your own logo:**
1. Create a 1024x1024 PNG with your app logo
2. Replace `icon.png` and `adaptive-icon.png` with your file
3. Rebuild the app: `npx expo prebuild --clean` then `npx expo run:android`

The splash screen background color is `#07080B` (dark) as configured in `app.config.ts`.

---

## Database Schema Overview

### Tables & RLS Security Summary

| Table | Who Can Read | Who Can Write |
|-------|-------------|---------------|
| `app_config` | All authenticated | Admins only |
| `ai_config` | All authenticated | Admins only |
| `profiles` | Own profile or admin | Own profile or admin |
| `subscriptions` | Own or admin | Admin + self-insert |
| `team_invites` | Inviter, invitee, or admin | Authenticated (as inviter) |
| `folders` | Own only | Own only |
| `posts` | Own or admin (read) | Own only; admin can delete |
| `templates` | Active templates (all) | Admins only |
| `generated_images` | Own only | Own only |
| `analytics` | Own or admin (read) | Own insert/update |
| `notifications` | Own only | Admin can insert |
| `ai_logs` | Own only | System (via trigger) |
| `admin_audit_logs` | Admins only | Admins only |

### Key Security Features

- **RLS enabled on all 13 tables** — no table is accessible without proper auth
- **`is_admin()` helper function** — checks if current user has `admin` or `super_admin` role
- **`auth.uid()` checks** — every policy verifies the requesting user's identity
- **Automatic profile creation** — trigger fires on every new auth signup
- **Subscription auto-creation** — new users get a free tier subscription automatically
- **Credit system** — `decrement_user_credits()` function prevents negative balances
- **Suspended user protection** — suspended users cannot perform actions

---

## RLS Diagnostic Query

If you want to verify all RLS policies are correctly set up, run this query in Supabase SQL Editor:

```sql
-- Check RLS status for all public tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all RLS policies with details
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Count policies per table
SELECT
  tablename,
  count(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

Share the output with the developer if you need a security review.

---

## Verification Checklist

After completing all steps, verify:

- [ ] Master SQL ran without errors
- [ ] Your profile shows `role = 'super_admin'` in the `profiles` table
- [ ] Mobile app `.env` has correct Supabase URL and key
- [ ] Admin `.env.local` has correct Supabase URL and key
- [ ] Web login works at `http://localhost:3001/login` with your admin credentials
- [ ] Mobile app connects to Supabase (no red errors on dashboard)
- [ ] RLS is enabled on all tables (run diagnostic query above)
- [ ] AI features work (if you added Gemini/Replicate API keys)

---

## Troubleshooting

### Login page keeps loading / doesn't redirect
- Make sure `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure your profile `role` is `super_admin` or `admin` in the database
- Clear browser cache and cookies, then try again
- The login uses `window.location.href` for full page reload to ensure middleware picks up auth cookies

### "Database error creating new user"
- Run the master SQL script again — it includes a fix for the subscriptions insert policy
- Check that the `handle_new_user()` trigger exists: go to **Database** → **Triggers** in Supabase

### Splash screen shows wrong background
- The splash background is `#07080B` (very dark). If you see a white flash, rebuild the app with `npx expo prebuild --clean`

### Hardcoded colors still visible
- All colors now use the theme system (`theme.colors.*`). If you spot any remaining hardcoded hex values, report them.
- The splash screen and brand logos (Instagram gradient, Twitter blue, etc.) intentionally use fixed colors since they represent real brand identities.

### Edge Functions return errors
- Check that `GEMINI_API_KEY` and `REPLICATE_API_TOKEN` are set in Supabase Secrets
- Edge Functions run in Deno, not Node.js — they need separate secret configuration

---

## Project Structure

```
socialpilot-ai-pro/
├── apps/
│   ├── admin/              # Next.js 14 Web Admin Panel (port 3001)
│   │   ├── src/app/        # Pages (login, dashboard, users, etc.)
│   │   ├── src/components/ # React components
│   │   ├── src/lib/        # Supabase client, utils
│   │   └── src/theme/      # Theme provider
│   └── mobile/             # Expo React Native Mobile App
│       ├── src/app/        # Screens (tabs, profile, team, etc.)
│       ├── src/components/ # Atoms, molecules, templates
│       ├── src/theme/      # Theme provider + palettes
│       └── src/store/      # Zustand state management
├── packages/
│   ├── tokens/             # Shared design tokens & theme types
│   └── types/              # Shared TypeScript types
├── supabase/
│   ├── master-setup.sql    # ONE master SQL for everything
│   ├── functions/          # Edge Functions (AI content, AI image)
│   └── migrations/         # Legacy migration files
└── scripts/
    └── setup-all.cjs       # Automated setup script
```

---

## Support

For issues or questions, refer to `TROUBLESHOOTING.md` or check the Supabase dashboard logs.
