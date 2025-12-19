# 🏗️ Hybrid Architecture: Netlify + Google Cloud

## 📋 Pregled

Ova arhitektura kombinira **Netlify Functions** (glavna funkcija) s **Google Cloud Functions** (worker) za Google AI generaciju, eliminirajući timeout probleme na Netlify Free tieru.

---

## 🎯 Problem koji rješavamo

**Netlify Free Tier:**
- Max timeout: 26 sekundi
- Google AI generacija: 8-90 sekundi
- **Rezultat:** ~30% generacija timeout-aju ❌

**Rješenje:**
- Glavna funkcija (Netlify): završava brzo (~2s) ✅
- Worker funkcija (Google Cloud): timeout 540s ✅
- **Rezultat:** 0% timeout-a! ✅

---

## 🏗️ Arhitektura

```
┌─────────────┐
│   Frontend  │
│  (order.html)│
└──────┬──────┘
       │
       │ POST /generate-image-google
       │
       ▼
┌─────────────────────────────┐
│  Netlify Function           │
│  (generate-image-google.js) │
│                             │
│  1. Kreira job ID (~0.5s)   │
│  2. Spremi job info (~0.5s) │
│  3. Pokreni worker (~0.5s) │
│  4. Vrati job ID (~0.5s)    │
│                             │
│  Total: ~2 sekunde ✅       │
│  Timeout: 26s (Free tier)   │
│  Rizik: NEMA ✅             │
└──────┬──────────────────────┘
       │
       │ POST (fire-and-forget)
       │
       ▼
┌─────────────────────────────┐
│  Google Cloud Function      │
│  (generate-image-worker)    │
│                             │
│  1. Google AI API (~8-90s)  │
│  2. Upload na GCS (~1s)     │
│                             │
│  Total: 9-91 sekundi        │
│  Timeout: 540s (9 min)      │
│  Rizik: NEMA ✅             │
└──────┬──────────────────────┘
       │
       │ Upload image
       │
       ▼
┌─────────────────────────────┐
│  Google Cloud Storage       │
│  (raincrest-art-images)     │
│                             │
│  Public URL:                │
│  https://storage.googleapis.│
│  com/bucket/file.jpg        │
└──────┬──────────────────────┘
       │
       │ Poll URL (GET)
       │
       ▼
┌─────────────┐
│   Frontend  │
│  (order.html)│
│             │
│  Poll dok   │
│  slika ne   │
│  postoji    │
└─────────────┘
```

---

## 🔄 Flow dijagram

```
1. User uploads image
   ↓
2. Frontend → Netlify Function (generate-image-google)
   ↓
3. Netlify Function:
   - Kreira job ID
   - Spremi job info (opcionalno)
   - Pokreni Google Cloud Function (fire-and-forget)
   - Vrati job ID + image URL (GCS) ODMAH
   ↓
4. Frontend prima job ID + image URL
   ↓
5. Frontend poll-uje image URL (GET request svakih 2s)
   ↓
6. Google Cloud Function (u pozadini):
   - Poziva Google AI API
   - Prima generiranu sliku
   - Upload-uje na Google Cloud Storage
   - Slika je sada dostupna na image URL
   ↓
7. Frontend poll detektira da slika postoji (200 OK)
   ↓
8. Frontend prikaže sliku ✅
```

---

## 📊 Timeout analiza

### Glavna funkcija (Netlify)

| Operacija | Vrijeme | Timeout rizik |
|-----------|---------|---------------|
| Kreiraj job ID | <0.5s | ✅ Nema |
| Spremi job info | <0.5s | ✅ Nema |
| Pokreni worker | <0.5s | ✅ Nema |
| Vrati response | <0.5s | ✅ Nema |
| **Total** | **~2s** | **✅ NEMA RIZIKA** |

**Netlify Free tier limit:** 26s  
**Korišteno:** 2s (8% limita) ✅

---

### Worker funkcija (Google Cloud)

| Operacija | Vrijeme | Timeout rizik |
|-----------|---------|---------------|
| Google AI API | 8-90s | ✅ Nema (540s limit) |
| Upload na GCS | ~1s | ✅ Nema |
| **Total** | **9-91s** | **✅ NEMA RIZIKA** |

**Google Cloud Functions limit:** 540s (9 min)  
**Korišteno:** 9-91s (2-17% limita) ✅

---

## 🔐 Sigurnost

### Netlify Function

- ✅ Validira input (templateId, imageUrls)
- ✅ Koristi environment variables za API keys
- ✅ CORS headers za frontend

### Google Cloud Function

- ✅ Može biti `allow-unauthenticated` (za jednostavnost)
- ✅ Ili `require authentication` (za sigurnost)
- ✅ Koristi service account za GCS pristup
- ✅ Environment variables za API keys

---

## 💰 Cijena

### Netlify (Free Tier)

```
Functions: 125,000 invocations/mjesec ✅ (besplatno)
Compute: 100 hours/mjesec ✅ (besplatno)
```

**Za 100 slika/mjesec:**
- Pozivi: 100 × 1 = 100 poziva ✅ (besplatno)
- Compute: ~0.05 hours ✅ (besplatno)
- **Total: $0/mjesec** 🎉

---

### Google Cloud Functions (Free Tier)

```
Pozivi: 2 milijuna/mjesec ✅ (besplatno)
Compute: 400,000 GB-sec/mjesec ✅ (besplatno)
Storage: 5 GB ✅ (besplatno)
```

**Za 100 slika/mjesec:**
- Pozivi: 100 × 1 = 100 poziva ✅ (besplatno)
- Compute: ~10 GB-sec ✅ (besplatno)
- Storage: ~0.1 GB ✅ (besplatno)
- **Total: $0/mjesec** 🎉

---

### Google Cloud Storage

```
Storage: $0.020/GB
Operations: $0.05/10,000 operations
Egress: $0.12/GB (prvi 10GB besplatno)
```

**Za 100 slika/mjesec:**
- Storage: 0.1 GB × $0.020 = $0.002
- Operations: 200 operations × $0.05/10,000 = $0.001
- Egress: 0.1 GB × $0 = $0 (besplatno do 10GB)
- **Total: ~$0.003/mjesec** 🎉

---

## 🎯 Prednosti

1. ✅ **Nema timeout problema** - Google Cloud Functions ima 540s timeout
2. ✅ **Besplatno** - Free tier dovoljan za 100 slika/mjesec
3. ✅ **Brže** - Glavna funkcija završava u 2s (ne čeka AI generaciju)
4. ✅ **Pouzdano** - Worker funkcija se ne može timeout-ati
5. ✅ **Skalabilno** - Google Cloud Functions automatski skalira
6. ✅ **Bolja integracija** - Google AI i GCS su na istom networku

---

## ⚠️ Nedostaci

1. ⚠️ **Kompleksniji setup** - Zahtijeva Google Cloud projekt
2. ⚠️ **Više servisa** - Netlify + Google Cloud (umjesto samo Netlify)
3. ⚠️ **Više environment variables** - Treba postaviti više key-ova

---

## 🔄 Fallback opcija

Ako Google Cloud Functions nije konfiguriran, sistem automatski koristi **Bunny.net** kao fallback:

```javascript
// generate-image-google.js
const useGCS = !!GCP_FUNCTION_URL; // Ako ima GCP URL, koristi GCS

if (useGCS) {
  // Google Cloud Storage
} else {
  // Fallback: Bunny.net (može imati timeout problem na Free tier)
}
```

---

## 📚 Reference

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Setup Guide](./GOOGLE-CLOUD-SETUP.md)

---

**Status:** ✅ Implementirano  
**Datum:** 2024-12-19  
**Commit:** Hybrid architecture s Google Cloud Functions

