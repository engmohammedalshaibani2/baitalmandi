# 🚀 البدء السريع | Quick Start

## الطريقة الأولى: استخدام الملف HTML مباشرة (الأسهل)

### الخطوات:

1. **انسخ الملفات التالية إلى موقعك:**
   ```
   ✓ example.html
   ✓ sanaa-districts.geojson
   ```

2. **ضع الملفات في نفس المجلد:**
   ```
   your-website/
   ├── example.html
   └── sanaa-districts.geojson
   ```

3. **افتح `example.html` في المتصفح:**
   - انقر مزدوج على الملف
   - أو اسحبه إلى المتصفح
   - أو استخدم `http://localhost:8000/example.html`

✅ **تم! الخريطة تعمل الآن**

---

## الطريقة الثانية: تشغيل خادم محلي

### باستخدام Python:

```bash
# انتقل إلى مجلد الملفات
cd /path/to/sanaa-map-integration

# شغل الخادم
python3 -m http.server 8000

# افتح المتصفح على:
# http://localhost:8000/example.html
```

### باستخدام Node.js:

```bash
# تثبيت http-server (مرة واحدة فقط)
npm install -g http-server

# شغل الخادم
http-server

# افتح المتصفح على:
# http://localhost:8080/example.html
```

---

## الطريقة الثالثة: التكامل مع موقعك الحالي

### أضف هذا الكود في صفحتك:

```html
<!-- في قسم <head> -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- في قسم <body> -->
<div id="map" style="height: 600px;"></div>

<!-- قبل </body> -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
    // تهيئة الخريطة
    const map = L.map('map').setView([15.35, 44.2], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
    }).addTo(map);
    
    // تحميل GeoJSON
    fetch('sanaa-districts.geojson')
        .then(res => res.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    fillColor: '#FFFFFF',
                    color: '#9AA0A6',
                    weight: 1.5,
                    fillOpacity: 0.6
                }
            }).addTo(map);
        });
</script>
```

---

## 📁 الملفات المطلوبة

| الملف | الوصف | الحجم |
|------|-------|-------|
| `example.html` | مثال HTML كامل جاهز للاستخدام | ~15 KB |
| `sanaa-districts.geojson` | بيانات المناطق الجغرافية | ~15 KB |
| `INTEGRATION_GUIDE.md` | دليل التكامل الشامل | ~27 KB |
| `GEOJSON_DOCUMENTATION.md` | توثيق بيانات GeoJSON | ~10 KB |
| `README.md` | ملف README الرئيسي | ~11 KB |

---

## ⚙️ التخصيص

### تغيير مركز الخريطة:

```javascript
// بدلاً من:
map.setView([15.35, 44.2], 12);

// استخدم إحداثيات جديدة:
map.setView([latitude, longitude], zoomLevel);
```

### تغيير الألوان:

```javascript
style: {
    fillColor: '#YOUR_COLOR',      // لون الملء
    color: '#YOUR_BORDER_COLOR',   // لون الحدود
    weight: 1.5,                    // سمك الحدود
    fillOpacity: 0.6                // شفافية الملء
}
```

### تغيير حجم الخريطة:

```html
<!-- غيّر height حسب احتياجك -->
<div id="map" style="height: 800px;"></div>
```

---

## 🔍 اختبار الخريطة

### تحقق من:

- ✓ ظهور الخريطة بشكل صحيح
- ✓ عمل البحث عن المناطق
- ✓ تبديل اللغة (العربية/الإنجليزية)
- ✓ النقر على المناطق يعرض المعلومات
- ✓ التكبير والتصغير يعمل

---

## 🐛 استكشاف الأخطاء

### المشكلة: الخريطة لا تظهر

**الحل:**
```javascript
// افتح console (F12) وتحقق من الأخطاء
console.log('Leaflet:', L);
console.log('Map:', map);
```

### المشكلة: GeoJSON لا يحمل

**الحل:**
```javascript
// تحقق من مسار الملف
fetch('sanaa-districts.geojson')
    .then(r => r.json())
    .then(d => console.log('Loaded:', d))
    .catch(e => console.error('Error:', e));
```

### المشكلة: البحث لا يعمل

**الحل:**
- تأكد من أن البيانات حملت بنجاح
- افتح console وتحقق من الأخطاء
- تحقق من قيمة البحث

---

## 📞 الدعم

للمساعدة والدعم:
- 📧 Email: support@manus.im
- 🌐 Website: https://manus.im

---

## 📚 موارد إضافية

- [توثيق Leaflet](https://leafletjs.com/reference.html)
- [معايير GeoJSON](https://tools.ietf.org/html/rfc7946)
- [OpenStreetMap](https://www.openstreetmap.org/)

---

**آخر تحديث:** 2026-06-14
**الإصدار:** 1.0
