# Google AI Studio Test Verzija

## 📋 Pregled

Ova folder sadrži **2 verzije** funkcije za generiranje slika:

| Fajl | Provider | Status | Cijena | Endpoint |
|------|----------|--------|--------|----------|
| `generate-image.js` | **Replicate** | ✅ Radi | $0.039/slika | `/.netlify/functions/generate-image` |
| `generate-image-google.js` | **Google AI Studio** | 🧪 Test | ~$0.001/slika | `/.netlify/functions/generate-image-google` |

---

## 🚀 Kako testirati Google AI verziju

### 1. Dobij Google AI API Key

1. Idi na: https://aistudio.google.com/apikey
2. Prijavi se sa Google accountom
3. Klikni **"Create API key"**
4. Kopiraj API key (počinje sa `AIzaSy...`)

### 2. Dodaj API Key u Netlify

1. Idi na **Netlify Dashboard**
2. Odaberi svoj site
3. **Site settings** → **Environment variables**
4. Klikni **"Add a variable"**
5. Dodaj:
   ```
   Key: GOOGLE_AI_API_KEY
   Value: AIzaSy... (tvoj API key)
   ```
6. **Save**
7. **Redeploy** site da bi promjene stupile na snagu

### 3. Testiraj u frontendu

Promijeni endpoint u tvom frontend kodu (privremeno za testiranje):

```javascript
// ORIGINAL (Replicate)
const endpoint = '/.netlify/functions/generate-image';

// TEST (Google AI)
const endpoint = '/.netlify/functions/generate-image-google';
```

Ili napravi toggle switch:

```javascript
const useGoogleAI = true; // Promijeni na false za Replicate

const response = await fetch(
  useGoogleAI 
    ? '/.netlify/functions/generate-image-google'
    : '/.netlify/functions/generate-image',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId: 'got-dubrovnik',
      image1Url: imageUrl,
      isCouple: false
    })
  }
);
```

---

## 📊 Usporedba

### Replicate (Originalna verzija)
- ✅ Pouzdano radi
- ✅ Jednostavno za setup
- ❌ Skuplje: $0.039 po slici
- ✅ Asinhrono (polling)
- ✅ Backup sigurnost

### Google AI Studio (Test verzija)
- 🧪 Novi kod - testiranje
- ✅ 70% jeftinije: ~$0.001 po slici
- ✅ **Besplatno** do 1,500 zahtjeva/dan
- ✅ Sinhrono - direktan odgovor
- ✅ Direktan pristup Google modelu
- ❌ Novi API - mogući bugovi

---

## 🔧 Troubleshooting

### Error: "GOOGLE_AI_API_KEY not configured"
- Dodaj API key u Netlify Environment Variables
- Redeploy site nakon dodavanja

### Error: "Failed to fetch image"
- Provjeri da li su slike dostupne na Bunny.net CDN
- Provjeri URL-ove slika

### Error: "Google AI API error (400)"
- API key nije valjan
- Model name nije točan (trebao bi biti `gemini-2.5-flash-image`)

### Error: "Rate limit exceeded (429)"
- Besplatni tier ima 1,500 zahtjeva/dan
- Pričekaj ili upgrade na plaćeni tier

---

## 📝 Ako test verzija NE radi

Jednostavno se vrati na original:

1. U frontendu koristi original endpoint: `/.netlify/functions/generate-image`
2. Original verzija i dalje radi sa Replicate
3. Ništa nije pokvareno - test verzija je u zasebnom fajlu

---

## ✅ Ako test verzija RADI

Opcije:

### A) Zamijeni original (preporučeno)
```bash
# Backup original
mv generate-image.js generate-image-replicate-backup.js

# Promijeni Google verziju u glavni
mv generate-image-google.js generate-image.js

# Update frontend da koristi /.netlify/functions/generate-image
```

### B) Koristi obje paralelno
- Zadrži oba fajla
- Dodaj switch u frontendu
- Korisnik bira koji provider (ili automatski fallback)

---

## 💰 Pricing

### Replicate
- **$0.039** per slika
- 100 slika = **$3.90**
- 1,000 slika = **$39.00**

### Google AI Studio
- **Besplatno**: do 1,500 zahtjeva/dan
- **Plaćeno**: ~$0.001 per slika
- 100 slika = **$0.10**
- 1,000 slika = **$1.00**

**Ušteda: ~97%** 🎉

---

## 📚 Dokumentacija

- Google AI Studio: https://aistudio.google.com/
- Gemini API Docs: https://ai.google.dev/docs
- Model: `gemini-2.5-flash-image`

---

## ⚠️ Važno

- **Original verzija** (`generate-image.js`) ostaje netaknuta kao backup
- **Test verzija** (`generate-image-google.js`) je u zasebnom fajlu
- Možeš sigurno testirati bez straha od kvara

---

**Autor**: Raincrest.art Development Team  
**Datum**: 2024  
**Status**: 🧪 Experimental - Test before production use

