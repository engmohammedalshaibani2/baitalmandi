import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessPage, getDefaultRedirect, type AdminRole } from '@/lib/permissions'

async function getAdminRole(supabase: any, userId: string): Promise<AdminRole | null> {
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle()
    return (data?.role as AdminRole) ?? null
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const cookieNames = request.cookies.getAll().map((c) => c.name)
    console.log('[middleware] request for', request.nextUrl.pathname, 'cookies present:', cookieNames)
  } catch (err) {
    console.log('[middleware] could not read request cookies', err)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value ?? null
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, _options: any) {
          request.cookies.delete(name)
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.delete(name)
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user
  } catch (err) {
    console.log('[middleware] getUser error', err)
  }

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname.startsWith('/admin/login')
  const isApiAuth = pathname.startsWith('/api/auth')

  console.log('[middleware] user?', !!user)

  if (!user) {
    if (!isLoginPage && !isApiAuth) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const role = await getAdminRole(supabase, user.id)

  if (isLoginPage) {
    if (role) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = getDefaultRedirect(role)
      return NextResponse.redirect(redirectUrl)
    }
    return supabaseResponse
  }

  if (!role) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (!canAccessPage(role, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultRedirect(role)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
