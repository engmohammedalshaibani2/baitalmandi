'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/lib/settings-context';
import { Save, Settings, Phone, Clock, Truck, MessageCircle, Wallet, Banknote, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingItem {
  key: string;
  value: string;
  description?: string;
}

interface WalletItem {
  name: string;
  number: string;
  active: boolean;
}

interface BankItem {
  name: string;
  account_number: string;
  account_holder: string;
  active: boolean;
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
  const { settings: contextSettings, loading: contextLoading, refresh } = useSettings();
  const [savedSettings, setSavedSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [banks, setBanks] = useState<BankItem[]>([]);

  useEffect(() => {
    if (!contextLoading) {
      if (Object.keys(contextSettings).length > 0) {
        setSavedSettings(contextSettings);
      } else {
        const defaultMap: Record<string, string> = {};
        DEFAULT_SETTINGS.forEach(s => { defaultMap[s.key] = s.value; });
        setSavedSettings(defaultMap);
      }
      setLoading(false);
    }
  }, [contextLoading, contextSettings]);

  useEffect(() => {
    if (Object.keys(savedSettings).length > 0) {
      try {
        const w = JSON.parse(savedSettings['payment_wallets'] || '[]');
        setWallets(Array.isArray(w) ? w : []);
      } catch { setWallets([]); }
      try {
        const b = JSON.parse(savedSettings['payment_banks'] || '[]');
        setBanks(Array.isArray(b) ? b : []);
      } catch { setBanks([]); }
    }
  }, [savedSettings]);

  const handleChange = (key: string, value: string) => {
    setSavedSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');

    const upsertData = [
      ...DEFAULT_SETTINGS.map(s => ({
        setting_key: s.key,
        value: savedSettings[s.key] ?? s.value,
      })),
      { setting_key: 'payment_wallets', value: JSON.stringify(wallets) },
      { setting_key: 'payment_banks', value: JSON.stringify(banks) },
    ];

    const { error } = await supabase.from('site_settings').upsert(upsertData, { onConflict: 'setting_key' });

    if (error) {
      setSaveMessage('⚠️ حدث خطأ أثناء الحفظ: ' + error.message);
    } else {
      setSaveMessage('✓ تم حفظ الإعدادات بنجاح!');
      refresh();
    }

    setSaving(false);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const addWallet = () => {
    setWallets(prev => [...prev, { name: '', number: '', active: true }]);
  };

  const updateWallet = (index: number, field: keyof WalletItem, value: string | boolean) => {
    setWallets(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeWallet = (index: number) => {
    setWallets(prev => prev.filter((_, i) => i !== index));
  };

  const addBank = () => {
    setBanks(prev => [...prev, { name: '', account_number: '', account_holder: '', active: true }]);
  };

  const updateBank = (index: number, field: keyof BankItem, value: string | boolean) => {
    setBanks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeBank = (index: number) => {
    setBanks(prev => prev.filter((_, i) => i !== index));
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

  const inputStyle: React.CSSProperties = {
    display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600,
  };

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
                    <label style={inputStyle}>
                      {setting.description}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={savedSettings[setting.key] ?? setting.value}
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

        {/* ━━━━━ Payment Settings ━━━━━ */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            <Wallet size={20} color="var(--gold)" />
            إعدادات الدفع
          </h2>

          {/* Wallets */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              <Banknote size={18} color="var(--gold)" />
              المحافظ الإلكترونية
            </h3>
            {wallets.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>لا توجد محافظ مضافة. أضف محفظة جديدة.</p>
            )}
            {wallets.map((wallet, index) => (
              <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '16px', marginBottom: '12px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--border)', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <label style={inputStyle}>اسم المحفظة</label>
                  <input type="text" className="form-input" value={wallet.name} onChange={e => updateWallet(index, 'name', e.target.value)} placeholder="جوالي" />
                </div>
                <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                  <label style={inputStyle}>رقم المحفظة</label>
                  <input type="text" className="form-input" value={wallet.number} onChange={e => updateWallet(index, 'number', e.target.value)} placeholder="777777777" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => updateWallet(index, 'active', !wallet.active)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: wallet.active ? '#10b981' : 'var(--text-muted)', padding: '4px' }}
                    title={wallet.active ? 'مفعل' : 'غير مفعل'}
                  >
                    {wallet.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{wallet.active ? 'مفعل' : 'غير مفعل'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeWallet(index)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Trash2 size={16} /> حذف
                </button>
              </div>
            ))}
            <button type="button" onClick={addWallet} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 20px' }}>
              <Plus size={16} /> إضافة محفظة
            </button>
          </div>

          {/* Banks */}
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              <Banknote size={18} color="var(--gold)" />
              الحسابات البنكية
            </h3>
            {banks.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>لا توجد حسابات بنكية مضافة. أضف حساباً جديداً.</p>
            )}
            {banks.map((bank, index) => (
              <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: '16px', marginBottom: '12px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--border)', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <label style={inputStyle}>اسم البنك</label>
                  <input type="text" className="form-input" value={bank.name} onChange={e => updateBank(index, 'name', e.target.value)} placeholder="بنك الكريمي" />
                </div>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <label style={inputStyle}>رقم الحساب</label>
                  <input type="text" className="form-input" value={bank.account_number} onChange={e => updateBank(index, 'account_number', e.target.value)} placeholder="123456789" />
                </div>
                <div style={{ flex: '1 1 160px', minWidth: '140px' }}>
                  <label style={inputStyle}>اسم صاحب الحساب</label>
                  <input type="text" className="form-input" value={bank.account_holder} onChange={e => updateBank(index, 'account_holder', e.target.value)} placeholder="محمد أحمد" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => updateBank(index, 'active', !bank.active)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: bank.active ? '#10b981' : 'var(--text-muted)', padding: '4px' }}
                    title={bank.active ? 'مفعل' : 'غير مفعل'}
                  >
                    {bank.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{bank.active ? 'مفعل' : 'غير مفعل'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeBank(index)}
                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Trash2 size={16} /> حذف
                </button>
              </div>
            ))}
            <button type="button" onClick={addBank} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', padding: '10px 20px' }}>
              <Plus size={16} /> إضافة حساب بنكي
            </button>
          </div>
        </div>

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
