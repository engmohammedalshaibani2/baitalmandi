'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Settings, Phone, Clock, Truck, MessageCircle } from 'lucide-react';

interface SettingItem {
  key: string;
  value: string;
  description?: string;
}

const DEFAULT_SETTINGS: SettingItem[] = [
  { key: 'restaurant_name', value: 'بيت المندي', description: 'اسم المطعم' },
  { key: 'phone_reservations', value: '01/465888', description: 'رقم الحجز' },
  { key: 'phone_delivery_whatsapp', value: '967779898617', description: 'رقم واتساب التوصيل' },
  { key: 'phone_delivery_call', value: '967775577200', description: 'رقم اتصال التوصيل' },
  { key: 'address_main', value: 'صنعاء - نهاية شارع الرباط، بداية شارع الستين', description: 'عنوان الفرع الرئيسي' },
  { key: 'working_hours', value: 'يومياً من 11:00 صباحاً حتى 12:00 منتصف الليل', description: 'مواعيد العمل' },
  { key: 'delivery_fee', value: '0', description: 'رسوم التوصيل الافتراضية (ريال)' },
  { key: 'min_order_amount', value: '30', description: 'الحد الأدنى للطلب (ريال)' },
  { key: 'whatsapp_order_number', value: '967779898617', description: 'رقم واتساب لاستقبال الطلبات' },
  { key: 'currency', value: 'ريال', description: 'العملة المستخدمة' },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    const { data, error } = await supabase.from('site_settings').select('*');
    if (data && data.length > 0) {
      const settingsMap: Record<string, string> = {};
      data.forEach((item: any) => { settingsMap[item.setting_key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value); });
      setSettings(settingsMap);
    } else {
      // Use defaults if table is empty or doesn't exist
      const defaultMap: Record<string, string> = {};
      DEFAULT_SETTINGS.forEach(s => { defaultMap[s.key] = s.value; });
      setSettings(defaultMap);
    }
    setLoading(false);
  }

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    
    try {
      const upsertData = DEFAULT_SETTINGS.map(s => ({
        setting_key: s.key,
        value: settings[s.key] ?? s.value,
      }));

      const { error } = await supabase.from('site_settings').upsert(upsertData, { onConflict: 'setting_key' });
      
      if (error) {
        setSaveMessage('⚠️ حدث خطأ أثناء الحفظ: ' + error.message);
      } else {
        setSaveMessage('✓ تم حفظ الإعدادات بنجاح!');
      }
    } catch (err) {
      setSaveMessage('⚠️ تعذّر الاتصال بقاعدة البيانات');
    }
    
    setSaving(false);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const sections = [
    {
      title: 'معلومات المطعم',
      icon: Settings,
      keys: ['restaurant_name', 'address_main', 'working_hours', 'currency'],
    },
    {
      title: 'أرقام التواصل',
      icon: Phone,
      keys: ['phone_reservations', 'phone_delivery_whatsapp', 'phone_delivery_call'],
    },
    {
      title: 'إعدادات التوصيل',
      icon: Truck,
      keys: ['delivery_fee', 'min_order_amount'],
    },
    {
      title: 'واتساب',
      icon: MessageCircle,
      keys: ['whatsapp_order_number'],
    },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 15px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>جاري تحميل الإعدادات...</p>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 className="title-gold" style={{ fontSize: '2rem' }}>إعدادات النظام</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {saveMessage && (
            <span style={{
              padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600,
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
        {sections.map(section => {
          const Icon = section.icon;
          const sectionSettings = DEFAULT_SETTINGS.filter(s => section.keys.includes(s.key));
          
          return (
            <div key={section.title} className="glass-panel" style={{ padding: '28px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                <Icon size={20} color="var(--gold)" />
                {section.title}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {sectionSettings.map(setting => (
                  <div key={setting.key}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                      {setting.description}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings[setting.key] ?? setting.value}
                      onChange={e => handleChange(setting.key, e.target.value)}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                      المفتاح: <code style={{ background: 'var(--glass-bg)', padding: '1px 6px', borderRadius: '4px' }}>{setting.key}</code>
                    </small>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Danger Zone */}
        <div className="glass-panel" style={{ padding: '28px', border: '1px solid rgba(239,68,68,0.25)' }}>
          <h2 style={{ color: '#ef4444', fontSize: '1.2rem', marginBottom: '20px' }}>منطقة الخطر</h2>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={async () => {
                if (confirm('تحذير: هل تريد مسح جميع الطلبات المكتملة؟ لا يمكن التراجع عن هذا.')) {
                  await supabase.from('orders').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('status', 'delivered');
                  alert('تم مسح الطلبات المكتملة بنجاح.');
                }
              }}
              className="btn-danger"
            >
              🗑️ مسح الطلبات المكتملة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
