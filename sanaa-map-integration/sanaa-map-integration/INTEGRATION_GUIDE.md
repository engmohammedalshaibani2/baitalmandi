# دليل تكامل خريطة صنعاء على موقعك
# Sana'a Map Integration Guide

---

## 📋 المحتويات | Contents

1. [الخطوة 1: تحميل الملفات الأساسية](#الخطوة-1-تحميل-الملفات-الأساسية)
2. [الخطوة 2: إضافة المكتبات المطلوبة](#الخطوة-2-إضافة-المكتبات-المطلوبة)
3. [الخطوة 3: أكواد التكامل](#الخطوة-3-أكواد-التكامل)
4. [الخطوة 4: التخصيص والتطوير](#الخطوة-4-التخصيص-والتطوير)

---

## الخطوة 1: تحميل الملفات الأساسية

### الملفات المطلوبة:

```
your-website/
├── data/
│   └── sanaa-districts.geojson          # ملف البيانات الجغرافية
├── js/
│   └── sanaa-map.js                     # كود الخريطة
├── css/
│   └── sanaa-map.css                    # تنسيق الخريطة
└── index.html                           # صفحتك الرئيسية
```

### تحميل ملف GeoJSON:

**الملف:** `data/sanaa-districts.geojson`

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "name": "Sana'a Administrative Boundaries",
    "version": "1.0"
  },
  "features": [
    // البيانات هنا...
  ]
}
```

---

## الخطوة 2: إضافة المكتبات المطلوبة

### أضف هذه الأسطر في `<head>` من ملف HTML:

```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- Tailwind CSS (اختياري - للتنسيق) -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Font Awesome (للأيقونات) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
```

---

## الخطوة 3: أكواد التكامل

### الخيار 1: تكامل بسيط (Vanilla JavaScript)

#### ملف HTML:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خريطة صنعاء التفاعلية</title>
    
    <!-- Leaflet CSS -->
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/sanaa-map.css">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        #map {
            flex: 1;
            z-index: 1;
        }
        
        .sidebar {
            width: 350px;
            background: white;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            overflow-y: auto;
            padding: 20px;
            border-right: 1px solid #e0e0e0;
        }
        
        .header {
            background: white;
            padding: 15px 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        
        .search-box {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        }
        
        .district-item {
            padding: 12px;
            margin-bottom: 10px;
            background: #f9f9f9;
            border-left: 3px solid #2196F3;
            cursor: pointer;
            transition: all 0.3s;
            border-radius: 3px;
        }
        
        .district-item:hover {
            background: #f0f0f0;
            transform: translateX(-5px);
        }
        
        .district-item.active {
            background: #E3F2FD;
            border-left-color: #1976D2;
        }
        
        .district-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        
        .district-info {
            font-size: 12px;
            color: #666;
        }
        
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }
        
        .stat-item {
            background: #f0f0f0;
            padding: 8px;
            border-radius: 3px;
            text-align: center;
            font-size: 12px;
        }
        
        .stat-value {
            font-weight: bold;
            color: #2196F3;
            font-size: 14px;
        }
        
        .language-toggle {
            display: flex;
            gap: 5px;
        }
        
        .lang-btn {
            padding: 8px 15px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            border-radius: 3px;
            transition: all 0.3s;
        }
        
        .lang-btn.active {
            background: #2196F3;
            color: white;
            border-color: #2196F3;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 style="font-size: 20px; color: #333;">🗺️ خريطة صنعاء التفاعلية</h1>
            <p style="font-size: 12px; color: #666;">Sana'a Interactive Map</p>
        </div>
        <div class="language-toggle">
            <button class="lang-btn active" data-lang="ar">العربية</button>
            <button class="lang-btn" data-lang="en">English</button>
        </div>
    </div>
    
    <div class="container">
        <div id="map"></div>
        
        <div class="sidebar">
            <input 
                type="text" 
                class="search-box" 
                id="searchBox" 
                placeholder="ابحث عن منطقة..."
            >
            <div id="districtsList"></div>
        </div>
    </div>
    
    <!-- Leaflet JS -->
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <!-- Custom Map Script -->
    <script src="js/sanaa-map.js"></script>
</body>
</html>
```

#### ملف JavaScript: `js/sanaa-map.js`

```javascript
// إعدادات اللغة
let currentLanguage = 'ar';

// بيانات النصوص
const translations = {
    ar: {
        search: 'ابحث عن منطقة...',
        population: 'السكان',
        area: 'المساحة',
        density: 'الكثافة',
        noResults: 'لا توجد نتائج',
        district: 'مديرية',
        neighborhood: 'حي',
        km2: 'كم²'
    },
    en: {
        search: 'Search district...',
        population: 'Population',
        area: 'Area',
        density: 'Density',
        noResults: 'No results',
        district: 'District',
        neighborhood: 'Neighborhood',
        km2: 'km²'
    }
};

// متغيرات عامة
let map;
let geoJsonLayer;
let allDistricts = [];
let selectedDistrict = null;

// تهيئة الخريطة
function initMap() {
    // إنشاء الخريطة
    map = L.map('map').setView([15.35, 44.2], 12);
    
    // إضافة طبقة الخريطة
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
        minZoom: 10
    }).addTo(map);
    
    // تحميل بيانات GeoJSON
    loadGeoJSON();
}

// تحميل بيانات GeoJSON
function loadGeoJSON() {
    fetch('data/sanaa-districts.geojson')
        .then(response => response.json())
        .then(data => {
            // حفظ المديريات
            allDistricts = data.features.filter(f => f.properties.admin_level === 6);
            
            // إضافة الطبقة الجغرافية
            geoJsonLayer = L.geoJSON(data, {
                style: getFeatureStyle,
                onEachFeature: onEachFeature
            }).addTo(map);
            
            // عرض قائمة المديريات
            displayDistrictsList(allDistricts);
        })
        .catch(error => console.error('خطأ في تحميل البيانات:', error));
}

// الحصول على نمط الميزة
function getFeatureStyle(feature) {
    const props = feature.properties;
    
    if (props.admin_level === 4) {
        return {
            fillColor: '#E8EAED',
            color: '#BDC1C6',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
            dashArray: '5,5'
        };
    } else if (props.admin_level === 6) {
        return {
            fillColor: '#FFFFFF',
            color: '#9AA0A6',
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.6
        };
    }
    
    return {};
}

// معالج كل ميزة
function onEachFeature(feature, layer) {
    const props = feature.properties;
    const name = currentLanguage === 'ar' ? props.name_ar : props.name_en;
    
    // إنشاء popup
    const popupContent = `
        <div style="text-align: center; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${name}</h3>
            <p style="margin: 5px 0; color: #666; font-size: 12px;">${props.category}</p>
            <div style="margin-top: 10px; font-size: 12px;">
                <p><strong>${translations[currentLanguage].population}:</strong> ${props.population?.toLocaleString()}</p>
                <p><strong>${translations[currentLanguage].area}:</strong> ${props.area_km2} ${translations[currentLanguage].km2}</p>
            </div>
        </div>
    `;
    
    layer.bindPopup(popupContent);
    
    // إضافة مستمعي الأحداث
    layer.on('click', () => {
        selectDistrict(feature);
    });
    
    layer.on('mouseover', () => {
        layer.setStyle({
            fillColor: '#E8F0FE',
            color: '#1F2937',
            weight: 2,
            fillOpacity: 0.8
        });
    });
    
    layer.on('mouseout', () => {
        if (selectedDistrict?.id !== feature.id) {
            layer.setStyle(getFeatureStyle(feature));
        }
    });
}

// عرض قائمة المديريات
function displayDistrictsList(districts) {
    const listContainer = document.getElementById('districtsList');
    listContainer.innerHTML = '';
    
    if (districts.length === 0) {
        listContainer.innerHTML = `<p style="text-align: center; color: #999;">${translations[currentLanguage].noResults}</p>`;
        return;
    }
    
    districts.forEach(district => {
        const props = district.properties;
        const name = currentLanguage === 'ar' ? props.name_ar : props.name_en;
        const description = currentLanguage === 'ar' ? props.description_ar : props.description_en;
        
        const item = document.createElement('div');
        item.className = 'district-item' + (selectedDistrict?.id === district.id ? ' active' : '');
        item.innerHTML = `
            <div class="district-name">${name}</div>
            <div class="district-info">${description}</div>
            <div class="stats">
                <div class="stat-item">
                    <div>${translations[currentLanguage].population}</div>
                    <div class="stat-value">${(props.population / 1000).toFixed(0)}K</div>
                </div>
                <div class="stat-item">
                    <div>${translations[currentLanguage].area}</div>
                    <div class="stat-value">${props.area_km2}</div>
                </div>
            </div>
        `;
        
        item.addEventListener('click', () => selectDistrict(district));
        listContainer.appendChild(item);
    });
}

// تحديد منطقة
function selectDistrict(district) {
    selectedDistrict = district;
    
    // تحديث القائمة
    document.querySelectorAll('.district-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.district-item')?.classList.add('active');
    
    // تحديث الخريطة
    if (district.properties.center) {
        const [lon, lat] = district.properties.center;
        map.setView([lat, lon], district.properties.zoom_level || 13);
    }
}

// البحث عن المديريات
function searchDistricts(query) {
    const filtered = allDistricts.filter(d => {
        const name_ar = d.properties.name_ar.toLowerCase();
        const name_en = d.properties.name_en.toLowerCase();
        return name_ar.includes(query.toLowerCase()) || name_en.includes(query.toLowerCase());
    });
    
    displayDistrictsList(filtered);
}

// تبديل اللغة
function changeLanguage(lang) {
    currentLanguage = lang;
    
    // تحديث الأزرار
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // تحديث البحث
    const searchBox = document.getElementById('searchBox');
    searchBox.placeholder = translations[lang].search;
    
    // تحديث القائمة
    displayDistrictsList(allDistricts);
}

// معالجات الأحداث
document.addEventListener('DOMContentLoaded', () => {
    // تهيئة الخريطة
    initMap();
    
    // البحث
    document.getElementById('searchBox').addEventListener('input', (e) => {
        searchDistricts(e.target.value);
    });
    
    // تبديل اللغة
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            changeLanguage(e.target.dataset.lang);
        });
    });
});
```

---

### الخيار 2: تكامل مع React

#### مكون React:

```jsx
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

export default function SanaaMap() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [language, setLanguage] = useState('ar');
  const [districts, setDistricts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // تحميل GeoJSON
    fetch('/data/sanaa-districts.geojson')
      .then(res => res.json())
      .then(data => {
        const districtsList = data.features.filter(f => f.properties.admin_level === 6);
        setDistricts(districtsList);
      });
  }, []);

  useEffect(() => {
    if (map.current) return;

    // إنشاء الخريطة
    map.current = L.map(mapContainer.current).setView([15.35, 44.2], 12);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map.current);

    // تحميل GeoJSON
    fetch('/data/sanaa-districts.geojson')
      .then(res => res.json())
      .then(data => {
        L.geoJSON(data, {
          style: (feature) => {
            if (feature.properties.admin_level === 4) {
              return {
                fillColor: '#E8EAED',
                color: '#BDC1C6',
                weight: 2,
                fillOpacity: 0.3,
              };
            }
            return {
              fillColor: '#FFFFFF',
              color: '#9AA0A6',
              weight: 1.5,
              fillOpacity: 0.6,
            };
          },
        }).addTo(map.current);
      });
  }, []);

  const filteredDistricts = districts.filter(d => {
    const query = searchQuery.toLowerCase();
    const name = language === 'ar' ? d.properties.name_ar : d.properties.name_en;
    return name.toLowerCase().includes(query);
  });

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div ref={mapContainer} style={{ flex: 1 }} />
      <div style={{ width: '350px', padding: '20px', overflowY: 'auto', borderLeft: '1px solid #ddd' }}>
        <input
          type="text"
          placeholder={language === 'ar' ? 'ابحث عن منطقة...' : 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '5px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={() => setLanguage('ar')} style={{ flex: 1, padding: '8px', background: language === 'ar' ? '#2196F3' : 'white', color: language === 'ar' ? 'white' : 'black', border: '1px solid #ddd', cursor: 'pointer' }}>
            العربية
          </button>
          <button onClick={() => setLanguage('en')} style={{ flex: 1, padding: '8px', background: language === 'en' ? '#2196F3' : 'white', color: language === 'en' ? 'white' : 'black', border: '1px solid #ddd', cursor: 'pointer' }}>
            English
          </button>
        </div>

        {filteredDistricts.map(district => (
          <div key={district.id} style={{ padding: '12px', marginBottom: '10px', background: '#f9f9f9', borderLeft: '3px solid #2196F3', cursor: 'pointer', borderRadius: '3px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {language === 'ar' ? district.properties.name_ar : district.properties.name_en}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              {language === 'ar' ? district.properties.description_ar : district.properties.description_en}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
              <div style={{ background: '#f0f0f0', padding: '8px', borderRadius: '3px', textAlign: 'center' }}>
                <div>{language === 'ar' ? 'السكان' : 'Population'}</div>
                <div style={{ fontWeight: 'bold', color: '#2196F3' }}>{(district.properties.population / 1000).toFixed(0)}K</div>
              </div>
              <div style={{ background: '#f0f0f0', padding: '8px', borderRadius: '3px', textAlign: 'center' }}>
                <div>{language === 'ar' ? 'المساحة' : 'Area'}</div>
                <div style={{ fontWeight: 'bold', color: '#2196F3' }}>{district.properties.area_km2}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### الخيار 3: تكامل مع Vue.js

```vue
<template>
  <div class="map-container">
    <div id="map" class="map"></div>
    <div class="sidebar">
      <input 
        v-model="searchQuery" 
        type="text" 
        :placeholder="language === 'ar' ? 'ابحث عن منطقة...' : 'Search...'"
        class="search-box"
      >
      <div class="language-toggle">
        <button 
          @click="language = 'ar'" 
          :class="{ active: language === 'ar' }"
        >
          العربية
        </button>
        <button 
          @click="language = 'en'" 
          :class="{ active: language === 'en' }"
        >
          English
        </button>
      </div>
      <div class="districts-list">
        <div 
          v-for="district in filteredDistricts" 
          :key="district.id"
          class="district-item"
          @click="selectDistrict(district)"
        >
          <div class="district-name">
            {{ language === 'ar' ? district.properties.name_ar : district.properties.name_en }}
          </div>
          <div class="district-info">
            {{ language === 'ar' ? district.properties.description_ar : district.properties.description_en }}
          </div>
          <div class="stats">
            <div class="stat-item">
              <div>{{ language === 'ar' ? 'السكان' : 'Population' }}</div>
              <div class="stat-value">{{ (district.properties.population / 1000).toFixed(0) }}K</div>
            </div>
            <div class="stat-item">
              <div>{{ language === 'ar' ? 'المساحة' : 'Area' }}</div>
              <div class="stat-value">{{ district.properties.area_km2 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import L from 'leaflet';

export default {
  name: 'SanaaMap',
  data() {
    return {
      map: null,
      language: 'ar',
      searchQuery: '',
      districts: []
    };
  },
  computed: {
    filteredDistricts() {
      return this.districts.filter(d => {
        const query = this.searchQuery.toLowerCase();
        const name = this.language === 'ar' ? d.properties.name_ar : d.properties.name_en;
        return name.toLowerCase().includes(query);
      });
    }
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      this.map = L.map('map').setView([15.35, 44.2], 12);
      
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(this.map);

      this.loadGeoJSON();
    },
    loadGeoJSON() {
      fetch('/data/sanaa-districts.geojson')
        .then(res => res.json())
        .then(data => {
          this.districts = data.features.filter(f => f.properties.admin_level === 6);
          
          L.geoJSON(data, {
            style: this.getFeatureStyle,
            onEachFeature: this.onEachFeature
          }).addTo(this.map);
        });
    },
    getFeatureStyle(feature) {
      if (feature.properties.admin_level === 4) {
        return {
          fillColor: '#E8EAED',
          color: '#BDC1C6',
          weight: 2,
          fillOpacity: 0.3,
        };
      }
      return {
        fillColor: '#FFFFFF',
        color: '#9AA0A6',
        weight: 1.5,
        fillOpacity: 0.6,
      };
    },
    onEachFeature(feature, layer) {
      layer.on('click', () => this.selectDistrict(feature));
    },
    selectDistrict(district) {
      if (district.properties.center) {
        const [lon, lat] = district.properties.center;
        this.map.setView([lat, lon], district.properties.zoom_level || 13);
      }
    }
  }
};
</script>

<style scoped>
.map-container {
  display: flex;
  height: 100vh;
}

.map {
  flex: 1;
  z-index: 1;
}

.sidebar {
  width: 350px;
  background: white;
  box-shadow: -2px 0 10px rgba(0,0,0,0.1);
  overflow-y: auto;
  padding: 20px;
  border-right: 1px solid #e0e0e0;
}

.search-box {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.language-toggle {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.language-toggle button {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 3px;
}

.language-toggle button.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

.district-item {
  padding: 12px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-left: 3px solid #2196F3;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 3px;
}

.district-item:hover {
  background: #f0f0f0;
  transform: translateX(-5px);
}

.district-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.district-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-item {
  background: #f0f0f0;
  padding: 8px;
  border-radius: 3px;
  text-align: center;
  font-size: 12px;
}

.stat-value {
  font-weight: bold;
  color: #2196F3;
  font-size: 14px;
}
</style>
```

---

## الخطوة 4: التخصيص والتطوير

### تغيير الألوان:

```javascript
// في ملف sanaa-map.js
function getFeatureStyle(feature) {
    return {
        fillColor: '#YOUR_COLOR',      // لون الملء
        color: '#YOUR_BORDER_COLOR',   // لون الحدود
        weight: 2,                      // سمك الحدود
        fillOpacity: 0.6                // شفافية الملء
    };
}
```

### تغيير مركز الخريطة:

```javascript
// بدلاً من:
map.setView([15.35, 44.2], 12);

// استخدم:
map.setView([latitude, longitude], zoomLevel);
```

### إضافة ميزات إضافية:

```javascript
// إضافة بحث متقدم
function advancedSearch(query, filterBy) {
    return allDistricts.filter(d => {
        const name = d.properties.name_ar + ' ' + d.properties.name_en;
        return name.toLowerCase().includes(query.toLowerCase());
    });
}

// إضافة تصدير البيانات
function exportData(format) {
    if (format === 'json') {
        const dataStr = JSON.stringify(allDistricts, null, 2);
        downloadFile(dataStr, 'sanaa-districts.json');
    }
}

// دالة تحميل الملف
function downloadFile(data, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
```

---

## 📦 ملفات الكود الكاملة

جميع الملفات متوفرة في المشروع الأصلي:

```
/home/ubuntu/sanaa-map-viewer/
├── client/src/components/SanaaMapViewer.tsx
├── client/src/components/DistrictsList.tsx
├── client/src/components/DistrictDetails.tsx
├── public/sanaa-districts.geojson
└── README.md
```

---

## 🚀 خطوات التثبيت السريعة

### 1. نسخ الملفات:

```bash
# انسخ ملف GeoJSON
cp sanaa-districts.geojson /your-website/data/

# انسخ ملفات JavaScript و CSS
cp sanaa-map.js /your-website/js/
cp sanaa-map.css /your-website/css/
```

### 2. إضافة HTML:

```html
<div id="map" style="height: 600px;"></div>
<script src="js/sanaa-map.js"></script>
```

### 3. التحقق:

- افتح المتصفح
- تحقق من ظهور الخريطة
- اختبر البحث والتصفية

---

## 🔧 استكشاف الأخطاء

### المشكلة: الخريطة لا تظهر

**الحل:**
```javascript
// تحقق من تحميل Leaflet
console.log(L); // يجب أن يطبع كائن Leaflet

// تحقق من تحميل GeoJSON
fetch('data/sanaa-districts.geojson')
    .then(r => r.json())
    .then(d => console.log('GeoJSON loaded:', d));
```

### المشكلة: البحث لا يعمل

**الحل:**
```javascript
// تحقق من قيمة البحث
console.log(searchQuery);

// تحقق من البيانات
console.log(allDistricts);
```

---

## 📞 الدعم والمساعدة

للأسئلة والدعم:
- 📧 Email: support@manus.im
- 🌐 Website: https://manus.im

---

**آخر تحديث:** 2026-06-14
**الإصدار:** 1.0
