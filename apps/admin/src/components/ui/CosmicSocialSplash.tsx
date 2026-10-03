'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Video,
  Sparkles,
} from 'lucide-react';

/**
 * The orbit numbers below are mirrored in
 * apps/mobile/src/components/atoms/CosmicSocialLoader.tsx — change one, change
 * the other, or the splash stops reading as the same loader on web and app.
 */
const PERSPECTIVE = 700; // camera focal length, px
const STAGE = 400; // orrery container, px
const CENTER = STAGE / 2;

interface OrbitSpec {
  id: string;
  name: string;
  radiusX: number;
  radiusY: number;
  /** deg — how far the orbit plane tips out of the sky plane */
  inclination: number;
  /** deg — where that tipped plane points inside the sky plane */
  node: number;
  /** deg — starting position on the orbit */
  phase: number;
  /** seconds per revolution */
  period: number;
  direction: 1 | -1;
  colors: [string, string, string];
  glow: string;
  size: number;
  icon: React.ReactNode;
}

const ORBITS: OrbitSpec[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    radiusX: 112,
    radiusY: 112,
    inclination: 66,
    node: -14,
    phase: 0,
    period: 13,
    direction: 1,
    colors: ['#E1306C', '#F56040', '#FCAF45'],
    glow: '#E1306C',
    size: 34,
    icon: <Instagram className="w-4 h-4 text-white" />,
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    radiusX: 134,
    radiusY: 134,
    inclination: 52,
    node: 54,
    phase: 72,
    period: 16.5,
    direction: -1,
    colors: ['#00F0FF', '#1DA1F2', '#0A84FF'],
    glow: '#00F0FF',
    size: 32,
    icon: <Twitter className="w-4 h-4 text-black" />,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    radiusX: 98,
    radiusY: 98,
    inclination: 74,
    node: 116,
    phase: 144,
    period: 11.5,
    direction: 1,
    colors: ['#0A66C2', '#0077B5', '#38BDF8'],
    glow: '#0A66C2',
    size: 31,
    icon: <Linkedin className="w-4 h-4 text-white" />,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    radiusX: 148,
    radiusY: 132,
    inclination: 44,
    node: -62,
    phase: 216,
    period: 18,
    direction: -1,
    colors: ['#FF0050', '#00F2FE', '#FF385C'],
    glow: '#FF0050',
    size: 35,
    icon: <Video className="w-4 h-4 text-white" />,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    radiusX: 120,
    radiusY: 120,
    inclination: 60,
    node: 154,
    phase: 288,
    period: 15,
    direction: 1,
    colors: ['#1877F2', '#3B5998', '#4F46E5'],
    glow: '#1877F2',
    size: 30,
    icon: <Facebook className="w-4 h-4 text-white" />,
  },
];

/** Half-depth of an orbit — used to normalise the front/back cues. */
function orbitDepth(o: OrbitSpec) {
  return o.radiusY * Math.sin((o.inclination * Math.PI) / 180);
}

/**
 * Project one point of an orbit plane to screen space.
 *
 * A planet sits on a circle inside its own plane; that plane is tipped about the
 * X axis by `inclination` (which is what creates real depth) and then swung about
 * the view axis by `node`. Two orbits with the same inclination but different
 * `node` are therefore revolutions about genuinely different axes.
 */
function project(o: OrbitSpec, thetaDeg: number) {
  const t = (thetaDeg * Math.PI) / 180;
  const inc = (o.inclination * Math.PI) / 180;
  const node = (o.node * Math.PI) / 180;

  const inPlaneX = Math.cos(t) * o.radiusX;
  const inPlaneY = Math.sin(t) * o.radiusY;

  const tippedY = inPlaneY * Math.cos(inc);
  const z = inPlaneY * Math.sin(inc);

  const x = inPlaneX * Math.cos(node) - tippedY * Math.sin(node);
  const y = inPlaneX * Math.sin(node) + tippedY * Math.cos(node);

  // Near things (z > 0) are thrown outward and enlarged by the camera.
  const k = PERSPECTIVE / (PERSPECTIVE - z);
  return { x: x * k, y: y * k, scale: k, z };
}

/** A trail is the same projection, swept once around the plane. */
function trailPath(o: OrbitSpec) {
  const steps = 96;
  const parts: string[] = [];
  for (let s = 0; s <= steps; s++) {
    const p = project(o, (s / steps) * 360);
    parts.push(`${s === 0 ? 'M' : 'L'}${(CENTER + p.x).toFixed(2)} ${(CENTER + p.y).toFixed(2)}`);
  }
  return `${parts.join(' ')} Z`;
}

const STAR_DUST = [
  { top: '12%', left: '18%', size: 3, delay: 0, duration: 2.4 },
  { top: '22%', left: '82%', size: 2, delay: 0.4, duration: 2.9 },
  { top: '78%', left: '15%', size: 3, delay: 0.8, duration: 3.2 },
  { top: '85%', left: '76%', size: 2.5, delay: 0.2, duration: 2.6 },
  { top: '48%', left: '6%', size: 2, delay: 1.1, duration: 3.5 },
  { top: '42%', left: '92%', size: 3, delay: 0.6, duration: 2.8 },
  { top: '15%', left: '50%', size: 2, delay: 0.3, duration: 2.3 },
  { top: '88%', left: '46%', size: 2, delay: 0.9, duration: 3.1 },
];

export interface CosmicSocialSplashProps {
  onFinish?: () => void;
  durationMs?: number;
  appName?: string;
  tagline?: string;
  minimal?: boolean;
}

export function CosmicSocialSplash({
  onFinish,
  durationMs = 2600,
  appName = 'SocialPilot AI Pro',
  tagline = 'Autonomous Multi-Platform Growth Suite',
  minimal = false,
}: CosmicSocialSplashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const planetRefs = useRef<(HTMLDivElement | null)[]>([]);

  const trails = useMemo(() => ORBITS.map(trailPath), []);

  useEffect(() => {
    if (!durationMs || durationMs <= 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish?.();
      }, 450);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onFinish]);

  /**
   * One frame loop writing straight to the DOM. Driving this from React state
   * re-renders every planet on every frame, which cannot hold 60fps once the
   * revolutions are slow enough to actually read as orbits.
   */
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const isFront: (boolean | undefined)[] = [];

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;

      ORBITS.forEach((o, idx) => {
        const el = planetRefs.current[idx];
        if (!el) return;

        const p = project(o, o.phase + o.direction * (elapsed / o.period) * 360);
        const near = (p.z / orbitDepth(o) + 1) / 2; // 0 = far side, 1 = near side

        const front = p.z >= 0;
        if (isFront[idx] !== front) {
          isFront[idx] = front;
          el.style.zIndex = front ? '30' : '12';
        }

        el.style.transform = `translate(-50%, -50%) translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) scale(${p.scale.toFixed(4)})`;
        el.style.opacity = (0.5 + 0.5 * near).toFixed(3);
      });

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-bg overflow-hidden select-none pb-24"
        >
          {/* Ambient wash, derived from the active palette's glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 28%, color-mix(in srgb, var(--color-glow) 20%, transparent) 0%, transparent 62%)',
            }}
          />

          {/* Twinkling star dust */}
          {STAR_DUST.map((star, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{ opacity: [0.18, 0.75, 0.18], scale: [0.8, 1.25, 0.8] }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                delay: star.delay,
                ease: 'easeInOut',
              }}
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                background: 'var(--color-glow)',
              }}
              className="absolute rounded-full"
            />
          ))}

          {/* ── The orrery ── */}
          <div
            className="relative flex items-center justify-center"
            style={{ width: STAGE, height: STAGE }}
          >
            {/* Orbit planes, projected exactly as the planets travel them */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={STAGE}
              height={STAGE}
              aria-hidden="true"
            >
              {ORBITS.map((o, idx) => (
                <motion.path
                  key={o.id}
                  d={trails[idx]}
                  fill="none"
                  stroke={o.glow}
                  strokeWidth={1}
                  strokeDasharray="4 7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.26 }}
                  transition={{ duration: 0.9, delay: 0.1 + idx * 0.08 }}
                />
              ))}
            </svg>

            {/* Planets */}
            {ORBITS.map((o, idx) => (
              <div
                key={o.id}
                ref={(el) => {
                  planetRefs.current[idx] = el;
                }}
                role="img"
                aria-label={o.name}
                className="absolute top-1/2 left-1/2 pointer-events-none will-change-transform"
                style={{ opacity: 0 }}
              >
                <div
                  className="rounded-full flex items-center justify-center relative overflow-hidden"
                  style={{
                    width: o.size,
                    height: o.size,
                    background: `linear-gradient(135deg, ${o.colors.join(', ')})`,
                    boxShadow: `0 0 18px ${o.glow}99, 0 6px 14px rgba(0,0,0,0.45)`,
                  }}
                >
                  <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/60 rounded-full -rotate-[25deg]" />
                  {o.icon}
                </div>
              </div>
            ))}

            {/* Central brand mark */}
            <div className="relative z-[22] flex items-center justify-center">
              <div
                className="absolute w-36 h-36 rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle, color-mix(in srgb, var(--color-glow) 45%, transparent) 0%, transparent 68%)',
                }}
              />

              {/* The mark's own equatorial ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                className="absolute w-24 h-24 rounded-full border-[1.5px] border-dashed pointer-events-none"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-glow) 45%, transparent)',
                  transform: 'rotateX(72deg)',
                }}
              />

              <motion.div
                animate={{ scale: [1, 1.075, 1] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-full relative flex items-center justify-center overflow-hidden"
                style={{
                  backgroundImage: 'var(--gradient-primary)',
                  boxShadow:
                    '0 0 38px color-mix(in srgb, var(--color-glow) 65%, transparent), 0 12px 26px rgba(0,0,0,0.5)',
                }}
              >
                <div className="absolute top-1.5 left-2.5 w-4 h-1.5 bg-white/55 rounded-full -rotate-[22deg]" />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 46%)',
                  }}
                />
                <Sparkles className="w-7 h-7 relative z-10" style={{ color: 'var(--color-btn-text)' }} />
              </motion.div>
            </div>
          </div>

          {/* Brand titles */}
          {!minimal && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.7 }}
              className="text-center mt-2 z-20 px-6"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary flex items-center justify-center gap-2">
                <span>{appName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-badge-text bg-badge-bg border border-badge-border px-2 py-0.5 rounded-full">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-text-secondary mt-1.5 tracking-wide">
                {tagline}
              </p>
            </motion.div>
          )}

          {/* Status pill */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-border bg-surface">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--color-primary)' }}
              />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-text-primary">
                Initializing Celestial Engine...
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
