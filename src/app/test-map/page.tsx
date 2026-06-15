'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getDeliveryRoute } from '@/lib/maps/getDeliveryRoute';

export default function TestMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('جاري تحميل الخريطة...');
  const [routeInfo, setRouteInfo] = useState<{
    distanceKm: number;
    durationMinutes: number;
  } | null>(null);
  const [routeError, setRouteError] = useState(false);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;

    let map: any = null;
    let routeLine: any = null;

    const init = async () => {
      try {
        const L = (await import('leaflet')).default;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const restLat = 15.360035270551275;
        const restLng = 44.17484814594534;
        const custLat = 15.357286097162131;
        const custLng = 44.17220594749143;

        map = L.map(el, {
          center: [restLat, restLng],
          zoom: 15,
          zoomControl: true,
        });

        const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
          maxZoom: 19,
        });

        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        });

        carto.addTo(map);

        L.marker([restLat, restLng], { draggable: false })
          .addTo(map)
          .bindPopup('📍 مطعم بيت المندي');

        L.marker([custLat, custLng], { draggable: false })
          .addTo(map)
          .bindPopup('👤 موقع العميل');

        setStatus('جاري تحميل المسار الفعلي...');

        try {
          const route = await getDeliveryRoute(restLat, restLng, custLat, custLng);

          routeLine = L.polyline(route.coordinates, {
            color: '#C59B5F',
            weight: 4,
            opacity: 0.85,
          }).addTo(map);

          const bounds = L.latLngBounds(
            route.coordinates.map((coord: [number, number]) => L.latLng(coord[0], coord[1])),
          );
          map.fitBounds(bounds, { padding: [50, 50] });

          setRouteInfo({
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes,
          });
          setStatus('✅ الخريطة تعمل - المسار الفعلي');
        } catch {
          setRouteError(true);
          setStatus('⚠️ تعذر تحميل المسار الفعلي.');

          const bounds = L.latLngBounds(
            L.latLng(restLat, restLng),
            L.latLng(custLat, custLng),
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (err: any) {
        setStatus(`❌ خطأ: ${err?.message || 'غير معروف'}`);
      }
    };

    init();

    return () => {
      if (routeLine) {
        routeLine.remove();
        routeLine = null;
      }
      if (map) {
        map.remove();
        map = null;
      }
    };
  }, []);

  return (
    <main style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', paddingTop: '100px' }}>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '10px', textAlign: 'center', color: 'var(--gold)' }}>
        🗺️ اختبار الخريطة
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        صفحة اختبار مستقلة لمكون Leaflet + CARTO Tiles
      </p>

      <div style={{ textAlign: 'center', marginBottom: '12px', padding: '10px', borderRadius: '10px', background: status.includes('✅') ? 'rgba(16,185,129,0.08)' : status.includes('⚠️') ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', color: status.includes('✅') ? '#10b981' : status.includes('⚠️') ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
        {status}
      </div>

      {routeInfo && !routeError && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem', marginBottom: '12px' }}>
          <div style={{ padding: '10px 18px', background: 'rgba(16,185,129,0.1)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 600 }}>
            🛣️ المسافة الفعلية: {routeInfo.distanceKm} كم
          </div>
          <div style={{ padding: '10px 18px', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', fontWeight: 600 }}>
            ⏱️ زمن الوصول: {routeInfo.durationMinutes} دقيقة
          </div>
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '500px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '2px solid var(--border)',
          marginBottom: '16px',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
        <div style={{ padding: '8px 14px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          🏪 المطعم: 15.3600, 44.1748
        </div>
        <div style={{ padding: '8px 14px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          👤 العميل: 15.3573, 44.1722
        </div>
        {routeInfo && !routeError && (
          <div style={{ padding: '8px 14px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            🛣️ المسار الفعلي: {routeInfo.distanceKm} كم
          </div>
        )}
      </div>
    </main>
  );
}
