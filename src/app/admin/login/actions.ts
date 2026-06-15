'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  console.log('[auth:action:login] form', { email: formData.get('email') })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? null
        },
        set(name: string, value: string, options: any) {
          console.log('[auth:action:login] set called', { name, value })
          cookieStore.set(name, value, options)
        },
        remove(name: string, _options: any) {
          cookieStore.delete(name)
        },
      },
    }
  )

  await supabase.auth.signOut()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  console.log('[auth:action:login] signIn result', { data, error })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value ?? null },
        set(name: string, value: string, options: any) { cookieStore.set(name, value, options) },
        remove(name: string, _options: any) { cookieStore.delete(name) },
      },
    }
  )

  await supabase.auth.signOut()
  redirect('/admin/login')
}