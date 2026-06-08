import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const isProduction = process.env.NODE_ENV === 'production';

const projectRef = supabaseUrl
  .replace('https://', '')
  .replace('.supabase.co', '');

const COOKIE_NAME = `sb-${projectRef}-auth-token`;

/** Read and parse session from request cookies (supports JSON or chunked formats) */
function getSessionFromCookies(request: NextRequest): {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
} | null {
  // Try direct JSON cookie first (our format)
  const direct = request.cookies.get(COOKIE_NAME)?.value;
  if (direct) {
    try {
      return JSON.parse(decodeURIComponent(direct));
    } catch { /* ignore */ }
  }

  // Try chunked format: sb-xxx-auth-token.0, .1, etc. (supabase-js browser format)
  let chunks = '';
  let i = 0;
  while (true) {
    const chunk = request.cookies.get(`${COOKIE_NAME}.${i}`)?.value;
    if (!chunk) break;
    chunks += chunk;
    i++;
  }
  if (chunks) {
    try {
      return JSON.parse(decodeURIComponent(chunks));
    } catch { /* ignore */ }
  }

  return null;
}

/** Set a refreshed session cookie on a response */
function setSessionCookie(
  response: NextResponse,
  cookieValue: object,
  maxAge = 60 * 60 * 24 * 7
) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(cookieValue))}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'SameSite=Lax',
  ];
  if (isProduction) parts.push('Secure');
  response.headers.set('Set-Cookie', parts.join('; '));
}

export const updateSession = async (request: NextRequest) => {
  const path = request.nextUrl.pathname;

  // Skip non-admin and API routes — no auth check needed
  if (!path.startsWith('/admin') || path === '/admin/login' || path.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  const session = getSessionFromCookies(request);

  if (!session?.access_token) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // Check if token is expired (with 60-second buffer)
  const now = Math.floor(Date.now() / 1000);
  const isExpired = session.expires_at ? session.expires_at < now + 60 : false;

  if (isExpired && session.refresh_token) {
    // Refresh the token automatically
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: session.refresh_token,
      });

      if (error || !data.session) {
        console.log('[Middleware] Token refresh failed, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }

      const response = NextResponse.next({ request });
      const { access_token, refresh_token, expires_in } = data.session;
      setSessionCookie(response, {
        access_token,
        refresh_token,
        token_type: 'bearer',
        expires_in,
        expires_at: now + expires_in,
      });
      console.log(`[Middleware] Token refreshed for → ${path}`);
      return response;
    } catch (err) {
      console.error('[Middleware] Refresh error:', err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Validate token against Supabase auth server
  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    });

    const { data: { user }, error } = await supabase.auth.getUser(session.access_token);

    if (error || !user) {
      console.log('[Middleware] Invalid token, redirecting to login');
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    console.log(`[Middleware] ✓ Authenticated: ${user.email} → ${path}`);
    return NextResponse.next({ request });
  } catch {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
};
