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

        /* ── Alpha variants (color-mix derived in globals.css) ── */
        'primary-10': 'var(--color-primary-10)',
        'border-active-30': 'var(--color-border-active-30)',
        'border-active-50': 'var(--color-border-active-50)',
        'surface-subtle-30': 'var(--color-surface-subtle-30)',
        'surface-subtle-50': 'var(--color-surface-subtle-50)',
        'surface-subtle-60': 'var(--color-surface-subtle-60)',
        'glow-30': 'var(--color-glow-30)',

        /* ── Semantic status colors with alpha variants (from globals.css) ── */
        success: {
          DEFAULT: 'var(--color-success)',
          10: 'var(--color-success-10)',
          20: 'var(--color-success-20)',
          30: 'var(--color-success-30)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          10: 'var(--color-warning-10)',
          20: 'var(--color-warning-20)',
          30: 'var(--color-warning-30)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          10: 'var(--color-danger-10)',
          20: 'var(--color-danger-20)',
          30: 'var(--color-danger-30)',
          80: 'var(--color-danger-80)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-accent': 'var(--gradient-accent)',
      },
    },
  },
  plugins: [],
};

export default config;