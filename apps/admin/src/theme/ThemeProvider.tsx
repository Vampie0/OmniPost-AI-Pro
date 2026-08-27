'use client';

import React, { useEffect } from 'react';
import { useThemeStore } from './useTheme';

/**
 * Applies theme colors as CSS custom properties on <html>,
 * toggles the `dark` class for Tailwind's class-based dark mode,
 * and listens for OS color-scheme changes when mode is `system`.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colors = useThemeStore((s) => s.colors);
  const isDark = useThemeStore((s) => s.isDark);
  const setSystemIsDark = useThemeStore((s) => s.setSystemIsDark);

  // Listen for OS color-scheme changes (mirrors mobile's useColorScheme)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemIsDark(e.matches);
    };

    // Set initial system preference
    handler(mql);

    mql.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mql.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, [setSystemIsDark]);

  // Toggle dark class on <html> + inject CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Tailwind dark-mode class toggle
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const set = (k: string, v: string) => root.style.setProperty(k, v);

    // Surfaces
    set('--color-bg', colors.background);
    set('--color-surface', colors.surface);
    set('--color-surface-subtle', colors.surfaceSubtle);
    set('--color-input-bg', colors.inputBg);

    // Borders
    set('--color-border', colors.border);
    set('--color-border-active', colors.borderActive);

    // Text
    set('--color-text-primary', colors.textPrimary);
    set('--color-text-secondary', colors.textSecondary);
    set('--color-text-muted', colors.textMuted);

    // Brand
    set('--color-primary', colors.primary);
    set('--color-glow', colors.glowColor);
    set('--color-btn-text', colors.btnTextColor);

    // Cards / Glass
    set('--color-card-glass', colors.cardGlass);
    set('--color-card-glass-border', colors.cardGlassBorder);

    // Badges
    set('--color-badge-bg', colors.badgeBg);
    set('--color-badge-border', colors.badgeBorder);
    set('--color-badge-text', colors.badgeText);

    // Gradients
    set('--gradient-primary', `linear-gradient(135deg, ${colors.primaryGradient.join(', ')})`);
    set('--gradient-secondary', `linear-gradient(135deg, ${colors.secondaryGradient.join(', ')})`);
    set('--gradient-accent', `linear-gradient(135deg, ${colors.accentGradient.join(', ')})`);
  }, [colors, isDark]);

  return <div className="min-h-screen">{children}</div>;
}
