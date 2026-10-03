import type { Metadata } from 'next';
import './globals.css';
import { LUXURY_PALETTES } from '@socialpilot/tokens';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ThemeSync } from '@/theme/ThemeSync';
import { AdminQueryProvider } from '@/components/providers/AdminQueryProvider';
import { GRADIENT_VARS, VAR_TO_COLOR_KEY } from '@/theme/themeVars';

export const metadata: Metadata = {
  metadataBase: new URL('https://socialpilot-admin.vercel.app'),
  title: 'SocialPilot AI Pro — Admin Control Center',
  description: 'White-Label & AI Configuration Master Dashboard',
  icons: {
    icon: ['/favicon.svg?v=1', { url: '/icon-192.png', type: 'image/png' }],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'SocialPilot AI Pro — Admin Control Center',
    description: 'White-Label & AI Configuration Master Dashboard',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'SocialPilot AI Pro' }],
    type: 'website',
  },
};

/**
 * Runs before first paint.
 *
 * ThemeProvider applies the palette in an effect, which is after the browser has
 * already painted — so every dark palette opened on a cold load flashed the
 * `#FAFAFA` fallback from globals.css and then faded to the real colour.
 *
 * It publishes into its own `<style>` element rather than writing to `<html>`.
 * The root layout renders `<html>`, so React hydrates it, and any attribute a
 * script adds there first (a `style`, a `class`) comes back as a hydration
 * mismatch. ThemeProvider finds this same element by id and updates it in place.
 */
const themeBootstrap = `
(function () {
  try {
    var PALETTES = ${JSON.stringify(LUXURY_PALETTES)};
    var VARS = ${JSON.stringify(VAR_TO_COLOR_KEY)};
    var GRADIENTS = ${JSON.stringify(GRADIENT_VARS)};
    var stored = {};
    try {
      stored = (JSON.parse(localStorage.getItem('admin-theme') || '{}').state) || {};
    } catch (e) {}
    var palette = PALETTES[stored.paletteKey] || PALETTES.sunset;
    var mode = stored.mode || 'dark';
    var isDark = mode === 'light' ? false
      : mode === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;
    var c = palette[isDark ? 'dark' : 'light'];
    var css = ':root{';
    for (var v in VARS) css += v + ':' + c[VARS[v]] + ';';
    for (var g in GRADIENTS) {
      css += g + ':linear-gradient(135deg, ' + c[GRADIENTS[g]].join(', ') + ');';
    }
    css += '}';
    var el = document.createElement('style');
    el.id = 'socialpilot-theme';
    el.textContent = css;
    document.head.appendChild(el);
  } catch (e) {
    /* Leave globals.css's fallbacks in place rather than blocking render. */
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ThemeSync />
          <AdminQueryProvider>
            {children}
          </AdminQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

