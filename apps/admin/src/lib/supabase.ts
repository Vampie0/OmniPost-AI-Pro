import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isPlaceholderUrl =
  supabaseUrl.includes('placeholder') || process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Cookie-backed singleton (same storage the login page's createBrowserClient
// and the middleware read/write). Previously this used plain supabase-js,
// which persists sessions in localStorage — so a cookie-based login left
// every dashboard query session-less and bounced the user back to /login.
let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedClient;
}

// Lazy Proxy keeps module evaluation SSR-safe while preserving the
// existing `supabase.*` call sites unchanged across the app.
export const supabase: SupabaseClient = new Proxy({} as unknown as SupabaseClient, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    const value = client[prop];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
