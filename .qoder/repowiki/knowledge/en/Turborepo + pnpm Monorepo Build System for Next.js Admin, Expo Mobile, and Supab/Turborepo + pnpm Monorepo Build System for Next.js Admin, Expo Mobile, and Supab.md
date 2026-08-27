---
kind: build_system
name: Turborepo + pnpm Monorepo Build System for Next.js Admin, Expo Mobile, and Supabase Backend
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - turbo.json
    - pnpm-workspace.yaml
    - scripts/setup-all.cjs
    - apps/admin/package.json
    - apps/admin/next.config.js
    - apps/mobile/package.json
    - apps/mobile/eas.json
    - supabase/config.toml
---

## What system/approach is used

The repository is a **pnpm workspaces monorepo** orchestrated by **Turborepo v2**. The root `package.json` declares workspaces under `apps/*` and `packages/*`, pins the package manager to `pnpm@9.0.0` via `packageManager`, and exposes top-level scripts (`build`, `dev`, `lint`, `clean`) that delegate to `turbo run`. Turborepo's pipeline in `turbo.json` defines three tasks:
- `build`: depends on upstream `^build` (so shared packages build first) and caches `.next/**` and `dist/**` outputs.
- `lint`: also depends on upstream `^lint`.
- `dev`: marked `cache: false` and `persistent: true` for long-running dev servers.

There is no Makefile, Dockerfile, or CI pipeline in this branch; local development and builds are entirely driven by pnpm/Turbo plus per-app tooling.

## Key files and packages

- Root orchestration: `package.json` (workspaces, top-level scripts), `turbo.json` (task graph & caching), `pnpm-workspace.yaml` (workspace membership).
- Setup helper: `scripts/setup-all.cjs` — checks Node, copies `.env.example` → `.env`/`.env.local` for mobile and admin, then runs `pnpm install`.
- Admin app (`apps/admin/package.json`): Next.js 14.2.23 with `dev` on port 3001, `build` via `next build`, `start` on port 3001, `lint` via `next lint`; consumes workspace packages `@socialpilot/tokens` and `@socialpilot/types` via `workspace:*`.
- Mobile app (`apps/mobile/package.json`): Expo Router / React Native 0.86 with `expo start`, `expo run:android|ios`, `expo start --web`, and `tsc --noEmit` for lint; uses `eas.json` for EAS Build profiles (`development`, `preview`, `production`).
- Shared packages: `packages/tokens` and `packages/types` referenced as `workspace:*` dependencies from both apps.
- Supabase backend: `supabase/config.toml` (local config placeholder), Edge Functions under `supabase/functions/`, migrations under `supabase/migrations/`, seed under `supabase/seed.sql`.
- App configs: `apps/admin/next.config.js` transpiles workspace packages and enables React Strict Mode; `apps/mobile/eas.json` pins EAS CLI ≥ 12.0.0 and defines build/submit profiles.

## Architecture and conventions

- **Monorepo layout**: `apps/` holds feature applications (Next.js admin, Expo mobile); `packages/` holds shared libraries consumed via pnpm workspace protocol; `supabase/` holds backend schema, functions, and seed data.
- **Task graph**: Turborepo enforces that shared packages (`@socialpilot/tokens`, `@socialpilot/types`) build before consumers because of the `dependsOn: ["^build"]` rule in the `build` task.
- **Caching**: Turbo caches `.next/**` and `dist/**` artifacts across runs; `dev` tasks are explicitly uncached and persistent.
- **Environment setup**: The `setup-all.cjs` script auto-generates starter `.env` files for both apps if missing, using values from each app's `.env.example`.
- **Mobile distribution**: EAS Build profiles separate development, preview, and production builds; the submit profile is defined for production submission.
- **Backend deployment model**: No containerization or server build step is present; the backend is a Supabase project managed through its CLI (migrations, edge functions, seed). There is no `docker-compose` or `Dockerfile` in this branch.

## Conventions and constraints

- **Package manager lock-in**: The root `package.json` pins `pnpm@9.0.0` via the `packageManager` field, so all contributors must use that exact pnpm version.
- **Workspace dependency resolution**: Internal packages are always referenced with the `workspace:*` specifier (e.g. `"@socialpilot/tokens": "workspace:*"`), never by semver range.
- **Transpilation of shared packages**: The Next.js admin config explicitly lists `@socialpilot/types` and `@socialpilot/tokens` in `transpilePackages`, ensuring TypeScript source in `packages/` is compiled during Next.js builds.
- **Port convention**: The admin Next.js app consistently runs on port 3001 across `dev`, `start`, and the root `admin` convenience script.
- **Mobile environment variables**: Mobile expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (prefixed with `EXPO_PUBLIC_`); the admin expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (prefixed with `NEXT_PUBLIC_`).
- **Build output locations**: Turbo treats `.next/**` (Next.js) and `dist/**` (generic TS packages) as cacheable build artifacts; consumers should emit into these directories to benefit from caching.
- **No global lint/test commands beyond Turbo**: Linting is delegated to each app (`next lint` for admin, `tsc --noEmit` for mobile); there is no unified test runner configured at the root.