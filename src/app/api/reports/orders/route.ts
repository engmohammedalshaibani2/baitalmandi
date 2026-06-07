import { NextResponse } from 'next/server';
import { getOrdersReport } from '@/services/reports/ordersReport';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = new Date(searchParams.get('startDate') || new Date().setHours(0,0,0,0));
  const end = new Date(searchParams.get('endDate') || new Date().setHours(23,59,59,999));
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const status = searchParams.get('status') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const search = searchParams.get('search') || '';
  
  try {
    const data = await getOrdersReport(start, end, page, limit, status, payment, search);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
