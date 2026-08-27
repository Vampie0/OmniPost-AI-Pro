'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useThemeStore } from './useTheme';

/**
 * Renders the Toaster inside ThemeProvider so it can react
 * to the active dark/light mode dynamically.
 * Deferred to client-side only to prevent SSR prerender failures.
 */
export function ThemeSync() {
  const [mounted, setMounted] = useState(false);
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Toaster
      position="top-right"
      richColors
      theme={isDark ? 'dark' : 'light'}
    />
  );
}
