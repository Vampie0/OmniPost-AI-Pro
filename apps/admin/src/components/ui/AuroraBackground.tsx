'use client';

import React from 'react';

interface Blob {
  key: string;
  position: string;
  animation: string;
  color: string;
  strength: number;
}

/**
 * Ambient depth for an otherwise flat background.
 *
 * Painted as radial gradients rather than blurred solid discs on purpose: a large
 * `filter: blur()` re-rasterises on every composite, while a gradient is a single
 * cheap paint that the transform animation can move on the compositor alone.
 */
const BLOBS: Blob[] = [
  {
    key: 'ember',
    position: 'top-[-16rem] left-[-12rem] h-[46rem] w-[46rem]',
    animation: 'animate-aurora-a',
    color: 'var(--color-glow)',
    strength: 22,
  },
  {
    key: 'counter',
    position: 'top-[34%] right-[-14rem] h-[40rem] w-[40rem]',
    animation: 'animate-aurora-b',
    color: 'var(--color-primary)',
    strength: 16,
  },
  {
    key: 'accent',
    position: 'bottom-[-14rem] left-[22%] h-[34rem] w-[34rem]',
    animation: 'animate-aurora-a [animation-delay:-11s]',
    color: 'var(--color-badge-text)',
    strength: 13,
  },
];

export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BLOBS.map((blob) => (
        <div
          key={blob.key}
          className={`absolute will-change-transform ${blob.position} ${blob.animation}`}
          style={{
            background: `radial-gradient(circle at center, color-mix(in srgb, ${blob.color} ${blob.strength}%, transparent) 0%, transparent 68%)`,
          }}
        />
      ))}

      {/* Fine dot lattice, faded toward the edges so it never competes with content. */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'radial-gradient(circle, color-mix(in srgb, var(--color-text-muted) 22%, transparent) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 20%, transparent 78%)',
        }}
      />
    </div>
  );
}
