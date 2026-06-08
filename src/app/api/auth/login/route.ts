import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.error('[API /auth/login] error:', error?.message);
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const { access_token, refresh_token, expires_in } = data.session;
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!
      .replace('https://', '')
      .replace('.supabase.co', '');

    const cookieName = `sb-${projectRef}-auth-token`;
    const cookieValue = JSON.stringify({
      access_token,
      refresh_token,
      token_type: 'bearer',
      expires_in,
      expires_at: Math.floor(Date.now() / 1000) + expires_in,
    });

    // Build Set-Cookie header
    // NOTE: No HttpOnly → allows createBrowserClient to read & auto-refresh the token
    const cookieParts = [
      `${cookieName}=${encodeURIComponent(cookieValue)}`,
      'Path=/',
      `Max-Age=${60 * 60 * 24 * 7}`, // 7 days (refresh_token keeps it alive)
      'SameSite=Lax',
    ];
    if (isProduction) {
      cookieParts.push('Secure'); // Only add Secure on HTTPS (production)
    }

    console.log('[API /auth/login] Login successful for:', email);

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', cookieParts.join('; '));
    return response;
  } catch (err) {
    console.error('[API /auth/login] Unexpected error:', err);
    return NextResponse.json({ error: 'خطأ داخلي في السيرفر' }, { status: 500 });
  }
}
