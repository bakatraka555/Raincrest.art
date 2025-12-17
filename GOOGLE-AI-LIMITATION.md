# ⚠️ Google AI Studio Limitation

## ❌ Problem: Gemini API ne generira slike

**Greška:**
```
"This model only supports text output."
```

**Uzrok:**
Google Gemini API (AI Studio) **ne podržava generiranje slika** - samo:
- ✅ Analizira slike (image input)
- ✅ Generira tekst (text output)
- ❌ **NE generira slike** (image output)

---

## 🔍 Što smo pokušali

### 1. `gemini-2.5-flash-image` (Replicate model name)
- ❌ Ne postoji u Google AI Studio direktno
- ✅ Postoji samo na Replicate kao wrapper

### 2. `gemini-2.5-flash` (Google AI Studio)
- ✅ Postoji i radi
- ❌ **Samo tekst output** - ne generira slike
- ✅ Može analizirati slike (image input)

### 3. `response_modalities: ["IMAGE"]`
- ❌ Model ne podržava image generation
- ✅ Podržava samo text generation

---

## 💡 Rješenja za budućnost

### Opcija 1: Google Imagen API (Zahtijeva Vertex AI)

**Što je potrebno:**
- Google Cloud projekt
- Vertex AI enabled
- Imagen API (poseban API za image generation)
- Billing account (nije free tier)

**Kako:**
```javascript
// Vertex AI Imagen API
const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
  project: 'your-project-id',
  location: 'us-central1'
});

const model = vertexAI.getGenerativeModel({
  model: 'imagegeneration@006' // Imagen model
});
```

**Cijena:** ~$0.02 per image (slično Replicate)

---

### Opcija 2: Ostati na Replicate

**Prednosti:**
- ✅ Već radi
- ✅ Podržava image generation
- ✅ Jednostavno za održavanje
- ✅ Pouzdano

**Nedostatak:**
- ❌ Skuplje: $0.039 per image

---

### Opcija 3: Čekati Google AI Studio Image Generation

Google možda u budućnosti doda image generation u Gemini API.

**Provjeri:**
- https://ai.google.dev/models/gemini
- Google AI Studio release notes

---

## 📊 Usporedba

| Provider | Image Generation | Cijena | Setup |
|----------|------------------|--------|-------|
| **Replicate** | ✅ Da | $0.039/img | ✅ Jednostavan |
| **Google Gemini (AI Studio)** | ❌ Ne | Free | ✅ Jednostavan |
| **Google Imagen (Vertex AI)** | ✅ Da | ~$0.02/img | ❌ Kompleksan |

---

## ✅ Trenutno rješenje

**Vraćeno na Replicate:**
```javascript
const USE_GOOGLE_AI = false; // Replicate (radi!)
```

**Zašto:**
- Google Gemini API ne podržava image generation
- Replicate već radi i podržava sve što trebamo
- Jednostavnije od Vertex AI setup-a

---

## 🔮 Budućnost

**Mogućnosti:**
1. **Čekati** Google da doda image generation u Gemini API
2. **Implementirati** Vertex AI Imagen API (zahtijeva Google Cloud setup)
3. **Ostati** na Replicate (najjednostavnije)

**Preporuka:** Ostati na Replicate dok Google ne doda image generation u AI Studio.

---

## 📚 Reference

- **Google Gemini API:** https://ai.google.dev/models/gemini
- **Google Imagen:** https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview
- **Replicate:** https://replicate.com/google/gemini-2.5-flash-image

---

**Status:** ⚠️ Google AI Studio ne podržava image generation - vraćeno na Replicate  
**Datum:** 2024-11-15  
**Commit:** Vraćeno na Replicate

