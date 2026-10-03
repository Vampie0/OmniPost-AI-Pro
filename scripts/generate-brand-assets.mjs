#!/usr/bin/env node
/**
 * Generates every brand raster (mobile launcher/splash icons, admin favicon and
 * social card) from one vector mark definition.
 *
 * The launcher icon is static by necessity — no Android or iOS launcher animates
 * an app icon — so the motion lives in the launch handoff: this same mark is what
 * CosmicSocialLoader animates, so the native splash appears to come alive rather
 * than swapping to a different picture.
 *
 *   node scripts/generate-brand-assets.mjs
 *   node scripts/generate-brand-assets.mjs --grad "#00F5A0,#00D2FF,#059669" --ring "#FF5E3A,#FFAE00" --bg "#040605"
 *
 * White-label buyers rebrand with the flags above; defaults are the sunset palette
 * in packages/tokens, which is the shipped product identity.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const GLOW = arg('glow', '#FF5E3A');
const RING_A = arg('ring', '#00F5A0,#00D2FF').split(',');
const GRAD = arg('grad', '#FF5E3A,#FFAE00,#FF385C').split(',');
const BG = arg('bg', '#06070B');
const TILE_RADIUS = 192; // squircle radius on a 1024 canvas

const V = 512; // design viewBox
const C = V / 2;
const ORB_R = 92;
const RING_RX = 176;
const RING_RY = 58;
const RING_TILT = -24;

function stops(colors) {
  const n = colors.length;
  return colors
    .map((c, i) => `<stop offset="${((i / (n - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`)
    .join('');
}

/** The mark: tilted orbit passing behind and in front of a lit sphere, plus a spark. */
function markMarkup({ ringWidth = 13, planet = 13, spark = 30 } = {}) {
  // Front (lower) half of the orbit redrawn over the sphere so the ring reads 3D.
  const frontArc = `M ${C - RING_RX} ${C} A ${RING_RX} ${RING_RY} 0 0 0 ${C + RING_RX} ${C}`;
  // Point on the front arc, used to seat the orbiting body clear of the sphere.
  const t = -0.62;
  const px = C + RING_RX * Math.cos(t);
  const py = C + RING_RY * Math.sin(t);
  const rad = (RING_TILT * Math.PI) / 180;
  const rx = C + (px - C) * Math.cos(rad) - (py - C) * Math.sin(rad);
  const ry = C + (px - C) * Math.sin(rad) + (py - C) * Math.cos(rad);

  return `
  <circle cx="${C}" cy="${C}" r="188" fill="url(#glow)"/>
  <g transform="rotate(${RING_TILT} ${C} ${C})">
    <ellipse cx="${C}" cy="${C}" rx="${RING_RX}" ry="${RING_RY}" fill="none"
             stroke="url(#ring)" stroke-width="${ringWidth}" stroke-linecap="round" opacity="0.55"/>
  </g>
  <circle cx="${C}" cy="${C}" r="${ORB_R}" fill="url(#orb)"/>
  <circle cx="${C}" cy="${C}" r="${ORB_R}" fill="url(#spec)"/>
  <circle cx="${C}" cy="${C}" r="${ORB_R}" fill="url(#limb)"/>
  <g transform="rotate(${RING_TILT} ${C} ${C})">
    <path d="${frontArc}" fill="none" stroke="url(#ring)" stroke-width="${ringWidth}" stroke-linecap="round"/>
  </g>
  <circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${planet * 2.6}" fill="url(#moonGlow)"/>
  <circle cx="${rx.toFixed(1)}" cy="${ry.toFixed(1)}" r="${planet}" fill="${RING_A[1] ?? RING_A[0]}"/>
  <path transform="translate(${C - 100} ${C - 106}) scale(${(spark / 40).toFixed(4)})" fill="#FFFFFF" opacity="0.95"
        d="M 0 -40 Q 7 -7 40 0 Q 7 7 0 40 Q -7 7 -40 0 Q -7 -7 0 -40 Z"/>`;
}

function defsMarkup() {
  return `
  <linearGradient id="orb" x1="0.08" y1="0.02" x2="0.92" y2="0.98">${stops(GRAD)}</linearGradient>
  <linearGradient id="ring" x1="0.05" y1="0.95" x2="0.95" y2="0.05">${stops(RING_A)}</linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0%" stop-color="${GLOW}" stop-opacity="0.42"/>
    <stop offset="55%" stop-color="${GLOW}" stop-opacity="0.13"/>
    <stop offset="100%" stop-color="${GLOW}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="spec" cx="0.33" cy="0.26" r="0.46">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5"/>
    <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0.06"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="limb" cx="0.5" cy="0.5" r="0.5">
    <stop offset="62%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
  </radialGradient>
  <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="34%" stop-color="${RING_A[1] ?? RING_A[0]}" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="${RING_A[1] ?? RING_A[0]}" stop-opacity="0"/>
  </radialGradient>`;
}

function svg(body, size, background) {
  const plate =
    background === 'tile'
      ? `<rect width="${V}" height="${V}" rx="${(TILE_RADIUS / 2).toFixed(1)}" fill="${BG}"/>`
      : background === 'round'
        ? `<circle cx="${C}" cy="${C}" r="${C}" fill="${BG}"/>`
        : background === 'flat'
          ? `<rect width="${V}" height="${V}" fill="${BG}"/>`
          : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${V} ${V}"><defs>${defsMarkup()}</defs>${plate}${body}</svg>`;
}

/** Scale the mark about the canvas centre so it fits a target radius (design units). */
function markScaledTo(radius) {
  const s = radius / 188;
  return `<g transform="translate(${C} ${C}) scale(${s.toFixed(4)}) translate(${-C} ${-C})">${markMarkup({
    ringWidth: 13 / s,
    planet: 13 / s,
    spark: 30 / s,
  })}</g>`;
}

const TILE = markScaledTo(188);
const ADAPTIVE = markScaledTo(150); // 66/108 of the canvas stays clear of the launcher mask
const SPLASH = markScaledTo(172);

const out = [];
async function emit(file, markup, format, opaque = false) {
  const path = join(ROOT, file);
  mkdirSync(dirname(path), { recursive: true });
  // No density override: libvips renders the declared width/height at 72dpi, so
  // the SVG px size lands exactly. Raising it would upscale every raster.
  let img = sharp(Buffer.from(markup));
  // The App Store rejects an icon carrying an alpha plane, even a fully opaque one.
  if (opaque) img = img.removeAlpha();
  const buf = await img[format]({ quality: format === 'webp' ? 92 : undefined }).toBuffer();
  writeFileSync(path, buf);
  out.push(`${String(file).padEnd(74)} ${buf.length.toLocaleString()} B`);
}

// --- mobile: Expo source assets ------------------------------------------------
// icon.png is the iOS/App Store source and must be fully opaque — iOS applies its
// own mask, so the plate is full-bleed rather than a squircle with clear corners.
await emit('apps/mobile/src/assets/images/icon.png', svg(TILE, 1024, 'flat'), 'png', true);
await emit('apps/mobile/src/assets/images/adaptive-icon.png', svg(ADAPTIVE, 1024), 'png');
await emit('apps/mobile/src/assets/images/splash-icon.png', svg(SPLASH, 1024), 'png');

// --- mobile: prebuilt Android resources ---------------------------------------
const RES = 'apps/mobile/android/app/src/main/res';
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [dpi, k] of Object.entries(DENSITIES)) {
  const launcher = Math.round(48 * k);
  const foreground = Math.round(108 * k);
  await emit(`${RES}/mipmap-${dpi}/ic_launcher.webp`, svg(TILE, launcher, 'flat'), 'webp', true);
  await emit(`${RES}/mipmap-${dpi}/ic_launcher_round.webp`, svg(markScaledTo(164), launcher, 'round'), 'webp');
  await emit(`${RES}/mipmap-${dpi}/ic_launcher_foreground.webp`, svg(ADAPTIVE, foreground), 'webp');
  await emit(`${RES}/drawable-${dpi}/splashscreen_logo.png`, svg(SPLASH, Math.round(288 * k)), 'png');
}

// --- admin: web brand chrome --------------------------------------------------
mkdirSync(join(ROOT, 'apps/admin/public'), { recursive: true });
const favicon = svg(TILE, '100%', 'tile');
writeFileSync(join(ROOT, 'apps/admin/public/favicon.svg'), favicon);
out.push(`${'apps/admin/public/favicon.svg'.padEnd(74)} ${favicon.length.toLocaleString()} B`);
await emit('apps/admin/public/icon-192.png', svg(TILE, 192, 'tile'), 'png');
await emit('apps/admin/public/icon-512.png', svg(TILE, 512, 'tile'), 'png');
await emit('apps/admin/public/apple-touch-icon.png', svg(markScaledTo(170), 180, 'flat'), 'png', true);

// 1200x630 social card: mark left, wordmark right, same construction as the icon.
const OG_TAGLINE = 'MULTI-PLATFORM AI GROWTH ENGINE';
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>${defsMarkup()}
<radialGradient id="wash" cx="0.2" cy="0.5" r="0.7">
  <stop offset="0%" stop-color="${GLOW}" stop-opacity="0.2"/><stop offset="100%" stop-color="${GLOW}" stop-opacity="0"/>
</radialGradient></defs>
<rect width="1200" height="630" fill="${BG}"/><rect width="1200" height="630" fill="url(#wash)"/>
<g transform="translate(120 90) scale(0.86)">${markMarkup()}</g>
<text x="548" y="284" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="84" font-weight="700" fill="#FFFFFF">SocialPilot</text>
<text x="548" y="374" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="84" font-weight="700" fill="url(#ring)">AI Pro</text>
<text x="552" y="440" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="23" font-weight="600" letter-spacing="3.4" fill="#8E95A5">${OG_TAGLINE}</text>
</svg>`;
await emit('apps/admin/public/og-image.png', og, 'png', true);

console.log(out.join('\n'));
console.log(`\n${out.length} brand assets written.`);
