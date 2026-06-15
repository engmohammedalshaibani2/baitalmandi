# خريطة صنعاء التفاعلية | Sana'a Interactive Map

خريطة تفاعلية عالية الدقة لمديريات وأحياء صنعاء (أمانة العاصمة) بتصنيف إداري متعدد المستويات يحاكي نظام Google Maps.

A high-precision interactive map of Sana'a districts and neighborhoods (Amanat Al-Asimah) with multi-level administrative classification mimicking Google Maps.

---

## 🎯 الميزات | Features

### 🗺️ خريطة تفاعلية متقدمة | Advanced Interactive Map
- عرض حدود المديريات والأحياء بدقة عالية
- تكبير وتصغير سلس (Zoom: 10-19)
- نمط خرائط شبيه بـ Google Maps (CartoDB Light)
- تفاعل فوري عند الإشارة والنقر

### 📊 بيانات GeoJSON شاملة | Comprehensive GeoJSON Data
- **10 مديريات** رئيسية مع إحداثيات دقيقة
- **89 حياً** مع معلومات تفصيلية
- **791 حارة** و **52 قرية** موثقة
- بيانات سكانية ومساحية محدثة (2004-2022)

### 🔍 البحث والتصفية المتقدمة | Advanced Search & Filtering
- بحث فوري عن المناطق بالعربية والإنجليزية
- فرز حسب: الاسم، السكان، المساحة
- عرض ديناميكي للنتائج مع الإحصائيات

### 🌐 دعم اللغات | Multi-language Support
- واجهة كاملة بالعربية والإنجليزية
- أسماء المناطق بكلا اللغتين
- توثيق شامل بالعربية والإنجليزية

### 📈 معلومات إحصائية | Statistical Information
- عدد السكان والمساحة لكل منطقة
- حساب الكثافة السكانية تلقائياً
- نسبة السكان من الإجمالي
- رسوم بيانية ملونة للبيانات

### 🎨 تصميم احترافي | Professional Design
- واجهة مستخدم نظيفة وحديثة
- ألوان متناسقة مع معايير Google Maps
- تصميم متجاوب (Responsive Design)
- انتقالات سلسة وتفاعلات سريعة

---

## 📁 هيكل الملفات | File Structure

```
sanaa-map-viewer/
├── client/
│   ├── public/
│   │   ├── sanaa-districts.geojson          # بيانات GeoJSON الرئيسية
│   │   └── GEOJSON_DOCUMENTATION.md         # توثيق GeoJSON
│   ├── src/
│   │   ├── components/
│   │   │   ├── SanaaMapViewer.tsx           # المكون الرئيسي للخريطة
│   │   │   ├── DistrictsList.tsx            # قائمة المناطق المتقدمة
│   │   │   └── DistrictDetails.tsx          # تفاصيل المنطقة
│   │   ├── pages/
│   │   │   └── Home.tsx                     # الصفحة الرئيسية
│   │   └── App.tsx                          # تطبيق React الرئيسي
│   └── index.html
├── README.md                                 # هذا الملف
└── package.json
```

---

## 🚀 البدء السريع | Quick Start

### المتطلبات | Requirements
- Node.js 18+
- pnpm أو npm

### التثبيت | Installation

```bash
# استنساخ المشروع
git clone <repository-url>
cd sanaa-map-viewer

# تثبيت المكتبات
pnpm install

# تشغيل خادم التطوير
pnpm dev
```

### الوصول | Access
- **المحلي | Local:** http://localhost:3000
- **الويب | Web:** https://3000-i5u20ahlab5wytaw4untt-5ee812ac.us2.manus.computer

---

## 📊 بيانات GeoJSON

### الهيكل الأساسي | Basic Structure

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "name": "Sana'a Administrative Boundaries",
    "version": "1.0",
    "source": "OpenStreetMap + Yemen Administrative Boundaries"
  },
  "features": [
    {
      "type": "Feature",
      "id": "sanaa-shubub",
      "properties": {
        "name_ar": "شعوب",
        "name_en": "Shubub",
        "admin_level": 6,
        "population": 213939,
        "area_km2": 15.0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[44.12, 15.32], ...]]
      }
    }
  ]
}
```

### المستويات الإدارية | Administrative Levels

| المستوى | Level | النوع | Type | مثال | Example |
|--------|-------|------|------|------|---------|
| 4 | 4 | محافظة | Governorate | أمانة العاصمة | Amanat Al-Asimah |
| 6 | 6 | مديرية | District | شعوب | Shubub |
| 8 | 8 | حي | Neighborhood | حي السبعين | Al-Sabain Quarter |

### الخصائص المتاحة | Available Properties

- `name_ar` - الاسم بالعربية
- `name_en` - الاسم بالإنجليزية
- `admin_level` - مستوى التقسيم الإداري
- `category` - تصنيف المنطقة
- `population` - عدد السكان
- `area_km2` - المساحة بالكيلومتر المربع
- `description_ar` - الوصف بالعربية
- `description_en` - الوصف بالإنجليزية
- `center` - إحداثيات المركز [lon, lat]
- `zoom_level` - مستوى التكبير الموصى به

---

## 🎨 التصميم والأنماط | Design & Styling

### نظام الألوان | Color Scheme

```css
/* المحافظة - Governorate */
Fill Color: #E8EAED (Light Gray)
Border Color: #BDC1C6 (Gray)
Border Style: Dashed (5,5)

/* المديرية - District */
Fill Color: #FFFFFF (White)
Border Color: #9AA0A6 (Medium Gray)
Border Width: 1.5px

/* الحي - Neighborhood */
Fill Color: #F8F9FA (Very Light Gray)
Border Color: #DADCE0 (Light Gray)
Border Width: 1px

/* التحديد - Selected/Hover */
Fill Color: #E8F0FE (Light Blue)
Border Color: #1F2937 (Dark Gray)
Border Width: 2px
```

### خط الخريطة | Map Tile

- **المزود | Provider:** CartoDB
- **النمط | Style:** Light (يشبه Google Maps)
- **الإسناد | Attribution:** OpenStreetMap contributors & CARTO

---

## 🔧 الاستخدام المتقدم | Advanced Usage

### البحث عن منطقة | Search for District

```typescript
// البحث يتم تلقائياً عند الكتابة في حقل البحث
// Search happens automatically as you type in the search field
const searchQuery = "شعوب"; // or "Shubub"
// النتائج تظهر فوراً
// Results appear instantly
```

### الفرز | Sorting

```typescript
// يمكن الفرز حسب:
// Can sort by:
- الاسم (Name)
- السكان (Population)
- المساحة (Area)
```

### التفاعل مع الخريطة | Map Interaction

```typescript
// النقر على منطقة في الخريطة
// Click on a district in the map
// ← يعرض معلومات تفصيلية في الشريط الجانبي
// ← Shows detailed information in the sidebar

// النقر على منطقة في القائمة
// Click on a district in the list
// ← يبرز المنطقة على الخريطة
// ← Highlights the district on the map
```

---

## 📈 الإحصائيات | Statistics

### صنعاء - الإجمالي | Sana'a - Total

| المقياس | Metric | القيمة | Value |
|--------|--------|--------|-------|
| عدد المديريات | Districts | 10 | 10 |
| عدد الأحياء | Neighborhoods | 89 | 89 |
| عدد الحارات | Quarters | 791 | 791 |
| عدد القرى | Villages | 52 | 52 |
| إجمالي السكان | Total Population | 1,747,834 | 1,747,834 |
| إجمالي المساحة | Total Area | 385.3 km² | 385.3 km² |
| متوسط الكثافة | Average Density | 4,534.8/km² | 4,534.8/km² |

### أكبر المديريات | Largest Districts

1. **السبعين** - 311,203 نسمة (17.8%)
2. **معين** - 265,469 نسمة (15.2%)
3. **شعوب** - 213,939 نسمة (12.2%)
4. **بني الحارث** - 184,509 نسمة (10.6%)
5. **الثورة** - 170,145 نسمة (9.7%)

### أعلى الكثافات السكانية | Highest Population Densities

1. **صنعاء القديمة** - 35,221 per km²
2. **التحرير** - 23,892 per km²
3. **معين** - 23,290 per km²
4. **شعوب** - 14,263 per km²
5. **الوحدة** - 13,105 per km²

---

## 🛠️ التطوير | Development

### المكتبات المستخدمة | Dependencies

- **React 19** - واجهة المستخدم
- **Leaflet** - مكتبة الخرائط
- **Tailwind CSS 4** - التصميم
- **shadcn/ui** - مكونات واجهة المستخدم
- **Lucide React** - الأيقونات

### البناء | Build

```bash
# بناء الإنتاج
pnpm build

# معاينة الإنتاج
pnpm preview

# فحص TypeScript
pnpm check
```

### الاختبار | Testing

```bash
# تشغيل الاختبارات
pnpm test

# مراقبة الاختبارات
pnpm test:watch
```

---

## 📝 الترخيص | License

هذا المشروع مرخص تحت **Open Data Commons Open Database License (ODbL)**

This project is licensed under the **Open Data Commons Open Database License (ODbL)**

---

## 🤝 المساهمة | Contributing

نرحب بالمساهمات والاقتراحات لتحسين المشروع!

We welcome contributions and suggestions to improve the project!

### كيفية المساهمة | How to Contribute

1. Fork المشروع
2. أنشئ فرع للميزة الجديدة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📞 التواصل | Contact

- 📧 **البريد الإلكتروني | Email:** support@manus.im
- 🌐 **الموقع | Website:** https://manus.im
- 📱 **وسائل التواصل | Social:** @manus_im

---

## 📚 موارد إضافية | Additional Resources

- [توثيق GeoJSON](./public/GEOJSON_DOCUMENTATION.md) - GeoJSON Documentation
- [معايير GeoJSON](https://tools.ietf.org/html/rfc7946) - GeoJSON Standards
- [توثيق Leaflet](https://leafletjs.com/reference.html) - Leaflet Documentation
- [OpenStreetMap](https://www.openstreetmap.org/) - OpenStreetMap

---

## 🙏 شكر وتقدير | Acknowledgments

- **OpenStreetMap** - بيانات الخرائط الأساسية
- **Yemen Administrative Boundaries** - بيانات التقسيمات الإدارية
- **CARTO** - خدمة خرائط الويب
- **Manus Team** - منصة التطوير

---

**آخر تحديث | Last Updated:** 2026-06-14
**الإصدار | Version:** 1.0.0
**الحالة | Status:** ✅ جاهز للإنتاج | Ready for Production
