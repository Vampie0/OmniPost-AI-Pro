'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Video,
  Sparkles,
} from 'lucide-react';

interface PlanetConfig {
  id: string;
  name: string;
  angleOffset: number; // In degrees
  radiusX: number;
  radiusY: number;
  speed: number; // duration for full revolution in seconds
  direction: 'cw' | 'ccw';
  tilt: number; // orbital tilt in degrees
  colors: [string, string, string];
  glow: string;
  icon: React.ReactNode;
  size: number;
}

const PLANETS: PlanetConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    angleOffset: 0,
    radiusX: 115,
    radiusY: 48,
    speed: 7.5,
    direction: 'cw',
    tilt: -15,
    colors: ['#E1306C', '#F56040', '#FCAF45'],
    glow: '#E1306C',
    icon: <Instagram className="w-3.5 h-3.5 text-white" />,
    size: 32,
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    angleOffset: 72,
    radiusX: 135,
    radiusY: 58,
    speed: 9.0,
    direction: 'ccw',
    tilt: 25,
    colors: ['#00F0FF', '#1DA1F2', '#0A84FF'],
    glow: '#00F0FF',
    icon: <Twitter className="w-3.5 h-3.5 text-black" />,
    size: 30,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    angleOffset: 144,
    radiusX: 105,
    radiusY: 42,
    speed: 6.2,
    direction: 'cw',
    tilt: 40,
    colors: ['#0A66C2', '#0077B5', '#38BDF8'],
    glow: '#0A66C2',
    icon: <Linkedin className="w-3.5 h-3.5 text-white" />,
    size: 30,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    angleOffset: 216,
    radiusX: 145,
    radiusY: 62,
    speed: 8.4,
    direction: 'ccw',
    tilt: -35,
    colors: ['#FF0050', '#00F2FE', '#FF385C'],
    glow: '#FF0050',
    icon: <Video className="w-3.5 h-3.5 text-white" />,
    size: 32,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    angleOffset: 288,
    radiusX: 125,
    radiusY: 52,
    speed: 10.5,
    direction: 'cw',
    tilt: 10,
    colors: ['#1877F2', '#3B5998', '#4F46E5'],
    glow: '#1877F2',
    icon: <Facebook className="w-3.5 h-3.5 text-white" />,
    size: 28,
  },
];

const STAR_DUST = [
  { top: '12%', left: '18%', size: 3, delay: 0, duration: 1.8 },
  { top: '22%', left: '82%', size: 2, delay: 0.4, duration: 2.2 },
  { top: '78%', left: '15%', size: 3, delay: 0.8, duration: 2.5 },
  { top: '85%', left: '76%', size: 2.5, delay: 0.2, duration: 1.9 },
  { top: '48%', left: '6%', size: 2, delay: 1.1, duration: 2.8 },
  { top: '42%', left: '92%', size: 3, delay: 0.6, duration: 2.1 },
  { top: '15%', left: '50%', size: 2, delay: 0.3, duration: 1.7 },
  { top: '88%', left: '46%', size: 2, delay: 0.9, duration: 2.4 },
];

interface OrbitingPlanetProps {
  config: PlanetConfig;
}

function OrbitingPlanet({ config }: OrbitingPlanetProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    let startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      setTime(elapsed);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const directionMultiplier = config.direction === 'cw' ? 1 : -1;
  const currentAngleDeg =
    config.angleOffset +
    directionMultiplier * ((time % config.speed) / config.speed) * 360;
  const angleRad = (currentAngleDeg * Math.PI) / 180;
  const tiltRad = (config.tilt * Math.PI) / 180;

  // Un-tilted coordinates on ellipse
  const rawX = Math.cos(angleRad) * config.radiusX;
  const rawY = Math.sin(angleRad) * config.radiusY;

  // Apply tilt 2D rotation
  const x = rawX * Math.cos(tiltRad) - rawY * Math.sin(tiltRad);
  const y = rawX * Math.sin(tiltRad) + rawY * Math.cos(tiltRad);

  // 3D Depth scaling & opacity: front vs back of orbit
  const depth = Math.sin(angleRad); // -1 (back) to +1 (front)
  const scale = 0.82 + 0.28 * ((depth + 1) / 2);
  const opacity = 0.6 + 0.4 * ((depth + 1) / 2);
  const zIndex = depth > 0 ? 35 : 15;

  return (
    <div
      className="absolute top-1/2 left-1/2 pointer-events-none transition-transform will-change-transform"
      style={{
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity,
        zIndex,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center relative overflow-hidden shadow-lg"
        style={{
          width: config.size,
          height: config.size,
          background: `linear-gradient(135deg, ${config.colors.join(', ')})`,
          boxShadow: `0 0 16px ${config.glow}88, 0 4px 12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Specular curved highlight reflection */}
        <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/60 rounded-full rotate-[-25deg]" />
        {config.icon}
      </div>
    </div>
  );
}

export interface CosmicSocialSplashProps {
  onFinish?: () => void;
  durationMs?: number;
  appName?: string;
  tagline?: string;
  minimal?: boolean;
}

export function CosmicSocialSplash({
  onFinish,
  durationMs = 2400,
  appName = 'SocialPilot AI Pro',
  tagline = 'Autonomous Multi-Platform Growth Suite',
  minimal = false,
}: CosmicSocialSplashProps) {
  const [isVisible, setIsVisible] = useState(true);

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-[#06070B] overflow-hidden select-none"
        >
          {/* Subtle Ambient Mesh Glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18)_0%,_rgba(124,58,237,0.1)_35%,_transparent_70%)]" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(20,184,166,0.08)_0%,_transparent_65%)]" />

          {/* Twinkling Star Dust */}
          {STAR_DUST.map((star, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.2, scale: 0.8 }}
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
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
              }}
              className="absolute rounded-full bg-white shadow-[0_0_8px_#38BDF8]"
            />
          ))}

          {/* Center Cosmic Stage */}
          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            {/* 3D Tilted Dashed Orbit Rings */}
            <div
              className="absolute w-[240px] h-[110px] rounded-[999px] border border-white/15 border-dashed pointer-events-none"
              style={{ transform: 'rotate(-15deg)' }}
            />
            <div
              className="absolute w-[270px] h-[120px] rounded-[999px] border border-indigo-400/20 border-dashed pointer-events-none"
              style={{ transform: 'rotate(25deg)' }}
            />
            <div
              className="absolute w-[290px] h-[130px] rounded-[999px] border border-teal-400/20 border-dashed pointer-events-none"
              style={{ transform: 'rotate(-35deg)' }}
            />

            {/* Orbiting Multi-Angle Social Planets */}
            {PLANETS.map((planet) => (
              <OrbitingPlanet key={planet.id} config={planet} />
            ))}

            {/* Central Luminous Celestial Core with Saturn Ring */}
            <div className="relative z-30 flex items-center justify-center">
              {/* Saturn Orbit Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute w-20 h-20 rounded-full border-[1.5px] border-dashed border-white/40 pointer-events-none"
                style={{ transform: 'rotateX(72deg)' }}
              />

              {/* Glowing Core Sphere */}
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FFFFFF] via-[#E2E8F0] to-[#94A3B8] p-0.5 shadow-[0_0_35px_rgba(255,255,255,0.85),0_0_15px_#6366F1] relative flex items-center justify-center overflow-hidden"
              >
                {/* Core Specular */}
                <div className="absolute top-1 left-2 w-3 h-1.5 bg-white rounded-full" />
                <Sparkles className="w-5 h-5 text-[#07080B]" />
              </motion.div>
            </div>
          </div>

          {/* Brand Titles */}
          {!minimal && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-center mt-4 z-20 px-6"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>{appName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  ENTERPRISE
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1.5 tracking-wide">
                {tagline}
              </p>
            </motion.div>
          )}

          {/* Bottom Initializing Pill */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-slate-900/70 backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-200">
                Initializing Celestial Engine...
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
