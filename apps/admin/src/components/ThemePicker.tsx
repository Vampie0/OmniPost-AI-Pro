'use client';

import React from 'react';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';
import { LUXURY_PALETTES, PaletteKey, ThemeMode } from '@socialpilot/tokens';
import { useThemeStore } from '@/theme/useTheme';

const PALETTE_OPTIONS: { key: PaletteKey; swatch: string }[] = [
  { key: 'sunset', swatch: '#FF5E3A' },
  { key: 'emerald', swatch: '#00F5A0' },
  { key: 'violet', swatch: '#FF2A85' },
  { key: 'azure', swatch: '#38BDF8' },
  { key: 'stealth', swatch: '#A1A1AA' },
];

const MODE_OPTIONS: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'system', label: 'System', icon: Monitor },
];

export function ThemePicker() {
  const paletteKey = useThemeStore((s) => s.paletteKey);
  const mode = useThemeStore((s) => s.mode);
  const setPalette = useThemeStore((s) => s.setPalette);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div className="space-y-6">
      {/* Palette Selector */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-3">
          Color Palette
        </label>
        <div className="grid grid-cols-5 gap-3">
          {PALETTE_OPTIONS.map(({ key, swatch }) => {
            const isActive = paletteKey === key;
            const palette = LUXURY_PALETTES[key];
            return (
              <button
                key={key}
                onClick={() => setPalette(key)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'border-active bg-surface-subtle'
                    : 'border-border bg-input-bg hover:border-active-50'
                }`}
              >
                {/* Swatch */}
                <div
                  className="w-10 h-10 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: swatch,
                    borderColor: isActive ? 'var(--color-border-active)' : 'transparent',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                {isActive && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: swatch }}
                  >
                    <Check className="w-2.5 h-2.5 text-btn-text" />
                  </div>
                )}
                <span className={`text-xs font-semibold ${isActive ? 'text-text-primary' : 'text-text-muted'}`}>
                  {palette.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Toggle */}
      <div>
        <label className="block text-sm font-semibold text-text-secondary mb-3">
          Appearance Mode
        </label>
        <div className="flex gap-2">
          {MODE_OPTIONS.map(({ key, label, icon: Icon }) => {
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-active bg-surface-subtle text-text-primary'
                    : 'border-border bg-input-bg text-text-muted hover:text-text-secondary hover:border-active-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-4 rounded-xl bg-surface-subtle border border-border">
        <div className="flex items-center gap-3 mb-3">
          <Palette className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-8 rounded-lg" style={{ background: 'var(--gradient-primary)' }} />
          <div className="flex-1 h-8 rounded-lg" style={{ background: 'var(--gradient-secondary)' }} />
          <div className="flex-1 h-8 rounded-lg" style={{ background: 'var(--gradient-accent)' }} />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-6 rounded-md bg-bg border border-border" />
          <div className="flex-1 h-6 rounded-md bg-surface border border-border" />
          <div className="flex-1 h-6 rounded-md bg-surface-subtle border border-border" />
        </div>
      </div>
    </div>
  );
}

/** Compact dark/light toggle for the header */
export function ThemeModeToggle() {
  const isDark = useThemeStore((s) => s.isDark);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const toggle = () => {
    if (mode === 'system') {
      setMode(isDark ? 'light' : 'dark');
    } else {
      setMode(isDark ? 'light' : 'dark');
    }
  };

  const Icon = isDark ? Moon : Sun;

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 bg-surface-subtle border border-border px-3 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:border-active-50 transition"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon className="w-4 h-4 text-primary" />
      <span className="capitalize">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
