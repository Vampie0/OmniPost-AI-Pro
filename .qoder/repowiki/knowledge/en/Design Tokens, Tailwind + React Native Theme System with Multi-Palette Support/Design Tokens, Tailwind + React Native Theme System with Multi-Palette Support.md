---
kind: frontend_style
name: Design Tokens, Tailwind + React Native Theme System with Multi-Palette Support
category: frontend_style
scope:
    - '**'
source_files:
    - packages/tokens/src/index.ts
    - apps/mobile/src/theme/index.ts
    - apps/mobile/src/theme/ThemeProvider.tsx
    - apps/mobile/src/constants/index.ts
    - apps/admin/tailwind.config.ts
    - apps/admin/postcss.config.js
    - apps/admin/src/app/globals.css
---

## What system/approach is used

The monorepo uses a **two-tier frontend styling architecture**:

- **Admin app (Next.js)**: Styled via **Tailwind CSS v3** with `darkMode: 'class'`, PostCSS + Autoprefixer, and custom brand color extensions. Global styles live in `apps/admin/src/app/globals.css` using the standard `@tailwind base/components/utilities` directives.
- **Mobile app (Expo/React Native)**: Styled via a **custom theme system** built on a shared TypeScript design-token package (`@socialpilot/tokens`). The mobile app does not use CSS-in-JS or Tailwind; instead it consumes typed palette objects and switches between dark/light/system modes at runtime.

Both apps share a single source of truth for colors through the `packages/tokens` workspace package, which exports typed palettes consumed by the mobile app and referenced conceptually by the admin's Tailwind config.

## Key files and packages

- `packages/tokens/src/index.ts` — Central design token library exporting `PaletteKey`, `ThemeMode`, `ThemeColors` types and the `LUXURY_PALETTES` record containing five complete color schemes (sunset, emerald, violet, azure, stealth), each with `dark` and `light` variants including gradients, glassmorphism tokens, badge colors, and glow values.
- `apps/mobile/src/theme/index.ts` — Re-exports token types and defines the `DynamicTheme` interface that wraps a selected palette with mode metadata.
- `apps/mobile/src/theme/ThemeProvider.tsx` — React Context provider that manages active palette, theme mode (`dark` | `light` | `system`), persists selections to `expo-secure-store` under keys defined in `STORAGE_KEYS`, and merges Admin-configured white-label overrides (`primary_color`, `secondary_color`, `accent_color`) into the active theme.
- `apps/mobile/src/constants/index.ts` — Defines `STORAGE_KEYS` (`sp_theme_mode`, `sp_palette_key`, `sp_app_config_cache`, etc.) and global branding constants.
- `apps/admin/tailwind.config.ts` — Extends Tailwind theme with `brand.*` (orange, amber, rose, cyan, mint) and `obsidian.*` (950–700) color scales; enables class-based dark mode.
- `apps/admin/postcss.config.js` — Configures Tailwind + Autoprefixer pipeline.
- `apps/admin/src/app/globals.css` — Root CSS variables (`--radius`), body defaults (dark background `#020617`, light text `#F8FAFC`), and reusable `.glass-panel` / `.glass-card` utility classes implementing glassmorphism via `backdrop-filter: blur()`.

## Architecture and conventions

### Design tokens as a shared workspace package
The `@socialpilot/tokens` package is published from `packages/tokens` with `main` and `types` both pointing at `src/index.ts`. It exposes a strict type contract (`PaletteKey`, `ThemeMode`, `ThemeColors`) so any consumer must pick from the predefined set of five palettes. Each palette contains a full surface hierarchy (`background`, `surface`, `surfaceSubtle`, `inputBg`), typography tokens (`textPrimary`, `textSecondary`, `textMuted`), interactive states (`borderActive`), gradient arrays (`primaryGradient`, `secondaryGradient`, `accentGradient`, `laserGlow`), and UI-specific tokens (`badgeBg`, `cardGlass`, `glowColor`, `btnTextColor`).

### Mobile theme runtime
The `ThemeProvider` resolves the active theme by combining three inputs: the user-selected `paletteKey`, the persisted `themeMode`, and the system color scheme when mode is `system`. It then optionally overlays white-label overrides pulled from `useConfigStore` (app-level `primary_color`, `secondary_color`, `accent_color`), allowing the Admin app to rebrand the mobile app dynamically without code changes. Theme state is persisted via `SecureStore` and toggling triggers haptic feedback via `expo-haptics`.

### Admin styling approach
The Next.js admin uses conventional Tailwind utility classes throughout components, with brand colors extended via the `brand.*` namespace and a dark-first `obsidian.*` scale for backgrounds. Custom CSS in `globals.css` adds glassmorphism utilities (`glass-panel`, `glass-card`) and a thin scrollbar style. Dark mode is controlled via the `class` strategy, meaning consumers toggle a `dark` class on the root element rather than relying on media queries.

### Responsive strategy
- Admin: Relies on Tailwind's responsive breakpoints natively (no custom breakpoints are configured).
- Mobile: Uses Expo/React Native layout primitives; no CSS media queries are involved.

## Conventions and constraints

- **All mobile colors must come from `LUXURY_PALETTES`**: The `PaletteKey` union type restricts palettes to the five predefined options (`sunset`, `emerald`, `violet`, `azure`, `stealth`). Hardcoded color literals should be avoided in favor of consuming `theme.colors` from `useTheme()`.
- **Theme persistence is mandatory for user preferences**: Palette and mode changes are written to `SecureStore` using the keys in `STORAGE_KEYS`; new themes should follow this pattern to survive app restarts.
- **White-label overrides take precedence**: When `appConfig.primary_color` / `secondary_color` / `accent_color` are present, they replace the corresponding palette values in the active theme. This is the mechanism by which the Admin app can rebrand the mobile app at runtime.
- **Dark-mode class strategy in Admin**: Because `darkMode: 'class'` is enabled in `tailwind.config.ts`, dark mode must be activated by adding/removing a `dark` class on an ancestor element; it cannot rely on OS preference alone.
- **Brand color palette is fixed**: The `brand.*` and `obsidian.*` scales in `apps/admin/tailwind.config.ts` are the only allowed brand colors for the admin UI; extending them requires editing the Tailwind config.
- **Glassmorphism is provided via utility classes**: New frosted-glass surfaces should reuse `.glass-panel` or `.glass-card` from `globals.css` rather than defining ad-hoc `backdrop-filter` rules.