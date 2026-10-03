import type { ThemeColors } from '@socialpilot/tokens';

/**
 * The single mapping from palette fields to CSS custom properties.
 *
 * Both `ThemeProvider` (runtime) and the pre-paint script in `app/layout.tsx`
 * read this, so the two can never drift. The inline script gets it serialised as
 * plain data — it is far safer to ship a map than to try to ship a function.
 */
export const VAR_TO_COLOR_KEY: Record<string, keyof ThemeColors> = {
  '--color-bg': 'background',
  '--color-surface': 'surface',
  '--color-surface-subtle': 'surfaceSubtle',
  '--color-input-bg': 'inputBg',
  '--color-border': 'border',
  '--color-border-active': 'borderActive',
  '--color-text-primary': 'textPrimary',
  '--color-text-secondary': 'textSecondary',
  '--color-text-muted': 'textMuted',
  '--color-primary': 'primary',
  '--color-glow': 'glowColor',
  '--color-btn-text': 'btnTextColor',
  '--color-card-glass': 'cardGlass',
  '--color-card-glass-border': 'cardGlassBorder',
  '--color-badge-bg': 'badgeBg',
  '--color-badge-border': 'badgeBorder',
  '--color-badge-text': 'badgeText',
};

/** Gradient vars are built by joining a palette array into a CSS stop list. */
export const GRADIENT_VARS: Record<string, keyof ThemeColors> = {
  '--gradient-primary': 'primaryGradient',
  '--gradient-secondary': 'secondaryGradient',
  '--gradient-accent': 'accentGradient',
};

export function buildThemeCss(colors: ThemeColors): string {
  const lines: string[] = [];
  for (const [cssVar, key] of Object.entries(VAR_TO_COLOR_KEY)) {
    lines.push(`${cssVar}:${String(colors[key])};`);
  }
  for (const [cssVar, key] of Object.entries(GRADIENT_VARS)) {
    const stops = colors[key] as readonly string[];
    lines.push(`${cssVar}:linear-gradient(135deg, ${stops.join(', ')});`);
  }
  return `:root{${lines.join('')}}`;
}

/**
 * Theme values are published through a dedicated `<style>` element rather than
 * inline styles on `<html>`.
 *
 * The root layout renders `<html>`, so React hydrates it — any attribute a script
 * adds there before hydration (a `style`, a `class`) shows up as an extra
 * attribute and trips a hydration mismatch. A stylesheet the app owns is mutated
 * instead, which React never compares.
 */
export const THEME_STYLE_ID = 'socialpilot-theme';

export function applyThemeCss(css: string): void {
  let el = document.getElementById(THEME_STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = THEME_STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== css) el.textContent = css;
}
