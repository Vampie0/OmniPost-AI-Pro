import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LUXURY_PALETTES, PaletteKey, ThemeMode, ThemeColors } from '@socialpilot/tokens';

interface ThemeState {
  paletteKey: PaletteKey;
  mode: ThemeMode;
  isDark: boolean;
  systemIsDark: boolean;
  colors: ThemeColors;
  setPalette: (key: PaletteKey) => void;
  setMode: (mode: ThemeMode) => void;
  setSystemIsDark: (isDark: boolean) => void;
}

function resolveColors(paletteKey: PaletteKey, isDark: boolean): ThemeColors {
  const palette = LUXURY_PALETTES[paletteKey] ?? LUXURY_PALETTES.sunset;
  return isDark ? palette.dark : palette.light;
}

function computeIsDark(mode: ThemeMode, systemIsDark: boolean): boolean {
  if (mode === 'system') return systemIsDark;
  return mode === 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      paletteKey: 'sunset',
      mode: 'dark',
      isDark: true,
      systemIsDark: true,
      colors: resolveColors('sunset', true),

      setPalette: (key) => {
        const { mode, systemIsDark } = get();
        const isDark = computeIsDark(mode, systemIsDark);
        set({ paletteKey: key, colors: resolveColors(key, isDark) });
      },

      setMode: (mode) => {
        const { paletteKey, systemIsDark } = get();
        const isDark = computeIsDark(mode, systemIsDark);
        set({ mode, isDark, colors: resolveColors(paletteKey, isDark) });
      },

      setSystemIsDark: (systemIsDark) => {
        const { paletteKey, mode } = get();
        if (mode !== 'system') {
          set({ systemIsDark });
          return;
        }
        const isDark = systemIsDark;
        set({ systemIsDark, isDark, colors: resolveColors(paletteKey, isDark) });
      },
    }),
    {
      name: 'admin-theme',
      partialize: (state) => ({
        paletteKey: state.paletteKey,
        mode: state.mode,
      }),
    },
  ),
);

/** Convenience hook matching mobile useTheme API */
export function useTheme() {
  const { paletteKey, mode, isDark, colors } = useThemeStore();
  const palette = LUXURY_PALETTES[paletteKey] ?? LUXURY_PALETTES.sunset;
  return {
    paletteKey,
    paletteName: palette.name,
    mode,
    isDark,
    colors,
  };
}
