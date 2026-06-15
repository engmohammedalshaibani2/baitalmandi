import { NextRequest, NextResponse } from 'next/server';
import { resolveZoneWithFallback } from '@/lib/geo/resolve-zone';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { error: 'يجب إرسال lat و lng كأرقام' },
        { status: 400 },
      );
    }

    if (lat < 15.28 || lat > 15.44 || lng < 44.13 || lng > 44.27) {
      return NextResponse.json({
        zone: 'خارج صنعاء',
        zoneId: 'outside',
        outsideSanaa: true,
      });
    }

    const result = await resolveZoneWithFallback(lat, lng);

    return NextResponse.json({
      zone: result.zoneName,
      zoneId: result.zoneId,
      confidence: result.confidence,
      method: result.method,
      outsideSanaa: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Internal error' },
      { status: 500 },
    );
  }
}
