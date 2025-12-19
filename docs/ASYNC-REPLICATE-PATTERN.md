# 🚀 Async Replicate Pattern Implementation

## 📋 Pregled

Ovaj dokument opisuje implementaciju "Start & Check" async pattern-a s Replicate API-jem, bez Stripe integracije (za sada).

**Arhitektura:**
1. `order.html` → Upload slika na Bunny.net
2. `verify-and-start.js` → Pokreće Replicate generaciju (vraća `predictionId`)
3. Redirect na `processing.html?predictionId=xxx`
4. `processing.html` → Poll-uje `check-status.js` dok slika nije gotova
5. Prikaz rezultata s Share/Save funkcionalnostima

---

## 🔧 Netlify Functions

### 1. `verify-and-start.js`

**Endpoint:** `/.netlify/functions/verify-and-start`

**Input:**
```json
{
  "imageUrl": "https://...",
  "image2Url": "https://...", // opcionalno
  "templateId": "template-02",
  "isCouple": true,
  "prompt": "..." // opcionalno (funkcija može generirati svoj)
}
```

**Action:**
- Validira input
- Generira prompt (ako nije poslan)
- Poziva Replicate API s modelom: `black-forest-labs/flux-schnell`
- **NE čeka rezultat** - vraća `predictionId` odmah

**Output:**
```json
{
  "success": true,
  "predictionId": "abc123...",
  "status": "starting",
  "createdAt": "2024-12-19T..."
}
```

**Model:** `black-forest-labs/flux-schnell` (najbrži Replicate model)

---

### 2. `check-status.js`

**Endpoint:** `/.netlify/functions/check-status?predictionId=xxx`

**Input:**
- Query parameter: `predictionId`
- Ili POST body: `{ "predictionId": "xxx" }`

**Action:**
- Provjerava status Replicate prediction-a
- Vraća status i imageUrl (ako je gotovo)

**Output:**
```json
{
  "success": true,
  "status": "succeeded", // "starting" | "processing" | "succeeded" | "failed"
  "imageUrl": "https://...", // null ako nije gotovo
  "error": null, // error message ako je failed
  "predictionId": "abc123...",
  "logs": "..."
}
```

---

## 🎨 Frontend Flow

### `order.html`

**Promjene:**
1. Button tekst: "✨ Generate Transformation" (za sada bez cijene)
2. Nakon upload-a slika na Bunny.net:
   - Poziva `verify-and-start.js`
   - Dobiva `predictionId`
   - Redirect na `processing.html?predictionId=xxx`

**Kod:**
```javascript
// Pozovi verify-and-start
const verifyResponse = await fetch('/.netlify/functions/verify-and-start', {
    method: 'POST',
    body: JSON.stringify({
        imageUrl: image1Url,
        image2Url: image2Url,
        templateId: currentTemplate.id,
        isCouple: isCouple
    })
});

const result = await verifyResponse.json();
window.location.href = `processing.html?predictionId=${result.predictionId}`;
```

---

### `processing.html`

**Funkcionalnosti:**
1. **Progress Stepper:**
   - Step 1: "Verifying payment..." (za sada samo placeholder)
   - Step 2: "Sending to AI..."
   - Step 3: "Applying magic..."
   - Step 4: "Finalizing..."

2. **Polling Loop:**
   - Poziva `check-status.js` svake 2 sekunde
   - Ažurira progress bar i step poruke
   - Kada je `status === 'succeeded'`, prikazuje sliku

3. **Share/Save Button:**
   - Koristi `navigator.share` API (mobile)
   - Fallback: Download button (desktop)

**Kod:**
```javascript
async function checkStatus() {
    const response = await fetch(`/.netlify/functions/check-status?predictionId=${predictionId}`);
    const result = await response.json();
    
    if (result.status === 'succeeded' && result.imageUrl) {
        showResult(result.imageUrl);
    } else if (result.status === 'failed') {
        showError(result.error);
    } else {
        setTimeout(checkStatus, 2000); // Poll again
    }
}
```

---

## 🔐 Environment Variables

**Netlify Dashboard → Environment Variables:**

```
REPLICATE_API_TOKEN=your_replicate_api_token
BUNNY_API_KEY=your_bunny_api_key
BUNNY_STORAGE_ZONE=your_storage_zone
BUNNY_CDN_DOMAIN=your_cdn_domain (opcionalno)
```

---

## 📊 Flow Diagram

```
User clicks "Generate"
    ↓
Upload images to Bunny.net
    ↓
Call verify-and-start.js
    ↓
Get predictionId
    ↓
Redirect to processing.html?predictionId=xxx
    ↓
Start polling check-status.js (every 2s)
    ↓
Status: "starting" → "processing" → "succeeded"
    ↓
Display image + Share/Save buttons
```

---

## ✅ Prednosti

1. **Nema timeout problema** - Netlify function vraća `predictionId` odmah (< 5s)
2. **Pouzdan polling** - Frontend kontrolira polling loop
3. **Dobar UX** - Progress stepper i status poruke
4. **Mobile-friendly** - Native share API
5. **Brži model** - `flux-schnell` je najbrži Replicate model

---

## 🚨 Troubleshooting

### Problem: `predictionId` nije vraćen

**Rješenje:**
- Provjeri Netlify Function logs za `verify-and-start`
- Provjeri da li je `REPLICATE_API_TOKEN` postavljen
- Provjeri da li je model `black-forest-labs/flux-schnell` dostupan

### Problem: Polling se zaustavlja

**Rješenje:**
- Provjeri browser console za greške
- Provjeri da li `check-status.js` vraća ispravan format
- Provjeri network tab za failed requests

### Problem: Slika se ne prikazuje

**Rješenje:**
- Provjeri da li je `result.imageUrl` validan URL
- Provjeri CORS headers na Replicate CDN-u
- Provjeri da li je slika stvarno generirana (Replicate dashboard)

---

## 📝 Napomene

- **Stripe integracija:** Za sada nije implementirana. `verify-and-start` ne provjerava payment.
- **Model:** Koristi se `black-forest-labs/flux-schnell` (najbrži), ali može se promijeniti u environment variable.
- **Timeout:** Polling loop ima max 150 pokušaja (5 minuta), ali Replicate obično završi za 30-60 sekundi.

---

**Status:** ✅ Implementirano  
**Datum:** 2024-12-19

