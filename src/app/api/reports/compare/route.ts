import { NextResponse } from 'next/server';
import { getCompareAnalytics } from '@/services/reports/analyticsEngine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currStart = new Date(searchParams.get('currStart') || new Date());
  const currEnd = new Date(searchParams.get('currEnd') || new Date());
  const prevStart = new Date(searchParams.get('prevStart') || new Date());
  const prevEnd = new Date(searchParams.get('prevEnd') || new Date());
  const status = searchParams.get('status') || 'all';
  const payment = searchParams.get('payment') || 'all';
  const search = searchParams.get('search') || '';
  
  try {
    const data = await getCompareAnalytics(currStart, currEnd, prevStart, prevEnd, status, payment, search);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
