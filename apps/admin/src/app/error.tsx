'use client';

import React, { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Runtime Error:', error);
  }, [error]);

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.5rem' }}>Something went wrong</h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #8E95A5)', marginBottom: '1.5rem' }}>
          {error?.message || 'An unexpected application error occurred.'}
        </p>
        <button
          onClick={() => reset()}
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
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
