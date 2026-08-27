import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LUXURY_PALETTES, PaletteKey, ThemeMode, DynamicTheme } from './index';
import { useConfigStore } from '@/store/useConfigStore';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants';
import * as Haptics from 'expo-haptics';

interface ThemeContextType {
  theme: DynamicTheme;
  paletteKey: PaletteKey;
  themeMode: ThemeMode;
  setPalette: (palette: PaletteKey) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [paletteKey, setPaletteKeyState] = useState<PaletteKey>('sunset');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const appConfig = useConfigStore((state) => state.config);

  useEffect(() => {
    // Load persisted palette and mode
    Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.PALETTE_KEY),
      SecureStore.getItemAsync(STORAGE_KEYS.THEME_MODE),
    ]).then(([savedPalette, savedMode]) => {
      if (savedPalette && savedPalette in LUXURY_PALETTES) {
        setPaletteKeyState(savedPalette as PaletteKey);
      }
      if (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system') {
        setThemeModeState(savedMode);
      }
    });
  }, []);

  const setPalette = async (palette: PaletteKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPaletteKeyState(palette);
    await SecureStore.setItemAsync(STORAGE_KEYS.PALETTE_KEY, palette);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setThemeModeState(mode);
    await SecureStore.setItemAsync(STORAGE_KEYS.THEME_MODE, mode);
  };

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme !== 'light';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const activeTheme = useMemo((): DynamicTheme => {
    const selectedPalette = LUXURY_PALETTES[paletteKey] || LUXURY_PALETTES.sunset;
    const baseColors = isDark ? selectedPalette.dark : selectedPalette.light;

    // Dynamic White-Label override from Admin if configured
    const primary = appConfig?.primary_color || baseColors.primary;
    const secondary = appConfig?.secondary_color || baseColors.secondaryGradient[0];
    const accent = appConfig?.accent_color || baseColors.accentGradient[0];

    return {
      paletteKey,
      paletteName: selectedPalette.name,
      mode: themeMode,
      isDark,
      colors: {
        ...baseColors,
        primary,
        primaryGradient: appConfig?.primary_color
          ? [primary, baseColors.primaryGradient[1] ?? primary, ...baseColors.primaryGradient.slice(2)] as readonly [string, string, ...string[]]
          : baseColors.primaryGradient,
        secondaryGradient: appConfig?.secondary_color
          ? [secondary, baseColors.secondaryGradient[1] ?? secondary, ...baseColors.secondaryGradient.slice(2)] as readonly [string, string, ...string[]]
          : baseColors.secondaryGradient,
        accentGradient: appConfig?.accent_color
          ? [accent, baseColors.accentGradient[1] ?? accent, ...baseColors.accentGradient.slice(2)] as readonly [string, string, ...string[]]
          : baseColors.accentGradient,
      },
    };
  }, [paletteKey, isDark, themeMode, appConfig]);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, paletteKey, themeMode, setPalette, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
