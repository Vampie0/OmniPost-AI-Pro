'use client';

import { useState, useCallback, useRef } from 'react';

interface SubmitLockOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  minLoadingMs?: number;
}

interface SubmitLockReturn {
  isLoading: boolean;
  isLocked: boolean;
  submit: (fn: () => Promise<void> | Promise<unknown>) => Promise<void>;
  reset: () => void;
}

/**
 * Prevents double-click / multi-submission on forms and actions.
 * Automatically disables the trigger while the async operation is in-flight.
 * Optionally enforces a minimum loading duration to prevent UI flicker.
 */
export function useSubmitLock(options: SubmitLockOptions = {}): SubmitLockReturn {
  const { onSuccess, onError, minLoadingMs = 0 } = options;
  const [isLoading, setIsLoading] = useState(false);
  const lockedRef = useRef(false);

  const submit = useCallback(
    async (fn: () => Promise<void> | Promise<unknown>) => {
      if (lockedRef.current) return;
      lockedRef.current = true;
      setIsLoading(true);

      const startTime = Date.now();

      try {
        await fn();
        onSuccess?.();
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)));
      } finally {
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingMs) {
          await new Promise((r) => setTimeout(r, minLoadingMs - elapsed));
        }
        lockedRef.current = false;
        setIsLoading(false);
      }
    },
    [onSuccess, onError, minLoadingMs]
  );

  const reset = useCallback(() => {
    lockedRef.current = false;
    setIsLoading(false);
  }, []);

  return { isLoading, isLocked: lockedRef.current, submit, reset };
}
