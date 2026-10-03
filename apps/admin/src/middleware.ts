import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/users') ||
    pathname.startsWith('/posts') ||
    pathname.startsWith('/templates') ||
    pathname.startsWith('/subscriptions') ||
    pathname.startsWith('/analytics') ||
    pathname.startsWith('/white-label') ||
    pathname.startsWith('/ai-settings') ||
    pathname.startsWith('/notifications') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/test-connection') ||
    pathname.startsWith('/api');

  const isAuthPath = pathname.startsWith('/login');

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const isPlaceholder = supabaseUrl.includes('placeholder') || process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  if (isPlaceholder) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Fast path: verify the JWT locally against the cached JWKS — this avoids a
  // GoTrue network round-trip on every navigation (main source of admin slowness).
  let userId: string | null = null;
  const { data: claimsData } = await supabase.auth.getClaims();
  const sub = claimsData?.claims?.sub;
  if (typeof sub === 'string') {
    userId = sub;
  } else {
    // Slow path validates remotely and refreshes expired tokens; refreshed
    // cookies are attached to the response through the setAll handler above.
    const { data: userData } = await supabase.auth.getUser();
    userId = userData.user?.id ?? null;
  }

  if (isProtectedPath) {
    const isApiRoute = pathname.startsWith('/api');

    if (!userId) {
      // API routes must get JSON status codes, not an HTML redirect
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', userId)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin') || profile.is_suspended) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  if (isAuthPath && userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_suspended')
      .eq('id', userId)
      .single();

    if (profile && (profile.role === 'admin' || profile.role === 'super_admin') && !profile.is_suspended) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
