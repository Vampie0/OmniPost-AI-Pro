import { PaletteKey, ThemeMode, ThemeColors, LUXURY_PALETTES } from '@socialpilot/tokens';

export interface DynamicTheme {
  paletteKey: PaletteKey;
  paletteName: string;
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
}

export { LUXURY_PALETTES };
export type { PaletteKey, ThemeMode, ThemeColors };
