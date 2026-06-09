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

  // Force cookie writing by calling getUser()
  const { data: userData } = await supabase.auth.getUser()
  console.log('[auth:login] getUser after signIn', userData)

  console.log('[auth:login] cookieStore after signIn', cookieStore.getAll())

  return NextResponse.json({ user: data.user })
}