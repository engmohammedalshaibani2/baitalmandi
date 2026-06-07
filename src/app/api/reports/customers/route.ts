import { NextResponse } from 'next/server';
import { getCustomerAnalytics } from '@/services/reports/customerReport';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = new Date(searchParams.get('startDate') || new Date().setHours(0,0,0,0));
  const end = new Date(searchParams.get('endDate') || new Date().setHours(23,59,59,999));
  const status = searchParams.get('status') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const search = searchParams.get('search') || '';
  
  try {
    const data = await getCustomerAnalytics(start, end, status, payment, search);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
