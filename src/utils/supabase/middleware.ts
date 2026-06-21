import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessRoute, type AdminRole } from '@/lib/permissions'
import { logAuthAction } from '@/lib/auth/logger'
async function getAdminRole(supabase: any, userId: string): Promise<AdminRole | null> {
  try {
    const { data } = await supabase
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', userId)
      .maybeSingle()
    let role = data?.role
    if (role === 'order-manager') role = 'order_manager'
    return (role as AdminRole) ?? null
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  let supabaseResponse = NextResponse.next({
    request: {
      headers: new Headers(request.headers)
    }
  })
  supabaseResponse.headers.set('x-pathname', pathname)


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

  const isLoginPage = pathname.startsWith('/admin/login')
  const isApiAuth = pathname.startsWith('/api/auth')

  console.log('[middleware] user?', !!user)

  if (!user) {
    if (!isLoginPage && !isApiAuth) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      const redirectResponse = NextResponse.redirect(url)
      // Clean up stale cookies if present to prevent repeated remote validation calls
      request.cookies.getAll().forEach(c => {
        if (c.name.startsWith('sb-') || c.name.includes('auth-token')) {
          redirectResponse.cookies.set(c.name, '', { path: '/', expires: new Date(0) })
        }
      })
      return redirectResponse
    }
    return supabaseResponse
  }

  const role = await getAdminRole(supabase, user.id)

  if (isLoginPage) {
    if (role) {
      if (pathname.startsWith('/api/')) return supabaseResponse;
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = role === 'order_manager' ? '/admin/orders' : '/admin'
      return NextResponse.redirect(redirectUrl)
    }
    return pathname.startsWith('/api/') ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) : supabaseResponse
  }

  if (!role) {
    logAuthAction('UNAUTHORIZED_ACCESS', { userId: user?.id || 'guest', route: pathname, reason: 'No admin role' });
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  if (pathname === '/admin' && role === 'order_manager') {
    logAuthAction('ADMIN_REDIRECT', { userId: user.id, role, from: pathname, to: '/admin/orders' });
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = request.nextUrl.clone()
    url.pathname = '/admin/orders'
    return NextResponse.redirect(url)
  }

  if (!canAccessRoute(role, pathname)) {
    logAuthAction('UNAUTHORIZED_ACCESS', { userId: user.id, role, route: pathname });
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = request.nextUrl.clone()
    url.pathname = role === 'order_manager' ? '/admin/orders' : '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
