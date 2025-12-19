# Razlike između Replicate i Google AI API formata

## Glavni problem: **Različiti API formati**

Iako oba koriste Google model (`nano-banana`), **Replicate** i **Google AI API** imaju potpuno različite formate zahtjeva!

---

## 📋 **REPLICATE format** (jednostavniji)

### Request struktura:
```json
{
  "input": {
    "prompt": "Create a cinematic photo...",
    "image_input": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/logo.jpg"
    ]
  }
}
```

### Karakteristike:
- ✅ **Slika kao URL** - direktno šalješ URL-ove, Replicate sam preuzima slike
- ✅ **Jednostavna struktura** - samo `prompt` i `image_input` array
- ✅ **Model name:** `google/nano-banana` (Replicate wrapper)
- ✅ **Automatski handling** - Replicate sam konvertira i obrađuje slike

### API endpoint:
```
POST https://api.replicate.com/v1/models/google/nano-banana/predictions
```

---

## 🔧 **GOOGLE AI API format** (kompleksniji)

### Request struktura:
```json
{
  "contents": [{
    "role": "user",
    "parts": [
      { "text": "Create a cinematic photo..." },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_image_data_here..."
        }
      },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "base64_encoded_logo_data_here..."
        }
      }
    ]
  }],
  "safetySettings": [
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
    // ... ostale kategorije
  ],
  "generationConfig": {
    "temperature": 1,
    "topP": 0.95,
    "topK": 40,
    "maxOutputTokens": 8192,
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "aspectRatio": "1:1",
      "outputFormat": "jpg"
    }
  }
}
```

### Karakteristike:
- ❌ **Slika kao base64** - moraš preuzeti sliku s URL-a i konvertirati u base64
- ❌ **Kompleksna struktura** - `contents` → `parts` → `inline_data`
- ❌ **Model name:** `gemini-2.0-flash-exp-image-generation` (direktno Google API)
- ❌ **Ručno handling** - moraš sam preuzeti, konvertirati i formatirati slike

### API endpoint:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=API_KEY
```

---

## 🔍 **Ključne razlike:**

| Aspekt | Replicate | Google AI API |
|--------|-----------|---------------|
| **Format slike** | URL string | Base64 string |
| **Struktura** | `{ input: { prompt, image_input } }` | `{ contents: [{ parts: [...] }] }` |
| **Model name** | `google/nano-banana` | `gemini-2.0-flash-exp-image-generation` |
| **Safety settings** | Automatski | Eksplicitno definirano |
| **Image config** | N/A (nije podržano) | `imageConfig: { aspectRatio, outputFormat }` |
| **Preuzimanje slika** | Replicate radi automatski | Ti moraš preuzeti i konvertirati |

---

## 💡 **Zašto su različiti?**

1. **Replicate je wrapper** - Replicate je posrednik koji prima jednostavniji format i interno konvertira u Google AI API format
2. **Google AI API je direktan** - Komunikacija direktno s Google AI servisom, zahtijeva kompletnu strukturu
3. **Različite verzije modela** - Replicate možda koristi drugačiju verziju ili konfiguraciju modela

---

## 🛠️ **Što trebaš napraviti?**

### Za Replicate (već radi ✅):
```javascript
const inputData = {
  prompt: "Create a photo...",
  image_input: [imageUrl1, imageUrl2, logoUrl]  // URL-ovi direktno
};
```

### Za Google AI API (trenutno u `gcp-function/index.js`):
```javascript
// 1. Preuzmi sliku s URL-a
const imageResponse = await fetch(imageUrl);
const imageBuffer = await imageResponse.buffer();
const base64Image = imageBuffer.toString('base64');

// 2. Formatiraj u Google AI format
const requestBody = {
  contents: [{
    role: "user",
    parts: [
      { text: prompt },
      {
        inline_data: {
          mime_type: "image/jpeg",
          data: base64Image
        }
      }
    ]
  }],
  // ... safety settings i generationConfig
};
```

---

## ⚠️ **Mogući problemi:**

1. **"Failed to get mask image bytes"** - Google AI API misli da pokušavaš image editing umjesto generation
   - **Rješenje:** Provjeri da li je `responseModalities: ["IMAGE"]` postavljeno ispravno

2. **Safety blocking** - Google AI API blokira prompt
   - **Rješenje:** Dodaj `safetySettings` s `BLOCK_NONE` za sve kategorije

3. **Format greške** - Base64 nije ispravno formatiran
   - **Rješenje:** Provjeri da li base64 string počinje s `/9j/` (JPEG) ili `iVBORw0KG` (PNG)

---

## 📝 **Zaključak:**

**Replicate** i **Google AI API** koriste isti model, ali **potpuno različite API formate**. Replicate je jednostavniji wrapper, dok Google AI API zahtijeva kompleksniju strukturu s base64 konverzijom.

**Trenutno rješenje:** Google Cloud Function (`gcp-function/index.js`) automatski preuzima slike s URL-ova i konvertira ih u base64 format koji Google AI API očekuje.

