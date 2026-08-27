'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Client-side TanStack Query provider for the admin dashboard.
 * Configured with:
 * - retry: 3 with exponential backoff for weak network resilience
 * - staleTime: 5 minutes to reduce unnecessary refetches
 * - refetchOnWindowFocus: true for real-time data freshness
 */
export function AdminQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 3,
            retryDelay: (attemptIndex: number) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
