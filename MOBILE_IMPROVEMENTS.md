# Mobile Improvements Backlog

> Items discovered while building the web admin panel that should be ported back to the mobile app when mobile development resumes.

## Theme & Design

1. **CSS Variable-driven theme** — Web admin uses CSS custom properties (`--color-primary`, `--gradient-primary`, etc.) that swap instantly when the palette changes. Mobile could adopt a similar pattern using `react-native-reanimated` shared values instead of re-rendering the full tree on palette change.

2. **5th palette "Stealth Titanium" onboarding preview** — When users first open the app, show all 5 palettes as selectable cards with live preview. Web will have this in the AI Settings page.

## UX Patterns

3. **Anti-spam `useSafePress` hook** — Already exists in mobile (`src/hooks/useSafePress.ts`) but should be extended with a `cooldownMs` parameter and haptic feedback integration, matching the web admin's double-click prevention pattern.

4. **Zustand persist middleware** — Mobile's `useConfigStore` and `useAuthStore` use custom async storage. Consider migrating to `zustand/middleware` `persist` with `expo-secure-store` adapter for automatic hydration and rehydration (web admin already uses this pattern).

## Architecture

5. **Mock/Real service layer** — Web admin uses a `USE_MOCK` flag with separate `mock.ts` and `supabase.ts` service files. Mobile should adopt the same pattern so the app can run in demo mode without a Supabase connection (useful for App Store review and trade shows).

6. **React Hook Form + Zod validation** — Web admin uses RHF + Zod on all forms. Mobile's auth and profile forms should migrate from raw `useState` to the same pattern for consistent validation and error handling.

7. **Tanstack Query for data fetching** — Mobile currently uses raw `useState` + `useEffect` for Supabase queries. Tanstack Query (already in the monorepo deps) provides caching, retry, background refetch, and optimistic updates out of the box.

## Performance

8. **FlashList over FlatList** — For users directory, posts feed, and templates list, `@shopify/flash-list` would provide 60fps scrolling with large datasets.

9. **Image optimization** — Web admin will use `next/image` for automatic WebP/AVIF. Mobile should adopt `expo-image` with memory management and blurhash placeholders.
