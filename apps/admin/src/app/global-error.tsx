'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg, #06070B)',
        color: 'var(--color-text-primary, #F8FAFC)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: 0, color: 'var(--color-primary, #FF385C)' }}>500</h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary, #8E95A5)', marginTop: '0.5rem' }}>
            Something went wrong.
          </p>
          <button
            onClick={() => reset()}
            style={{
              display: 'inline-block',
              marginTop: '2rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              background: 'var(--gradient-primary, linear-gradient(135deg, #FF5E3A, #FFAE00))',
              color: 'var(--color-btn-text, #06070B)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
