/**
 * Status colours deliberately live OUTSIDE the five palettes — the admin does the
 * exact same thing in `globals.css`, where `--color-success/warning/danger` are
 * mode-keyed ramps rather than palette fields.
 *
 * A destructive action has to read as destructive in Cyber Mint too, so these are
 * fixed per light/dark mode instead of being derived from `primary`/`accent`.
 */
export const STATUS_COLORS = {
  dark: { success: '#00F5A0', warning: '#FFAE00', danger: '#FF385C' },
  light: { success: '#059669', warning: '#D97706', danger: '#E11D48' },
} as const;

export type StatusColors = { readonly success: string; readonly warning: string; readonly danger: string };

export function statusColors(isDark: boolean): StatusColors {
  return isDark ? STATUS_COLORS.dark : STATUS_COLORS.light;
}

/**
 * Appends a hex alpha pair to a `#RRGGBB` colour — the React Native equivalent of
 * the admin's `color-mix(... 12%, transparent)` alpha tokens.
 */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const pair = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${pair}`;
}
