---
kind: error_handling
name: Error Handling in SocialPilot AI Pro Monorepo
category: error_handling
scope:
    - '**'
source_files:
    - supabase/functions/generate-content/index.ts
    - supabase/functions/generate-image/index.ts
    - apps/mobile/src/store/useAuthStore.ts
    - apps/mobile/src/store/useConfigStore.ts
    - apps/mobile/src/services/supabase.ts
    - apps/mobile/src/components/atoms/CustomToast.tsx
    - apps/mobile/src/hooks/useSafePress.ts
    - packages/types/src/api.ts
---

## Overview

This monorepo implements a lightweight, ad-hoc error handling strategy across its three main layers: Supabase Edge Functions (Deno), the Next.js admin app, and the React Native mobile app. There is no centralized error type system or shared error middleware; instead, each layer uses idiomatic patterns for its runtime.

## Backend — Supabase Edge Functions (Deno)

Both `supabase/functions/generate-content/index.ts` and `supabase/functions/generate-image/index.ts` follow an identical pattern:

- **Per-request try/catch**: The entire handler body is wrapped in a single `try { ... } catch (error) { ... }` block that returns a `Response` with `{ error: error.message }` and HTTP status `500`.
- **Structured validation errors**: Missing/invalid input returns `{ error: '<message>' }` with explicit status codes (`401 Unauthorized`, `400 Bad Request`).
- **Auth guard via Supabase client**: Each function calls `supabaseClient.auth.getUser()` and checks the returned `error` field; if present or user is missing, it short-circuits with `401`.
- **CORS headers** are attached to every response (success and error).
- No custom error classes, error codes, or structured error payloads beyond a flat `error` string.

## Mobile App — React Native (Expo)

### Store-level error swallowing
In `apps/mobile/src/store/useAuthStore.ts` and `apps/mobile/src/store/useConfigStore.ts`, async operations against Supabase are wrapped in `try/catch` blocks that silently set `isLoading = false` on failure. Errors are not surfaced to callers or UI — they are treated as transient network/storage failures.

### Placeholder-mode bypass
A global `isPlaceholderUrl` flag (exported from `apps/mobile/src/services/supabase.ts`) lets the app skip all network calls when running against a dummy Supabase URL, preventing timeouts during development. Stores check this flag before making requests or subscribing to realtime channels.

### Toast-based user-facing errors
User-visible feedback is delivered through `apps/mobile/src/components/atoms/CustomToast.tsx`, which provides a `ToastProvider` / `useToast` context supporting three types: `'success'`, `'error'`, and `'info'`. Error toasts use a red border and `AlertCircle` icon. This is the only user-facing error presentation mechanism found in the codebase.

### Hook-level safety
`apps/mobile/src/hooks/useSafePress.ts` wraps touch handlers in `try/call` to prevent crashes from invalid navigation targets.

## Admin App — Next.js

The admin app's `src/lib/utils.ts` contains only a CSS class utility (`cn`). No server-side error handling, API route error middleware, or client-side error boundaries were found in the scanned files. The admin pages appear to be mostly static page components without visible error-handling logic in the current snapshot.

## Shared Types

`packages/types/src/api.ts` defines a generic `ApiResponse<T>` shape with `data`, `error: string | null`, and `status: number` fields. However, the Supabase Edge Functions do not return responses conforming to this shape — they return raw JSON objects like `{ result }`, `{ image_url }`, or `{ error }`, so the type is unused by the backend.

## Conventions Observed

| Area | Convention | Evidence |
|---|---|---|
| Deno Edge Functions | Wrap handler in try/catch; return `{ error: message }` with numeric HTTP status | Both generate-* functions |
| Validation | Return 400/401 with plain `{ error }` JSON | Input checks in Edge Functions |
| Mobile stores | Silent `try/catch` + reset loading state | useAuthStore, useConfigStore |
| Mobile UI | Use `useToast().showToast({ type: 'error', ... })` for user-facing errors | CustomToast component |
| Dev mode | Skip network calls when `isPlaceholderUrl` is true | supabase.ts + store guards |
| Auth | Check Supabase client `error` field per request | Edge Functions auth guard |

## Constraints & Gaps

- No shared error class hierarchy or sentinel errors exist in the repo.
- No global error boundary (React) or unhandled promise rejection handler was detected.
- Error messages are plain strings — no error codes, categories, or machine-readable error taxonomy.
- The `ApiResponse<T>` type in `@socialpilot/types` is not adopted by the Edge Functions, indicating a gap between shared typing and actual implementations.