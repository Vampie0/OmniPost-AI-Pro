import { useCallback, useRef } from 'react';

/**
 * Multi-press protection hook.
 * - Blocks rapid double/triple taps
 * - Preserves existing loading UI (zero UI changes)
 * - Protects sync navigation and async API triggers
 */
export function useSafePress(delayMs: number = 700) {
  const isRunning = useRef(false);
  const lastPress = useRef(0);

  const safePress = useCallback(
    async (fn: () => Promise<any> | void) => {
      const now = Date.now();
      if (isRunning.current || now - lastPress.current < delayMs) return;

      isRunning.current = true;
      lastPress.current = now;

      try {
        await fn();
      } finally {
        setTimeout(() => {
          isRunning.current = false;
        }, 300);
      }
    },
    [delayMs]
  );

  return { safePress };
}
