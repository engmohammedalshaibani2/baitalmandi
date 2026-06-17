import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Refreshes all materialized report views.
 * Should be called by a cron job every N minutes.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Call the PostgreSQL function created in migration 0014
    const { error } = await supabase.rpc('refresh_report_views');

    if (error) {
      console.error('[MV-REFRESH] RPC error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[MV-REFRESH] Error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
