'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useSettings } from '@/lib/settings-context';
import { createOrder, calculateDeliveryFeeServer } from '@/actions/orders';
import { Trash2, Plus, Minus, ArrowRight, MessageCircle, CheckCircle, ShoppingBag, Copy, Wallet, MapPin, Crosshair } from 'lucide-react';

function generateIdempotencyKey(): string {
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
import { getDeliveryRoutes } from '@/lib/maps/getDeliveryRoute';
import { validateYemeniPhone, validateFullName, validateDeliveryAddress } from '@/lib/validation';
import { buildWhatsAppOrderMessage, formatOrderDate, getArabicStatus } from '@/lib/whatsapp-message';
import { useToast } from '@/components/ui/Toast';

import 'leaflet/dist/leaflet.css';

interface WalletItem { name: string; number: string; active: boolean; }
interface BankItem { name: string; account_number: string; account_holder: string; active: boolean; }

interface DeliveryInfo {
  lat: number;
  lng: number;
  fee: number;
  distanceKm: number;
  addressSuggestion: string;
}

export default function MyOrdersPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { showToast } = useToast();
  const whatsappNumber = settings['whatsapp_order_number'] || settings['phone_delivery_whatsapp'] || '967779898617';
  const minOrderAmount = parseInt(settings['min_order_amount']) || 0;
  const currency = settings['currency'] || 'ريال';

  let wallets: WalletItem[] = [];
  try { const w = JSON.parse(settings['payment_wallets'] || '[]'); wallets = Array.isArray(w) ? w.filter((x: any) => x.active) : []; } catch {}
  let banks: BankItem[] = [];
  try { const b = JSON.parse(settings['payment_banks'] || '[]'); banks = Array.isArray(b) ? b.filter((x: any) => x.active) : []; } catch {}

  const { items: cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCartStore();
  const cartTotal = getCartTotal();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const [idempotencyKey] = useState(() => generateIdempotencyKey());

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet' | 'transfer'>('cash');
  const [selectedWalletIdx, setSelectedWalletIdx] = useState<number | null>(null);
  const [selectedBankIdx, setSelectedBankIdx] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);
  const routeLineRef = useRef<any>(null);
  const altRouteLinesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const totalWithDelivery = cartTotal + (deliveryInfo?.fee || 0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (deliveryInfo?.addressSuggestion && !customerInfo.address) {
      setCustomerInfo(prev => ({ ...prev, address: deliveryInfo.addressSuggestion }));
    }
  }, [deliveryInfo?.addressSuggestion]);

  useEffect(() => {
    if (wallets.length > 0 && selectedWalletIdx === null) setSelectedWalletIdx(0);
  }, [wallets]);

  useEffect(() => {
    if (banks.length > 0 && selectedBankIdx === null) setSelectedBankIdx(0);
  }, [banks]);

  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;

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

      const map = L.map(el, {
        center: [15.3547, 44.2067],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomleft' }).addTo(map);

      map.on('click', (e: any) => {
        handleLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      mapInstance.current = map;

      const restLat = parseFloat(settings['restaurant_lat'] || '15.360035270551275');
      const restLng = parseFloat(settings['restaurant_lng'] || '44.17484814594534');
      if (restLat && restLng) {
        const restIcon = L.divIcon({
          html: '<div style="background:#C59B5F;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>',
          className: '',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        restaurantMarkerRef.current = L.marker([restLat, restLng], { icon: restIcon, interactive: false }).addTo(map);
      }

      setMapReady(true);
    };

    initMap();

    return () => {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      altRouteLinesRef.current.forEach(line => line.remove());
      altRouteLinesRef.current = [];
      if (restaurantMarkerRef.current) {
        restaurantMarkerRef.current.remove();
        restaurantMarkerRef.current = null;
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mounted]);

  const [leafletModule, setLeafletModule] = useState<any>(null);
  useEffect(() => {
    import('leaflet').then(mod => setLeafletModule(mod.default));
  }, []);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!mapInstance.current || !leafletModule) return;
    const L = leafletModule;

    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng]);
    } else {
      markerInstance.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstance.current);
      markerInstance.current.on('dragend', () => {
        const pos = markerInstance.current.getLatLng();
        handleLocationSelect(pos.lat, pos.lng);
      });
    }
    mapInstance.current.setView([lat, lng], mapInstance.current.getZoom());
  }, [leafletModule]);

  useEffect(() => {
    if (!deliveryInfo || !mapInstance.current || !leafletModule) return;

    let cancelled = false;
    const restLat = parseFloat(settings['restaurant_lat'] || '15.360035270551275');
    const restLng = parseFloat(settings['restaurant_lng'] || '44.17484814594534');

    setRouteLoading(true);
    getDeliveryRoutes(restLat, restLng, deliveryInfo.lat, deliveryInfo.lng)
      .then(result => {
        if (cancelled) return;
        const L = leafletModule;
        const map = mapInstance.current;
        const allCoords: [number, number][] = [];

        if (routeLineRef.current) {
          routeLineRef.current.remove();
          routeLineRef.current = null;
        }
        altRouteLinesRef.current.forEach(line => line.remove());
        altRouteLinesRef.current = [];

        if (result.primary && result.primary.coordinates.length >= 2) {
          routeLineRef.current = L.polyline(result.primary.coordinates, {
            color: '#10b981',
            weight: 4,
            opacity: 0.85,
          }).addTo(map);
          allCoords.push(...result.primary.coordinates);
        }

        const altColors = ['#3b82f6', '#6366f1'];
        result.alternatives.forEach((alt, idx) => {
          if (alt.coordinates.length >= 2) {
            const color = altColors[idx % altColors.length];
            const line = L.polyline(alt.coordinates, {
              color,
              weight: 2.5,
              opacity: 0.5,
              dashArray: '8, 6',
            }).addTo(map);
            altRouteLinesRef.current.push(line);
            allCoords.push(...alt.coordinates);
          }
        });

        if (allCoords.length > 0) {
          const bounds = L.latLngBounds(
            allCoords.map((coord: [number, number]) => L.latLng(coord[0], coord[1])),
          );
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      altRouteLinesRef.current.forEach(line => line.remove());
      altRouteLinesRef.current = [];
    };
  }, [deliveryInfo, leafletModule, settings]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setLocationError('');
    setLocationLoading(true);

    updateMarker(lat, lng);

    let addressSuggestion = '';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const geo = await res.json();
        const parts: string[] = [];
        if (geo.address?.suburb) parts.push(geo.address.suburb);
        if (geo.address?.road) parts.push(geo.address.road);
        if (geo.address?.neighbourhood) parts.push(geo.address.neighbourhood);
        addressSuggestion = parts.join(' - ');
      }
    } catch {}

    try {
      const result = await calculateDeliveryFeeServer(lat, lng);
      if (result.error) {
        setLocationError(result.error);
        setDeliveryInfo(null);
      } else {
        setDeliveryInfo({
          lat,
          lng,
          fee: result.fee,
          distanceKm: result.distanceKm,
          addressSuggestion: addressSuggestion,
        });
      }
    } catch (err: any) {
      setLocationError('تعذر حساب رسوم التوصيل');
      setDeliveryInfo(null);
    }

    setLocationLoading(false);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('متصفحك لا يدعم تحديد الموقع. يرجى اختيار الموقع من الخريطة');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('يرجى السماح بالوصول إلى موقعك أو اختيار الموقع من الخريطة');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('تعذر تحديد موقعك. يرجى اختيار الموقع من الخريطة');
            break;
          case error.TIMEOUT:
            setLocationError('انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى');
            break;
          default:
            setLocationError('حدث خطأ في تحديد الموقع');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(key);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  };

  const validateAll = (): boolean => {
    setFieldErrors({});

    const nameValid = validateFullName(customerInfo.name);
    const phoneValid = validateYemeniPhone(customerInfo.phone);
    const addrValid = validateDeliveryAddress(customerInfo.address);

    const errors: Record<string, string> = {};
    if (!nameValid.valid) errors.name = nameValid.error!;
    if (!phoneValid.valid) errors.phone = phoneValid.error!;
    if (!addrValid.valid) errors.address = addrValid.error!;

    const clientTotalWithDelivery = cartTotal + (deliveryInfo?.fee || 0);
    if (minOrderAmount > 0 && clientTotalWithDelivery < minOrderAmount) {
      errors.minAmount = `الحد الأدنى للطلب هو ${minOrderAmount} ${currency}. إجمالي الطلب مع التوصيل: ${clientTotalWithDelivery} ${currency}`;
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = errors.address ? addressRef : errors.phone ? phoneRef : nameRef;
      firstError.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.current?.focus();
      return false;
    }
    return true;
  };

  const createOrderAndRedirect = async (method: 'whatsapp' | 'website') => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    if (!deliveryInfo) {
      setLocationError('يرجى تحديد موقع التوصيل أولاً');
      submittingRef.current = false;
      return;
    }
    if (!validateAll()) {
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const orderItems = cart.flatMap<{
        price_id: string | null;
        category_name: string;
        item_name: string;
        size_label: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>(item => {
        const isOffer = item.isOffer && item.bundleItems && item.bundleItems.length > 0;
        return [{
          price_id: isOffer ? null : item.id,
          category_name: isOffer ? 'عروض' : item.category || 'General',
          item_name: isOffer ? item.name : item.name.split(' (')[0],
          size_label: isOffer ? 'عادي' : item.size || 'عادي',
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        }];
      });

      // === MULTI-OFFER EXTRACTION ===
      const offerCartItems = cart.filter(ci => ci.isOffer && ci.offerId);
      const offers = offerCartItems.length > 0
        ? offerCartItems.map(ci => ({
            offer_id: ci.offerId!,
            quantity: ci.quantity,
            bundle_items: (ci.bundleItems || []).map(bi => ({
              category_name: 'عروض',
              item_name: bi.name,
              size_label: bi.size || 'عادي',
              quantity: bi.quantity,
              unit_price: bi.price,
              total_price: bi.price * bi.quantity,
            })),
          }))
        : undefined;

      let notesWithPayment = notes || '';
      if (paymentMethod === 'wallet' && selectedWalletIdx !== null && wallets[selectedWalletIdx]) {
        notesWithPayment += `\n[وسيلة الدفع: محفظة ${wallets[selectedWalletIdx].name} - ${wallets[selectedWalletIdx].number}]`;
      } else if (paymentMethod === 'transfer' && selectedBankIdx !== null && banks[selectedBankIdx]) {
        notesWithPayment += `\n[وسيلة الدفع: تحويل ${banks[selectedBankIdx].name} - ${banks[selectedBankIdx].account_number}]`;
      } else if (paymentMethod === 'cash') {
        notesWithPayment += '\n[وسيلة الدفع: نقداً عند الاستلام]';
      }

      const order = await createOrder({
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        delivery_address: customerInfo.address.trim(),
        notes: notesWithPayment.trim() || undefined,
        items: orderItems,
        offers: offers,
        order_method: method,
        payment_method: paymentMethod,
        delivery_lat: deliveryInfo.lat,
        delivery_lng: deliveryInfo.lng,
        idempotency_key: idempotencyKey,
      });

      const isPaidPayment = paymentMethod === 'wallet' || paymentMethod === 'transfer';
      const shouldSendWhatsApp = method === 'whatsapp' || (method === 'website' && isPaidPayment);

      if (shouldSendWhatsApp) {
        const paymentInfo = {
          method: paymentMethod,
          walletName: paymentMethod === 'wallet' && selectedWalletIdx !== null ? wallets[selectedWalletIdx]?.name : undefined,
          walletNumber: paymentMethod === 'wallet' && selectedWalletIdx !== null ? wallets[selectedWalletIdx]?.number : undefined,
          bankName: paymentMethod === 'transfer' && selectedBankIdx !== null ? banks[selectedBankIdx]?.name : undefined,
          bankAccount: paymentMethod === 'transfer' && selectedBankIdx !== null ? banks[selectedBankIdx]?.account_number : undefined,
          bankHolder: paymentMethod === 'transfer' && selectedBankIdx !== null ? banks[selectedBankIdx]?.account_holder : undefined,
        };

        const orderItemsList = cart.flatMap(item => {
          if (item.isOffer && item.bundleItems) {
            return item.bundleItems.map(bi => ({
              name: bi.name,
              size: bi.size || 'عادي',
              quantity: bi.quantity * item.quantity,
              totalPrice: bi.price * bi.quantity * item.quantity,
            }));
          }
          return [{
            name: item.name.split(' (')[0],
            size: item.size || 'عادي',
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
          }];
        });

        const trackingOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        const whatsappUrl = buildWhatsAppOrderMessage({
          restaurantName: settings['restaurant_name'] || 'بيت المندي',
          whatsappNumber,
          order: {
            orderNumber: order.order_number,
            createdAt: formatOrderDate(order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt)),
            status: getArabicStatus(order.status),
            trackingUrl: `${trackingOrigin}/t/${order.tracking_token}`,
          },
          customer: {
            name: customerInfo.name.trim(),
            phone: customerInfo.phone.trim(),
            address: customerInfo.address.trim(),
          },
          items: orderItemsList,
          payment: paymentInfo,
          financials: {
            subtotal: cartTotal,
            deliveryFee: deliveryInfo.fee,
            discounts: 0,
            total: cartTotal + deliveryInfo.fee,
            currency,
          },
        });

        console.log('[WHATSAPP_ORDER_MESSAGE_GENERATED]', {
          orderId: order.id,
          paymentMethod,
          messageLength: whatsappUrl.length,
          redirectStatus: 'triggered',
        });

        window.open(whatsappUrl, '_blank');
        console.log('[WHATSAPP_REDIRECT_TRIGGERED]', {
          orderId: order.id,
          paymentMethod,
          messageLength: whatsappUrl.length,
          redirectStatus: 'success',
        });
      }

      clearCart();
      showToast('success', 'تم إنشاء الطلب بنجاح', `رقم الطلب: ${order.order_number}`);
      router.push(`/t/${order.tracking_token}`);
    } catch (err: any) {
      console.error('[MyOrders] Order creation failed:', {
        customer: customerInfo.name,
        phone: customerInfo.phone,
        itemsCount: cart.length,
        error: err,
      });
      showToast('error', 'فشل إنشاء الطلب', err?.message || 'تعذّر إنشاء الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const handleWebsiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryInfo) { setLocationError('يرجى تحديد موقع التوصيل أولاً'); return; }
    createOrderAndRedirect('website');
  };

  const handleWhatsAppOrder = () => {
    if (!deliveryInfo) { setLocationError('يرجى تحديد موقع التوصيل أولاً'); return; }
    createOrderAndRedirect('whatsapp');
  };

  if (!mounted) return null;

  return (
    <main style={{ paddingTop: '100px', paddingBottom: '80px', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          <ArrowRight size={20} /> العودة للرئيسية
        </Link>

        <h1 className="title-gold" style={{ fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>طلباتي</h1>

        {cart.length === 0 ? (
          <div className="glass-panel" style={{ padding: '50px 30px', textAlign: 'center', marginBottom: '30px' }}>
            <ShoppingBag size={64} style={{ color: 'var(--text-muted)', margin: '0 auto 20px', opacity: 0.5 }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>سلتك فارغة</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>لم تقم بإضافة أي أطباق بعد.</p>
            <Link href="/menu" className="btn-primary" style={{ padding: '14px 36px' }}>
              تصفح قائمة الطعام
            </Link>
          </div>
        ) : (
          <>
            <div className="glass-panel" style={{ padding: '28px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', color: 'var(--gold)' }}>
                إتمام الطلب
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--glass-bg)', borderRadius: '10px', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '120px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginRight: '8px' }}>× {item.quantity}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="title-gold" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.price * item.quantity} {currency}</span>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '6px 10px', cursor: 'pointer' }}><Minus size={14} /></button>
                        <span style={{ padding: '0 8px', fontWeight: 'bold', width: '24px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '6px 10px', cursor: 'pointer' }}><Plus size={14} /></button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                <Link href="/menu" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', fontSize: '0.85rem', padding: '8px 16px' }}>
                  <Plus size={14} /> إضافة المزيد
                </Link>
              </div>

              <form onSubmit={handleWebsiteSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>الاسم الكامل *</label>
                    <input ref={nameRef} type="text" className={`form-input ${fieldErrors.name ? 'input-error' : ''}`} value={customerInfo.name} onChange={e => { setCustomerInfo({ ...customerInfo, name: e.target.value }); setFieldErrors(prev => ({ ...prev, name: '' })); }} placeholder="الاسم الثنائي" required />
                    {fieldErrors.name && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.name}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>رقم الهاتف *</label>
                    <input ref={phoneRef} type="tel" className={`form-input ${fieldErrors.phone ? 'input-error' : ''}`} value={customerInfo.phone} onChange={e => { setCustomerInfo({ ...customerInfo, phone: e.target.value }); setFieldErrors(prev => ({ ...prev, phone: '' })); }} placeholder="77XXXXXXX" required style={{ direction: 'ltr', textAlign: 'right' }} />
                    {fieldErrors.phone && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.phone}</p>}
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <MapPin size={14} style={{ marginLeft: '6px', verticalAlign: 'middle' }} /> موقع التوصيل *
                    </label>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locationLoading}
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
                      >
                        <Crosshair size={16} /> {locationLoading ? 'جاري تحديد الموقع...' : '📍 تحديد موقعي الحالي'}
                      </button>
                    </div>

                    <div
                      ref={mapRef}
                      style={{
                        width: '100%',
                        height: '250px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        marginBottom: '12px',
                      }}
                    />

                    {locationLoading && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>
                        جاري حساب رسوم التوصيل...
                      </p>
                    )}

                    {locationError && (
                      <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>
                        {locationError}
                      </p>
                    )}

                    {routeLoading && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '8px', padding: '6px 12px', background: 'rgba(197,155,95,0.08)', borderRadius: '8px', textAlign: 'center' }}>
                        جاري تحميل مسار التوصيل...
                      </p>
                    )}

                    {deliveryInfo && !locationError && (
                      <div style={{
                        background: 'rgba(16,185,129,0.06)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '10px',
                        padding: '12px',
                        marginBottom: '12px',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>المسافة: </span>
                            <strong>{deliveryInfo.distanceKm} كم</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>رسوم التوصيل: </span>
                            <strong style={{ color: 'var(--gold)' }}>{deliveryInfo.fee > 0 ? `${deliveryInfo.fee} ${currency}` : 'مجاناً'}</strong>
                          </div>
                        </div>
                        {deliveryInfo.addressSuggestion && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(16,185,129,0.15)' }}>
                            <MapPin size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                            {deliveryInfo.addressSuggestion}
                          </p>
                        )}
                      </div>
                    )}

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '8px' }}>
                      اختر موقعك على الخريطة أو استخدم الزر أعلاه لتحديد موقعك تلقائياً
                    </p>

                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      عنوان التوصيل *
                    </label>
                    <textarea
                      ref={addressRef}
                      className={`form-input ${fieldErrors.address ? 'input-error' : ''}`}
                      value={customerInfo.address}
                      onChange={e => { setCustomerInfo({ ...customerInfo, address: e.target.value }); setFieldErrors(prev => ({ ...prev, address: '' })); }}
                      placeholder="مثال: شارع الزبيري، بجوار جامع الخير، الدور الثاني"
                      rows={2}
                    />
                    {fieldErrors.address && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px' }}>{fieldErrors.address}</p>}
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>
                      يمكنك تعديل العنوان المقترح أو كتابة عنوان دقيق (10 أحرف على الأقل)
                    </small>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>ملاحظات</label>
                    <input type="text" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: لا أريد بصلاً" />
                  </div>
                </div>

                {fieldErrors.minAmount && (
                  <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '4px', marginBottom: '10px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>{fieldErrors.minAmount}</p>
                )}

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Wallet size={14} style={{ marginLeft: '6px', verticalAlign: 'middle' }} /> وسيلة الدفع
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: paymentMethod === 'cash' ? '2px solid var(--gold)' : '1px solid var(--border)', cursor: 'pointer', background: paymentMethod === 'cash' ? 'rgba(197,155,95,0.05)' : 'transparent' }}>
                      <input type="radio" name="payment" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} style={{ accentColor: 'var(--gold)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>نقداً عند الاستلام</span>
                    </label>

                    {wallets.length > 0 && (
                      <div style={{ padding: '10px 14px', borderRadius: '10px', border: paymentMethod === 'wallet' ? '2px solid var(--gold)' : '1px solid var(--border)', background: paymentMethod === 'wallet' ? 'rgba(197,155,95,0.05)' : 'transparent' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: paymentMethod === 'wallet' ? '8px' : 0 }}>
                          <input type="radio" name="payment" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} style={{ accentColor: 'var(--gold)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>محفظة إلكترونية</span>
                        </label>
                        {paymentMethod === 'wallet' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {wallets.map((w, i) => (
                              <div key={i} onClick={() => setSelectedWalletIdx(i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedWalletIdx === i ? 'rgba(197,155,95,0.1)' : 'var(--glass-bg)', border: selectedWalletIdx === i ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.name}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{w.number}</div>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); copyToClipboard(w.number, `w-${i}`); }} style={{ background: 'rgba(197,155,95,0.12)', border: 'none', color: 'var(--gold)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  <Copy size={12} /> {copiedIndex === `w-${i}` ? 'تم' : 'نسخ'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {banks.length > 0 && (
                      <div style={{ padding: '10px 14px', borderRadius: '10px', border: paymentMethod === 'transfer' ? '2px solid var(--gold)' : '1px solid var(--border)', background: paymentMethod === 'transfer' ? 'rgba(197,155,95,0.05)' : 'transparent' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: paymentMethod === 'transfer' ? '8px' : 0 }}>
                          <input type="radio" name="payment" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} style={{ accentColor: 'var(--gold)' }} />
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>تحويل بنكي</span>
                        </label>
                        {paymentMethod === 'transfer' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {banks.map((b, i) => (
                              <div key={i} onClick={() => setSelectedBankIdx(i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', background: selectedBankIdx === i ? 'rgba(197,155,95,0.1)' : 'var(--glass-bg)', border: selectedBankIdx === i ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.name}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>{b.account_number}</div>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); copyToClipboard(b.account_number, `b-${i}`); }} style={{ background: 'rgba(197,155,95,0.12)', border: 'none', color: 'var(--gold)', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                  <Copy size={12} /> {copiedIndex === `b-${i}` ? 'تم' : 'نسخ'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>المجموع الفرعي</span>
                    <span>{cartTotal} {currency}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>رسوم التوصيل</span>
                    <span style={{ color: 'var(--gold)' }}>
                      {deliveryInfo ? (
                        deliveryInfo.fee > 0 ? `${deliveryInfo.fee} ${currency}` : 'مجاناً'
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>يُحدد بعد اختيار الموقع</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--gold)', borderTop: '1px solid var(--border)', paddingTop: '10px', fontSize: '1.1rem' }}>
                    <span>الإجمالي</span>
                    <span>{deliveryInfo ? `${totalWithDelivery} ${currency}` : `${cartTotal} ${currency}`}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !deliveryInfo}
                    style={{ flex: 1, minWidth: '180px', justifyContent: 'center', padding: '14px', opacity: (!deliveryInfo && !loading) ? 0.6 : 1 }}
                  >
                    {loading ? 'جاري الإرسال...' : '✓ تأكيد الطلب'}
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    disabled={loading || !deliveryInfo}
                    style={{
                      flex: 1, minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px',
                      background: '#25D366', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                      opacity: (!deliveryInfo && !loading) ? 0.6 : 1,
                    }}
                  >
                    <MessageCircle size={20} /> طلب عبر واتساب
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
