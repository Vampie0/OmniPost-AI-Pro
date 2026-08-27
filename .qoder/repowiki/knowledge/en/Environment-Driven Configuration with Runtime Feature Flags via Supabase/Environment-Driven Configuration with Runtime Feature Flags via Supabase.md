---
kind: configuration_system
name: Environment-Driven Configuration with Runtime Feature Flags via Supabase
category: configuration_system
scope:
    - '**'
source_files:
    - apps/admin/.env.example
    - apps/admin/src/lib/supabase.ts
    - apps/mobile/.env.example
    - apps/mobile/app.config.ts
    - apps/mobile/src/services/supabase.ts
    - apps/mobile/src/store/useConfigStore.ts
    - packages/types/src/database.ts
    - supabase/migrations/20240001000000_initial_schema.sql
---

## Overview

The repository uses a **two-tier configuration system**:

1. **Build-time / environment variables** — per-app `.env` files consumed by Next.js and Expo at build time.
2. **Runtime feature flags & app settings** — persisted in Supabase (`app_config`, `ai_config`) and loaded client-side via Supabase Realtime, enabling live updates without redeploy.

There is no centralized config loader or shared configuration library; each app reads its own environment variables directly from `process.env`.

---

## Build-Time Configuration (Environment Variables)

### Admin app (Next.js)
- File: `apps/admin/.env.example` declares `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Consumed in `apps/admin/src/lib/supabase.ts` where the Supabase client is created with those values and a placeholder fallback (`https://placeholder-url.supabase.co`).
- A derived `isPlaceholderUrl` flag is exported and used to short-circuit network calls when running locally against a dummy URL.

### Mobile app (Expo)
- File: `apps/mobile/.env.example` declares `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_APP_NAME`.
- `EXPO_PUBLIC_*` variables are read at build time by Expo and baked into the bundle.
- `app.config.ts` reads `process.env.EXPO_PUBLIC_APP_NAME` to set the app display name.
- `apps/mobile/src/services/supabase.ts` mirrors the admin pattern: reads `EXPO_PUBLIC_*` env vars, falls back to placeholder URLs, exports `isPlaceholderUrl`, and creates a Supabase client using `expo-secure-store` for session persistence on native platforms (with a web fallback to `localStorage`).

### Platform-specific overrides
- Android/iOS identifiers, package names, and icons are declared statically in `apps/mobile/app.config.ts` under `ios.*` and `android.*` blocks.
- The Supabase project itself has an empty `supabase/config.toml` (only a comment), meaning local Supabase runs rely on defaults or CLI-provided overrides.

---

## Runtime Configuration (Feature Flags & App Settings)

### Database-backed config tables
Defined in `supabase/migrations/20240001000000_initial_schema.sql`:

- **`public.app_config`** — white-label / runtime toggles: `app_name`, `logo_url`, `primary_color`, `secondary_color`, `accent_color`, `support_email`, `terms_url`, `privacy_url`, `enable_revenuecat`, `enable_social_login`, `maintenance_mode`, `updated_at`.
- **`public.ai_config`** — AI provider/model selection: `text_provider`, `text_model`, `image_provider`, `image_model`, `max_tokens`, `temperature`, `system_prompt`, `updated_at`.

Both tables have Row Level Security enabled:
- Authenticated users can SELECT `app_config` and `ai_config`.
- Only admins (via `public.is_admin()`) can modify them.

### Client-side loading and real-time sync
- `apps/mobile/src/store/useConfigStore.ts` (Zustand store) fetches `app_config` from Supabase and subscribes to `postgres_changes` on `public:app_config` so changes propagate live to clients.
- It guards against placeholder URLs: if `isPlaceholderUrl` is true, it returns early without attempting DB access or WebSocket connections, avoiding DNS timeouts during local development.
- The shape of `app_config` is typed as `AppConfig` from `packages/types/src/database.ts`, which mirrors the database schema exactly.

### Admin UI
- The admin app exposes pages under `apps/admin/src/app/(dashboard)/ai-settings/` and `settings/` that presumably write to these tables through Supabase RLS policies.

---

## Architecture & Conventions

| Concern | Mechanism | Location |
|---|---|---|
| Supabase connection | `process.env.NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` | `apps/admin/src/lib/supabase.ts`, `apps/mobile/src/services/supabase.ts` |
| App branding / runtime toggles | `app_config` table + Zustand store + realtime subscription | `supabase/migrations/..._initial_schema.sql`, `apps/mobile/src/store/useConfigStore.ts` |
| AI provider/model selection | `ai_config` table (read-only for non-admins) | `supabase/migrations/..._initial_schema.sql` |
| Build-time app metadata | `EXPO_PUBLIC_APP_NAME` | `apps/mobile/app.config.ts` |
| Type safety for config | Shared `@socialpilot/types` package | `packages/types/src/database.ts` |
| Local dev safety | Placeholder URL detection (`isPlaceholderUrl`) skips network calls | Both Supabase client modules |

Conventions observed:
- Every public-facing environment variable is prefixed (`NEXT_PUBLIC_`, `EXPO_PUBLIC_`) and documented in a `.env.example` file in the same app directory.
- Fallback placeholder values are always provided inline so apps start without errors even with missing env vars.
- Runtime configuration is intentionally kept server-backed rather than hardcoded, allowing operators to flip features (`maintenance_mode`, `enable_revenuecat`, `enable_social_login`) without deploying code.
- Config types are defined once in `packages/types` and imported by consuming apps, keeping the mobile client's view of `app_config` aligned with the database schema.

---

## Constraints & Rules

- **RLS enforcement**: `app_config` and `ai_config` are protected by Supabase Row Level Security policies — only authenticated users can read; only roles `admin` / `super_admin` (determined by `public.is_admin()`) can write. This is enforced at the database level in the migration file.
- **Realtime publication**: `app_config` is explicitly added to `supabase_realtime` publication, making live updates possible for clients that subscribe.
- **Local dev guard**: Any client that checks `isPlaceholderUrl` must skip network operations; this is a de facto contract between the Supabase client module and consumers like `useConfigStore`.
- **No secret rotation mechanism**: Secrets (Supabase URL/key) are injected purely via environment variables at build/start time; there is no runtime secret refresh path in this codebase.