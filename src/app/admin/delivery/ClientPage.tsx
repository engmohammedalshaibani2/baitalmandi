'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSettings } from '@/lib/settings-context';
import { getSettingsByKeys, upsertBulkSettings } from '@/repositories/settingsRepository';
import { Save, MapPin, Truck, CloudSun, Clock, ToggleLeft, ToggleRight, CalendarDays } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

const SETTINGS_KEYS = [
  'restaurant_lat',
  'restaurant_lng',
  'delivery_enabled',
  'max_delivery_distance_km',
  'road_factor',
  'base_delivery_fee',
  'included_distance_km',
  'extra_fee_per_km',
  'enable_weather_fee',
  'weather_fee',
  'enable_peak_hours',
  'peak_start_time',
  'peak_end_time',
  'peak_percentage',
  'peak_days',
];

const DEFAULT_SETTINGS: Record<string, string> = {
  restaurant_lat: '15.360035270551275',
  restaurant_lng: '44.17484814594534',
  delivery_enabled: 'true',
  max_delivery_distance_km: '15',
  road_factor: '1.5',
  base_delivery_fee: '400',
  included_distance_km: '2',
  extra_fee_per_km: '100',
  enable_weather_fee: 'false',
  weather_fee: '200',
  enable_peak_hours: 'false',
  peak_start_time: '12:00',
  peak_end_time: '14:00',
  peak_percentage: '20',
  peak_days: '[]',
};

export default function AdminDeliveryPage() {
  const { settings: appSettings, refresh } = useSettings();
  const currency = appSettings['currency'] || 'ريال';
  const [settings, setSettings] = useState<Record<string, string>>({ ...DEFAULT_SETTINGS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const sData = await getSettingsByKeys(SETTINGS_KEYS);

      const sMap: Record<string, string> = { ...DEFAULT_SETTINGS };
      if (sData) {
        sData.forEach((s: any) => {
          sMap[s.setting_key] = typeof s.value === 'string' ? s.value : String(s.value);
        });
      }
      setSettings(sMap);

      const missingKeys = SETTINGS_KEYS.filter(k => !(sData || []).some((s: any) => s.setting_key === k));
      if (missingKeys.length > 0) {
        const upsertData = missingKeys.map(k => ({
          setting_key: k,
          value: sMap[k],
        }));
        await upsertBulkSettings(upsertData);
      }
    } catch (err) {
      console.error('[AdminDelivery] load error:', err);
    }
    setLoading(false);
    setInitialized(true);
  };

  useEffect(() => {
    if (!initialized || !mapRef.current || mapInstance.current) return;

    const initMap = async () => {
      const el = mapRef.current;
      if (!el) return;

      const L = (await import('leaflet')).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const restLat = parseFloat(settings.restaurant_lat);
      const restLng = parseFloat(settings.restaurant_lng);

      const map = L.map(el, {
        center: [restLat || 15.360035270551275, restLng || 44.17484814594534],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      map.on('click', (e: any) => {
        const lat = e.latlng.lat.toFixed(10);
        const lng = e.latlng.lng.toFixed(10);
        console.log('[DELIVERY_MAP_INIT] Map clicked:', { lat, lng });
        setSettings(prev => ({ ...prev, restaurant_lat: String(lat), restaurant_lng: String(lng) }));
        updateMarkerPos(e.latlng.lat, e.latlng.lng, L);
      });

      mapInstance.current = map;

      if (restLat && restLng) {
        updateMarkerPos(restLat, restLng, L);
      }

      console.log('[DELIVERY_MAP_INIT] Map loaded:', {
        lat: restLat,
        lng: restLng,
        mapLoaded: true,
        markerStatus: restLat && restLng ? 'initialized' : 'pending',
      });

      setMapReady(true);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [initialized]);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;

    const lat = parseFloat(settings.restaurant_lat);
    const lng = parseFloat(settings.restaurant_lng);
    if (!lat || !lng) return;

    const updateMap = async () => {
      const L = (await import('leaflet')).default;
      updateMarkerPos(lat, lng, L);
      console.log('[RESTAURANT_LOCATION_UPDATED]', { lat, lng, mapReady: true });
    };
    updateMap();
  }, [settings.restaurant_lat, settings.restaurant_lng, mapReady]);

  const updateMarkerPos = useCallback((lat: number, lng: number, L?: any) => {
    const leaflet = L || (window as any).L;
    if (!mapInstance.current || !leaflet) return;

    const goldIcon = leaflet.divIcon({
      html: '<div style="background:#C59B5F;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>',
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng]);
    } else {
      markerInstance.current = leaflet.marker([lat, lng], { icon: goldIcon, draggable: true }).addTo(mapInstance.current);
      markerInstance.current.on('dragend', () => {
        const pos = markerInstance.current.getLatLng();
        console.log('[MARKER_DRAGGED]', { lat: pos.lat, lng: pos.lng });
        setSettings(prev => ({
          ...prev,
          restaurant_lat: String(pos.lat.toFixed(10)),
          restaurant_lng: String(pos.lng.toFixed(10)),
        }));
      });
    }
    mapInstance.current.setView([lat, lng], mapInstance.current.getZoom() || 15);
  }, []);

  const handleSettingsChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    try {
      const settingsPayload = SETTINGS_KEYS.map(k => ({
        setting_key: k,
        value: settings[k] ?? DEFAULT_SETTINGS[k],
      }));
      await upsertBulkSettings(settingsPayload);

      setSaveMessage('✓ تم حفظ إعدادات التوصيل بنجاح!');
      refresh();
    } catch (err: any) {
      setSaveMessage('⚠️ حدث خطأ: ' + (err?.message || 'unknown'));
    }

    setSaving(false);
    setTimeout(() => setSaveMessage(''), 5000);
  };

  const inputLabel: React.CSSProperties = {
    display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل إعدادات التوصيل...</p>
        </div>
      </div>
    );
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
        borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--glass-bg)',
        cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: 600,
        color: value ? '#10b981' : 'var(--text-muted)',
      }}
    >
      {value ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
      {value ? 'مفعل' : 'معطل'}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="title-gold" style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Truck size={28} /> إعدادات التوصيل
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveMessage && (
            <span style={{
              padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
              background: saveMessage.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: saveMessage.startsWith('✓') ? '#10b981' : '#ef4444',
              border: `1px solid ${saveMessage.startsWith('✓') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {saveMessage}
            </span>
          )}
          <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {/* Restaurant Location */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <MapPin size={20} color="var(--gold)" /> موقع المطعم
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
            اختر موقع المطعم على الخريطة أو اسحب العلامة لتحديد الموقع بدقة
          </p>
          <div
            ref={mapRef}
            style={{
              width: '100%',
              height: '300px',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border)',
              marginBottom: '14px',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={inputLabel}>خط العرض (Latitude)</label>
              <input
                type="text"
                className="form-input"
                value={settings.restaurant_lat}
                onChange={e => handleSettingsChange('restaurant_lat', e.target.value)}
                style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={inputLabel}>خط الطول (Longitude)</label>
              <input
                type="text"
                className="form-input"
                value={settings.restaurant_lng}
                onChange={e => handleSettingsChange('restaurant_lng', e.target.value)}
                style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* General Delivery Settings */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <Truck size={20} color="var(--gold)" /> الإعدادات العامة للتوصيل
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={inputLabel}>حالة التوصيل</label>
              <Toggle
                value={settings.delivery_enabled === 'true'}
                onChange={v => handleSettingsChange('delivery_enabled', v ? 'true' : 'false')}
              />
            </div>
            <div>
              <label style={inputLabel}>معامل الطرق (Road Factor)</label>
              <input
                type="number"
                className="form-input"
                value={settings.road_factor}
                onChange={e => handleSettingsChange('road_factor', e.target.value)}
                min="0.5" max="10" step="0.1"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                المسافة التقديرية = المسافة الخطية × المعامل. القيمة 1.5 مناسبة لصنعاء
              </small>
            </div>
          </div>
        </div>

        {/* Basic Delivery Pricing */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <Truck size={20} color="var(--gold)" /> تسعير التوصيل الأساسي
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={inputLabel}>رسوم التوصيل الأساسية (ريال)</label>
              <input
                type="number"
                className="form-input"
                value={settings.base_delivery_fee}
                onChange={e => handleSettingsChange('base_delivery_fee', e.target.value)}
                min="0" max="5000" step="50"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                السعر الثابت للمسافات ضمن المسافة المشمولة
              </small>
            </div>
            <div>
              <label style={inputLabel}>المسافة المشمولة (كم)</label>
              <input
                type="number"
                className="form-input"
                value={settings.included_distance_km}
                onChange={e => handleSettingsChange('included_distance_km', e.target.value)}
                min="0" max="50" step="0.5"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                المسافة التي يشملها السعر الأساسي. بعدها تحتسب رسوم إضافية
              </small>
            </div>
            <div>
              <label style={inputLabel}>رسوم الكيلومتر الإضافي (ريال)</label>
              <input
                type="number"
                className="form-input"
                value={settings.extra_fee_per_km}
                onChange={e => handleSettingsChange('extra_fee_per_km', e.target.value)}
                min="0" max="1000" step="10"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                تضاف عن كل كيلومتر بعد المسافة المشمولة
              </small>
            </div>
            <div>
              <label style={inputLabel}>أقصى مسافة توصيل (كم)</label>
              <input
                type="number"
                className="form-input"
                value={settings.max_delivery_distance_km}
                onChange={e => handleSettingsChange('max_delivery_distance_km', e.target.value)}
                min="1" max="50" step="1"
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                أقصى مسافة يسمح بالتوصيل إليها
              </small>
            </div>
          </div>

          {/* Example Calculation */}
          <div style={{
            marginTop: '20px', padding: '16px', borderRadius: '10px',
            background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#10b981', marginBottom: '10px' }}>
              مثال حساب رسوم التوصيل
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {(() => {
                const base = Number(settings.base_delivery_fee) || 400;
                const included = Number(settings.included_distance_km) || 2;
                const extra = Number(settings.extra_fee_per_km) || 100;
                const maxDist = Number(settings.max_delivery_distance_km) || 15;

                const examples = [1.5, 2, 3, 5];
                return examples.map(d => {
                  const fee = d <= included ? base : base + Math.round((d - included) * extra);
                  return (
                    <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                      <span>{d} كم</span>
                      <strong style={{ color: '#10b981' }}>{fee} {currency}</strong>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Weather Surcharge */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <CloudSun size={20} color="var(--gold)" /> رسوم الطقس
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            إضافة رسوم إضافية على التوصيل في حالات الطقس السيئ
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div>
              <label style={inputLabel}>تفعيل رسوم الطقس</label>
              <Toggle
                value={settings.enable_weather_fee === 'true'}
                onChange={v => handleSettingsChange('enable_weather_fee', v ? 'true' : 'false')}
              />
            </div>
            {settings.enable_weather_fee === 'true' && (
              <div>
                <label style={inputLabel}>رسوم الطقس (ريال)</label>
                <input
                  type="number"
                  className="form-input"
                  value={settings.weather_fee}
                  onChange={e => handleSettingsChange('weather_fee', e.target.value)}
                  min="0" max="2000" step="50"
                  style={{ direction: 'ltr', textAlign: 'left' }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  تضاف فوق رسوم التوصيل المحسوبة
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Peak Hours Surcharge */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <Clock size={20} color="var(--gold)" /> رسوم أوقات الذروة
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            تطبق تلقائياً في الأوقات المحددة. تدخل حيز التنفيذ بمجرد دخول الوقت وتزال تلقائياً بانتهائه
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div>
              <label style={inputLabel}>تفعيل رسوم الذروة</label>
              <Toggle
                value={settings.enable_peak_hours === 'true'}
                onChange={v => handleSettingsChange('enable_peak_hours', v ? 'true' : 'false')}
              />
            </div>
            {settings.enable_peak_hours === 'true' && (
              <>
                <div>
                  <label style={inputLabel}>وقت البداية</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.peak_start_time}
                    onChange={e => handleSettingsChange('peak_start_time', e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
                <div>
                  <label style={inputLabel}>وقت النهاية</label>
                  <input
                    type="time"
                    className="form-input"
                    value={settings.peak_end_time}
                    onChange={e => handleSettingsChange('peak_end_time', e.target.value)}
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>
                <div>
                  <label style={inputLabel}>نسبة الزيادة (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={settings.peak_percentage}
                    onChange={e => handleSettingsChange('peak_percentage', e.target.value)}
                    min="0" max="200" step="5"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    نسبة مئوية تضاف على رسوم التوصيل الأساسية
                  </small>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...inputLabel, marginBottom: '10px' }}>
                    <CalendarDays size={14} style={{ marginLeft: '6px', verticalAlign: 'middle' }} /> أيام الذروة
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => {
                      const currentDays: string[] = (() => {
                        try { return JSON.parse(settings.peak_days || '[]'); } catch { return []; }
                      })();
                      const selected = currentDays.includes(day);
                      const dayNames: Record<string, string> = {
                        saturday: 'السبت', sunday: 'الأحد', monday: 'الإثنين',
                        tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة',
                      };
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const current: string[] = (() => {
                              try { return JSON.parse(settings.peak_days || '[]'); } catch { return []; }
                            })();
                            const next = selected
                              ? current.filter(d => d !== day)
                              : [...current, day];
                            handleSettingsChange('peak_days', JSON.stringify(next));
                          }}
                          style={{
                            padding: '8px 14px', borderRadius: '8px', border: selected ? '2px solid var(--gold)' : '1px solid var(--border)',
                            background: selected ? 'rgba(197,155,95,0.1)' : 'var(--glass-bg)',
                            color: selected ? 'var(--gold)' : 'var(--text-secondary)',
                            fontWeight: selected ? 700 : 400, cursor: 'pointer', fontSize: '0.85rem',
                          }}
                        >
                          {dayNames[day]}
                        </button>
                      );
                    })}
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                    اختر الأيام التي تطبق فيها رسوم الذروة. إذا لم تختر أي يوم، تُطبق رسوم الذروة يومياً
                  </small>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
