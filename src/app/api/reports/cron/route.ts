import { NextResponse } from 'next/server';
import { db } from '@/db';
import { scheduledReports } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  // This endpoint should be hit by a cron job (e.g. Vercel Cron or GitHub Actions)
  // Check for authorization header to protect the route
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const activeReports = await db.select().from(scheduledReports).where(eq(scheduledReports.isActive, true));
    
    for (const report of activeReports) {
      // Here you would check if the report is due today based on report.period (daily, weekly, monthly)
      // Then generate the required data via getSalesAnalytics() or similar
      // And use Nodemailer to send it to report.recipients

      console.log(`[CRON] Processing ${report.period} report for:`, report.recipients);
      
      // Update the lastSentAt timestamp
      await db.update(scheduledReports)
        .set({ lastSentAt: new Date(), updatedAt: new Date() })
        .where(eq(scheduledReports.id, report.id));
    }

    return NextResponse.json({ success: true, processed: activeReports.length });
  } catch (error) {
    console.error('[CRON Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
