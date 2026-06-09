import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  console.log('[auth:login] POST request', { email })
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, headers) {
          console.log('[auth:login] setAll called', { cookiesToSet, headers })
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  console.log('[auth:login] signIn result', { data, error })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Manually write session cookies after successful sign-in
  if (data.session) {
    const { access_token, refresh_token, expires_at } = data.session
    const maxAge = expires_at ? Math.floor((expires_at * 1000 - Date.now()) / 1000) : 3600

    cookieStore.set('sb-auth-token', access_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    })

    cookieStore.set('sb-refresh-token', refresh_token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    
    console.log('[auth:login] Manually wrote session cookies', { maxAge })
  }

  console.log('[auth:login] cookieStore after signIn', cookieStore.getAll())

  return NextResponse.json({ user: data.user })
}