'use client';

import React, { useEffect } from 'react';
import { useThemeStore } from './useTheme';
import { applyThemeCss, buildThemeCss } from './themeVars';

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

  // Toggle dark class on <html> and publish the palette's CSS variables
  useEffect(() => {
    const root = document.documentElement;

    // Tailwind dark-mode class toggle
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    applyThemeCss(buildThemeCss(colors));
  }, [colors, isDark]);

  return <div className="min-h-screen">{children}</div>;
}
