# 📜 AI Master Changelog — SocialPilot AI Pro

### Phase 1: Workspace & Shared Architecture
- Initialized Monorepo (pnpm workspaces + Turborepo).
- Created `@socialpilot/types` and `@socialpilot/tokens`.
- Deployed Supabase PostgreSQL Schema, RLS policies, triggers, and seed data.

### Phase 2 & 3: Mobile Architecture & Design System
- Configured Expo SDK 57 (RN 0.86 & React 19.2).
- Built dynamic White-Label ThemeProvider with Realtime synchronization.
- Created custom atomic components (`GlassCard`, `AnimatedButton`, `CustomInput`, `Badge`, `IconButton`, `ScreenWrapper`).
- Implemented zero-flash splash screen architecture.

### Phase 4, 5 & 6: Mobile Core Features
- Full Authentication Flow (Onboarding slides, Login, Register, Forgot Password).
- Dashboard with live credits meter and quick activity queue.
- AI Content Studio (Platform, Content Type, Tone selectors with prompt generation).
- Content Calendar & Scheduler.
- Analytics & Growth performance insights.
- User Profile with theme switching (Dark/Light/System) and account management.

### Phase 11, 12 & 13: Web Admin Control Center
- Next.js 14+ App Router foundation with Tailwind CSS and glassmorphic UI.
- Super Admin & Admin role protection guards.
- Users Directory with credit adjustments and instant suspension.
- Global Content Moderation feed.
- AI Templates CRUD engine.
- Dynamic White-Label branding engine.
- AI Models & hyperparameters configuration.
- Subscriptions revenue metrics & Push Notifications broadcast center.

### Phase 15: Marketplace Packaging
- One-command automated setup wizard (`scripts/setup-all.cjs`).
- Complete documentation guides (`INSTALLATION.md`, `ADMIN_GUIDE.md`, `MOBILE_CUSTOMIZATION.md`, `TROUBLESHOOTING.md`).

### Phase 16: Backend Sync Audit & Production Hardening
- Full end-to-end audit: every mobile/admin data call verified against Supabase tables, edge functions, storage, and env keys (0 TypeScript errors in both apps).
- New idempotent convergence migration `20240001000003_backend_sync.sql`: `ai_logs` table + owner RLS, `team_invites` table with per-inviter partial unique index, `decrement_user_credits` RPC now records daily analytics.
- Edge function `generate-content` writes `ai_logs` entries after each credit-charged generation (History vault reads real data).
- Post editor: full save/publish/delete write verification, real ISO `scheduled_at` persistence, loading/not-found states, and 401/402/403 edge-function error handling with paywall routing.
- Paywall now persists real subscriptions (`subscriptions` row + profile tier) instead of only simulating success; payment UX remains simulated by design (no PSP wired).
- Real clipboard via `expo-clipboard` in Content Studio and History vault.
- Avatar uploads: orphaned storage objects removed on replace/delete, MIME-derived file extensions.
- Auth store: per-user realtime profile channel with proper teardown on sign-out; admin analytics numbers gated behind demo mode with computed platform share.
- Dead code removed (31 unused declarations, 16 empty folders, unused scaffold script).

