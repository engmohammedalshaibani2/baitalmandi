import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Sign out from Supabase which also triggers cookie deletion
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('[auth:logout] Supabase signOut error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({ success: true })
    
    // Explicitly delete Supabase auth cookies in the response as backup
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
    ]
    cookieNames.forEach(name => {
      response.cookies.set(name, '', { path: '/', expires: new Date(0) })
    })

    return response
  } catch (err) {
    console.error('[auth:logout] Unexpected error during logout:', err)
    return NextResponse.json({ error: 'حدث خطأ غير متوقع أثناء تسجيل الخروج' }, { status: 500 })
  }
}
