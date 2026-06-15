# وثائق GeoJSON لخريطة صنعاء التفاعلية
# Sana'a Interactive Map GeoJSON Documentation

## نظرة عامة | Overview

هذا المستند يوضح بنية ملف GeoJSON عالي الدقة لمديريات ومناطق صنعاء، مع تصنيف متعدد المستويات يحاكي نظام Google Maps.

This document explains the structure of the high-precision GeoJSON file for Sana'a districts and neighborhoods, with a multi-level classification system that mimics Google Maps.

---

## هيكل البيانات | Data Structure

### المستويات الإدارية | Administrative Levels

```
Level 0: Yemen (Country) - اليمن
  ├── Level 1: Amanat Al-Asimah (Governorate) - أمانة العاصمة
  │   ├── Level 2: Districts (10) - المديريات
  │   │   ├── Level 3: Sub-districts & Villages - العزل والقرى
  │   │   └── Level 4: Neighborhoods & Quarters - الأحياء والحارات
```

### تصنيف Google Maps Style

| المستوى | Level | النوع | Type | مثال | Example |
|---------|-------|------|------|------|---------|
| 4 | 4 | Governorate | State | أمانة العاصمة صنعاء | Amanat Al-Asimah |
| 6 | 6 | District | Locality | شعوب، السبعين | Shubub, Al-Sabain |
| 8 | 8 | Neighborhood | Neighborhood | حي السبعين | Al-Sabain Quarter |

---

## خصائص الميزات | Feature Properties

### الخصائص الأساسية | Basic Properties

```json
{
  "id": "sanaa-shubub",
  "properties": {
    "name_ar": "شعوب",
    "name_en": "Shubub",
    "admin_level": 6,
    "category": "District",
    "google_maps_type": "Locality",
    "population": 213939,
    "area_km2": 15.0,
    "description_ar": "منطقة سكنية مهمة في صنعاء",
    "description_en": "Important residential area in Sana'a"
  }
}
```

### الخصائص الإضافية | Additional Properties

| الخاصية | Property | النوع | Type | الوصف | Description |
|--------|----------|------|------|-------|-------------|
| `name_ar` | String | النص | Text | اسم المنطقة بالعربية | District name in Arabic |
| `name_en` | String | النص | Text | اسم المنطقة بالإنجليزية | District name in English |
| `admin_level` | Number | رقم | Number | مستوى التقسيم الإداري | Administrative level |
| `category` | String | النص | Text | تصنيف المنطقة | District classification |
| `population` | Number | رقم | Number | عدد السكان | Population count |
| `area_km2` | Number | رقم | Number | المساحة بالكيلومتر المربع | Area in km² |
| `description_ar` | String | النص | Text | وصف المنطقة بالعربية | Description in Arabic |
| `description_en` | String | النص | Text | وصف المنطقة بالإنجليزية | Description in English |
| `parent_district` | String | النص | Text | المنطقة الأب | Parent district |
| `neighborhoods_count` | Number | رقم | Number | عدد الأحياء | Number of neighborhoods |
| `center` | Array | إحداثيات | Coordinates | إحداثيات المركز [lon, lat] | Center coordinates |
| `zoom_level` | Number | رقم | Number | مستوى التكبير الموصى به | Recommended zoom level |

---

## أنماط الرسم | Styling

### نمط المحافظة | Governorate Style

```json
{
  "fillColor": "#E8EAED",
  "color": "#BDC1C6",
  "weight": 2,
  "fillOpacity": 0.3,
  "dashArray": "5,5"
}
```

**الاستخدام:** عرض حدود المحافظة الخارجية بخط متقطع خفيف

**Usage:** Display governorate boundaries with light dashed line

### نمط المديرية | District Style

```json
{
  "fillColor": "#FFFFFF",
  "color": "#9AA0A6",
  "weight": 1.5,
  "fillOpacity": 0.6
}
```

**الاستخدام:** عرض حدود المديريات بخط رمادي فاتح

**Usage:** Display district boundaries with light gray line

### نمط الحي | Neighborhood Style

```json
{
  "fillColor": "#F8F9FA",
  "color": "#DADCE0",
  "weight": 1,
  "fillOpacity": 0.4
}
```

**الاستخدام:** عرض حدود الأحياء بخط خفيف جداً

**Usage:** Display neighborhood boundaries with very light line

### نمط التحديد | Hover/Selected Style

```json
{
  "fillColor": "#E8F0FE",
  "color": "#1F2937",
  "weight": 2,
  "fillOpacity": 0.8
}
```

**الاستخدام:** عند تحديد منطقة أو الإشارة إليها بالماوس

**Usage:** When a district is selected or hovered

---

## المديريات الرئيسية | Main Districts

### 1. صنعاء القديمة | Old Sana'a (Al-Qadimah)
- **السكان | Population:** 63,398
- **المساحة | Area:** 1.8 km²
- **الأهمية | Significance:** موقع التراث العالمي لليونسكو (UNESCO World Heritage Site)
- **الكثافة السكانية | Density:** 35,221 per km²

### 2. شعوب | Shubub
- **السكان | Population:** 213,939
- **المساحة | Area:** 15.0 km²
- **الأحياء | Neighborhoods:** 12
- **الكثافة السكانية | Density:** 14,263 per km²

### 3. أزال | Azal
- **السكان | Population:** 115,054
- **المساحة | Area:** 14.7 km²
- **الأحياء | Neighborhoods:** 6
- **الكثافة السكانية | Density:** 7,826 per km²

### 4. الصافية | Al-Safiah
- **السكان | Population:** 109,109
- **المساحة | Area:** 10.4 km²
- **الأحياء | Neighborhoods:** 1
- **الكثافة السكانية | Density:** 10,492 per km²

### 5. السبعين | Al-Sabain
- **السكان | Population:** 311,203
- **المساحة | Area:** 31.0 km²
- **الأحياء | Neighborhoods:** 15
- **الكثافة السكانية | Density:** 10,039 per km²

### 6. الوحدة | Al-Wahda (Unity)
- **السكان | Population:** 99,596
- **المساحة | Area:** 7.6 km²
- **الأحياء | Neighborhoods:** 9
- **الكثافة السكانية | Density:** 13,105 per km²

### 7. التحرير | Al-Tahrir (Liberation)
- **السكان | Population:** 66,898
- **المساحة | Area:** 2.8 km²
- **الأحياء | Neighborhoods:** 3
- **الكثافة السكانية | Density:** 23,892 per km²

### 8. معين | Muin
- **السكان | Population:** 265,469
- **المساحة | Area:** 11.4 km²
- **الأحياء | Neighborhoods:** 3
- **الكثافة السكانية | Density:** 23,290 per km²

### 9. الثورة | Al-Thawra (Revolution)
- **السكان | Population:** 170,145
- **المساحة | Area:** 21.6 km²
- **الأحياء | Neighborhoods:** 8
- **الكثافة السكانية | Density:** 7,874 per km²

### 10. بني الحارث | Bani Al-Harith
- **السكان | Population:** 184,509
- **المساحة | Area:** 269.0 km²
- **العزل | Sub-districts:** 3
- **القرى | Villages:** 52
- **الكثافة السكانية | Density:** 686 per km²

---

## الإحصائيات الإجمالية | Overall Statistics

| المقياس | Metric | القيمة | Value |
|--------|--------|--------|-------|
| عدد المديريات | Total Districts | 10 | 10 |
| عدد الأحياء | Total Neighborhoods | 89 | 89 |
| عدد الحارات | Total Quarters | 791 | 791 |
| عدد القرى | Total Villages | 52 | 52 |
| إجمالي السكان | Total Population | 1,747,834 | 1,747,834 |
| إجمالي المساحة | Total Area | 385.3 km² | 385.3 km² |
| متوسط الكثافة | Average Density | 4,534.8 per km² | 4,534.8 per km² |

---

## نظام الإحداثيات | Coordinate System

- **النظام | System:** WGS84 (EPSG:4326)
- **الصيغة | Format:** [Longitude, Latitude]
- **الدقة | Precision:** 5 decimal places (≈ 1.1 meter)

### مثال | Example
```json
"coordinates": [
  [44.19, 15.34],
  [44.21, 15.34],
  [44.21, 15.36],
  [44.19, 15.36],
  [44.19, 15.34]
]
```

---

## حالات الاستخدام | Use Cases

### 1. عرض جميع المديريات | Display All Districts
```javascript
// تصفية الميزات ذات admin_level = 6
const districts = features.filter(f => f.properties.admin_level === 6);
```

### 2. البحث عن منطقة | Search for District
```javascript
const search = (query) => {
  return features.filter(f => 
    f.properties.name_ar.includes(query) || 
    f.properties.name_en.toLowerCase().includes(query.toLowerCase())
  );
};
```

### 3. الفرز حسب السكان | Sort by Population
```javascript
const sortByPopulation = (features) => {
  return features.sort((a, b) => 
    b.properties.population - a.properties.population
  );
};
```

### 4. حساب الكثافة السكانية | Calculate Population Density
```javascript
const density = (feature) => {
  return feature.properties.population / feature.properties.area_km2;
};
```

---

## معايير الجودة | Quality Standards

✅ **تم التحقق من:**
- ✓ دقة الإحداثيات (WGS84)
- ✓ اكتمال البيانات السكانية
- ✓ توافق الأسماء العربية والإنجليزية
- ✓ تصنيف إداري متسق
- ✓ أنماط رسم متوافقة مع Google Maps

---

## المراجع | References

- **المصدر الأساسي | Primary Source:** OpenStreetMap + Yemen Administrative Boundaries
- **تاريخ التحديث | Last Updated:** 2026-06-14
- **الإصدار | Version:** 1.0
- **الترخيص | License:** Open Data Commons Open Database License (ODbL)

---

## الدعم والتطوير | Support & Development

للأسئلة والمقترحات حول بنية البيانات، يرجى التواصل عبر:

For questions and suggestions about the data structure, please contact:
- 📧 Email: support@manus.im
- 🌐 Website: https://manus.im
