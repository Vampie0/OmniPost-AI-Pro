# SocialPilot AI Pro

Autonomous multi-platform social growth suite — one TypeScript monorepo shipping an **Expo mobile app**, a **Next.js web admin**, and a **Supabase** backend.

| Surface | Stack | Local URL |
|---|---|---|
| Mobile app (customer) | Expo SDK 57 · React Native 0.86 · Reanimated 4.5 · expo-router | `expo start` |
| Web admin (operator) | Next.js 15.5 · React 19 · Tailwind 3.4 · TanStack Table/Query · Recharts | http://localhost:3001 |
| Backend | Supabase (Postgres + RLS, Auth, Storage, Edge Functions, Realtime) | — |

**Live admin:** https://socialpilot-admin.vercel.app

---

## Repository layout

```
apps/admin        Next.js operator dashboard (13 routes)
apps/mobile       Expo app — customer iOS / Android / web
packages/tokens   LUXURY_PALETTES — the five colour systems (see Theming)
packages/types    Shared API, auth and database types
supabase/         SQL migrations, setup scripts, Edge Functions
scripts/          Build helpers (React de-duplication for the pnpm workspace)
brag/  brag-2/    Marketing video compositions, posters and scene tables
```

## Getting started

Requires Node 20+ and `pnpm` 9 (`corepack enable`).

```bash
pnpm install
cp apps/admin/.env.example  apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# fill in your Supabase project URL and anon key
pnpm admin            # web admin  → http://localhost:3001
cd apps/mobile && npx expo start   # mobile app
```

Both apps need only **publishable** values — `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` and the Supabase anon key. Row Level Security is what protects data, not those keys. The `service_role` key belongs **only** in Supabase Edge Function secrets, never in a client bundle or in git.

| Variable | Used by |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | admin |
| `NEXT_PUBLIC_USE_MOCK` | admin — `false` reads live data, `true` uses fixtures |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_APP_NAME` | mobile |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `send-push` Edge Function (server side only) |

### Backend setup

Apply the schema in order — `supabase/migrations/` is the source of truth, and `supabase/master-setup.sql` is the one-shot version for a fresh project. Run them from the Supabase SQL editor or `supabase db push`. See [INSTALLATION.md](./INSTALLATION.md).

Deploy the push Edge Function and give it its secret:

```bash
supabase functions deploy send-push --no-verify-jwt
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key>
```

## Scripts

| Command | Does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm lint` | Turbo across all workspaces |
| `pnpm admin` | Next dev server on port 3001 |
| `cd apps/mobile && npx tsc --noEmit` | Mobile typecheck (its `lint` script) |
| `cd apps/mobile && npx expo export -p web` | Static web build into `apps/mobile/dist` |
| `pnpm brand:generate` | Re-render every icon, splash logo, favicon and social card from one vector mark |

`postinstall` runs `scripts/dedupe-react.cjs`. **Do not skip it** — the admin pins React 19 while Expo pulls its own copy, and without de-duplication Next fails to build with duplicate-React errors.

## Theming

Five palettes — `sunset`, `emerald`, `violet`, `azure`, `stealth` — each with a dark and a light variant, defined once in `packages/tokens/src/index.ts`. They are the product's brand contract: **add a token rather than editing these values.**

- **Admin:** `ThemeProvider` publishes the active palette as CSS custom properties on a dedicated `<style id="socialpilot-theme">` element, and `tailwind.config.ts` exposes them as semantic classes (`bg-surface`, `text-text-secondary`, `border-border-active`). Translucent steps are spelled out with `color-mix` in `globals.css` because Tailwind v3 cannot decompose a `var()` colour — `bg-surface/70` silently does nothing, so `bg-surface-subtle-70` exists instead.
- **Mobile:** components read `theme.colors.*` through `useTheme()`.
- **Status colours** (`success` / `warning` / `danger`) intentionally live *outside* the palettes — in `globals.css` for the admin and `theme/statusColors.ts` for mobile — so a destructive action still reads as destructive in Cyber Mint.
- A palette must survive a reload: the admin persists the choice with zustand, and `useTheme.ts` recomputes the derived `colors`/`isDark` in the persist `merge`, otherwise rehydration restores only the palette name and the UI silently stays on sunset.

Selected and active states use the palette **gradient**, not a flat accent — `GradientFrame` renders a real gradient border, which React Native cannot do with `borderColor`.

## Brand assets

`scripts/generate-brand-assets.mjs` is the single source for the icon: one vector mark (an orbit that passes behind and in front of a lit sphere) rasterised to all 28 outputs — Expo source images, every Android density for `mipmap`/`drawable`, the admin favicon set and the 1200×630 social card. Edit the mark there, never the PNGs.

```bash
pnpm brand:generate
# rebrand for a white-label buyer without touching the script:
node scripts/generate-brand-assets.mjs --grad "#00F5A0,#00D2FF,#059669" --ring "#FF5E3A,#FFAE00" --bg "#040605"
```

Two constraints the script encodes, because both fail silently at store review rather than at build:
- `icon.png` and `apple-touch-icon.png` are written **without an alpha plane** — the App Store rejects an icon that carries one even when every pixel is opaque.
- The adaptive-icon foreground keeps its artwork inside the 66/108 dp safe zone, since launchers crop the outer ring to a circle or squircle.

Launcher icons cannot animate on iOS or Android, so the motion lives in the launch handoff instead: `app.config.ts` sets the native splash to `splash-icon.png` on `#06070B`, which is the sunset palette's `background` token, and `AnimatedSplashScreen` then brings that same mark alive as the orrery in `CosmicSocialLoader`. Changing the palette means regenerating these assets — the native splash colour is baked at build time and will not follow a runtime palette switch.

## Deployment

The admin deploys to Vercel from the **repository root**; `vercel.json` pins the install/build to npm within `apps/admin`, which is what sidesteps the workspace lockfile problem.

```bash
npx vercel            # preview build, no production traffic
npx vercel --prod     # promote
```

The mobile app is an Expo project: ship it natively with EAS, or publish `expo export -p web` as a static site — a web build has no push notifications and stores auth in `localStorage` instead of SecureStore.

## Docs

[INSTALLATION.md](./INSTALLATION.md) · [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) · [MOBILE_CUSTOMIZATION.md](./MOBILE_CUSTOMIZATION.md) · [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) · [CHANGELOG_AI.md](./CHANGELOG_AI.md)

---

Designed and built end to end by **Ali Aslam · @vampie** — apps, websites and POS systems for iOS, Android, macOS and web.
