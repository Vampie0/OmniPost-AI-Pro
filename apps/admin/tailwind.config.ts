import type { Config } from 'tailwindcss';
import path from 'path';

const config: Config = {
  darkMode: ['class'],
  content: [
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx,mdx}'),
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './apps/admin/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Theme-driven semantic tokens (CSS vars set by ThemeProvider) ── */
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-subtle': 'var(--color-surface-subtle)',
        'input-bg': 'var(--color-input-bg)',
        border: 'var(--color-border)',
        'border-active': 'var(--color-border-active)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        primary: 'var(--color-primary)',
        glow: 'var(--color-glow)',
        'btn-text': 'var(--color-btn-text)',
        'badge-bg': 'var(--color-badge-bg)',
        'badge-border': 'var(--color-badge-border)',
        'badge-text': 'var(--color-badge-text)',

        /*
         * Alpha variants. Tailwind v3 cannot decompose a `var()` colour, so the
         * `/40` shorthand silently does nothing against the tokens above — each
         * translucent step has to exist as its own color-mix var in globals.css.
         */
        'primary-10': 'var(--color-primary-10)',
        'primary-15': 'var(--color-primary-15)',
        'primary-20': 'var(--color-primary-20)',
        'primary-30': 'var(--color-primary-30)',
        'primary-60': 'var(--color-primary-60)',

        'border-active-15': 'var(--color-border-active-15)',
        'border-active-20': 'var(--color-border-active-20)',
        'border-active-30': 'var(--color-border-active-30)',
        'border-active-50': 'var(--color-border-active-50)',

        'surface-50': 'var(--color-surface-50)',
        'surface-80': 'var(--color-surface-80)',
        'surface-90': 'var(--color-surface-90)',

        'surface-subtle-30': 'var(--color-surface-subtle-30)',
        'surface-subtle-40': 'var(--color-surface-subtle-40)',
        'surface-subtle-50': 'var(--color-surface-subtle-50)',
        'surface-subtle-60': 'var(--color-surface-subtle-60)',
        'surface-subtle-70': 'var(--color-surface-subtle-70)',
        'surface-subtle-80': 'var(--color-surface-subtle-80)',

        'border-40': 'var(--color-border-40)',
        'border-50': 'var(--color-border-50)',
        'border-60': 'var(--color-border-60)',
        'border-80': 'var(--color-border-80)',

        'text-muted-30': 'var(--color-text-muted-30)',

        'glow-10': 'var(--color-glow-10)',
        'glow-20': 'var(--color-glow-20)',
        'glow-25': 'var(--color-glow-25)',
        'glow-30': 'var(--color-glow-30)',

        /* ── Semantic status colors with alpha variants (from globals.css) ── */
        success: {
          DEFAULT: 'var(--color-success)',
          5: 'var(--color-success-5)',
          10: 'var(--color-success-10)',
          20: 'var(--color-success-20)',
          30: 'var(--color-success-30)',
          40: 'var(--color-success-40)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          10: 'var(--color-warning-10)',
          20: 'var(--color-warning-20)',
          30: 'var(--color-warning-30)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          5: 'var(--color-danger-5)',
          10: 'var(--color-danger-10)',
          20: 'var(--color-danger-20)',
          30: 'var(--color-danger-30)',
          40: 'var(--color-danger-40)',
          80: 'var(--color-danger-80)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
      },

      /*
       * Keyframes live in globals.css so they can read the palette CSS vars;
       * these are the only handles components need.
       */
      transitionTimingFunction: {
        'expo-out': 'var(--ease-out-expo)',
        'quint-out': 'var(--ease-out-quint)',
        'quint-inout': 'var(--ease-in-out-quint)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '900': '900ms',
      },
      animation: {
        shimmer: 'shimmer 1.8s var(--ease-in-out-quint) infinite',
        sheen: 'sheen 900ms var(--ease-out-quint)',
        'aurora-a': 'aurora-a 26s ease-in-out infinite',
        'aurora-b': 'aurora-b 34s ease-in-out infinite',
        float: 'float-y 6s ease-in-out infinite',
        'rise-in': 'rise-in 500ms var(--ease-out-expo) both',
        'scale-in': 'scale-in 350ms var(--ease-spring) both',
        'glow-pulse': 'glow-pulse 2.6s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'ping-soft': 'ping-soft 2.4s var(--ease-out-quint) infinite',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.28)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.05), 0 18px 40px -16px rgba(0,0,0,0.36)',
        'glow-sm': '0 0 14px var(--color-glow-30)',
        'glow-md': '0 0 26px var(--color-glow-30)',
        'glow-lg': '0 0 46px var(--color-glow-30)',
        'ring-primary': '0 0 0 3px var(--color-primary-20)',
        'inset-top': 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
