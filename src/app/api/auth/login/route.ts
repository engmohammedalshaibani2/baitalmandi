import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    let email: string, password: string
    try {
      const body = await request.json()
      email = body.email
      password = body.password
    } catch {
      return NextResponse.json({ error: 'بيانات الطلب غير صالحة' }, { status: 400 })
    }

    console.log('[auth:login] POST request', { email })
    const cookieStore = await cookies()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('[auth:login] Missing Supabase env vars', { supabaseUrl, supabaseKey })
      return NextResponse.json({ error: 'خطأ في إعدادات الخادم، يرجى التواصل مع المسؤول.' }, { status: 500 })
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch (err) {
            console.error('[auth:login] cookie set error', err)
          }
        },
        remove(name: string, _options: any) {
          try {
            cookieStore.delete(name)
          } catch (err) {
            console.error('[auth:login] cookie remove error', err)
          }
        },
      },
    })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('[auth:login] signIn result', { data, error })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', data.user.id)
      .maybeSingle()

    return NextResponse.json({ success: true, role: adminData?.role || null })
  } catch (err) {
    console.error('[auth:login] Unexpected error', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع في الخادم' }, { status: 500 })
  }
}