'use client';

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-bg, #06070B)',
      color: 'var(--color-text-primary, #FFFFFF)',
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface, #0C0E17)',
        borderRadius: '1.5rem',
        padding: '2rem',
        maxWidth: '28rem',
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
      }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: '0 0 0.5rem' }}>404</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary, #8E95A5)', marginBottom: '1.5rem' }}>
          The requested admin view or resource could not be located.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.25rem',
            background: 'var(--gradient-primary, linear-gradient(135deg, #FF5E3A, #FFAE00, #FF385C))',
            color: 'var(--color-btn-text, #FFFFFF)',
            borderRadius: '0.75rem',
            fontWeight: 700,
            fontSize: '0.75rem',
            textDecoration: 'none',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
