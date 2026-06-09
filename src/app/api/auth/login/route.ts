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

  // Create a server redirect response and attach cookies so the browser receives them
  const redirectUrl = new URL('/admin/dashboard', request.url)
  const response = NextResponse.redirect(redirectUrl)

  if (data.session) {
    const { access_token, refresh_token, expires_at } = data.session
    const maxAge = expires_at ? Math.floor((expires_at * 1000 - Date.now()) / 1000) : 3600

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
    const authTokenName = `sb-${projectRef}-auth-token`
    const refreshTokenName = `sb-${projectRef}-auth-token.0`

    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge,
    }

    response.cookies.set(authTokenName, access_token, cookieOptions)
    response.cookies.set(refreshTokenName, refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 365,
    })

    console.log('[auth:login] Wrote cookies to Response headers and redirecting', { authTokenName, refreshTokenName })
  }

  return response
}