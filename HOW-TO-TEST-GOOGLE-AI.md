# 🧪 Kako testirati Google AI verziju

## ✅ Sve je spremno!

Tvoj kod sada ima **toggle switch** za lako prebacivanje između:
- ✅ **Replicate** (original, pouzdano, $0.039/slika)
- 🧪 **Google AI Studio** (test, 70% jeftinije, ~$0.001/slika)

---

## 📍 Gdje je toggle?

**Fajl:** `order.html`  
**Linija:** ~1528  

```javascript
// ⚙️ TOGGLE: Izaberi AI provider
const USE_GOOGLE_AI = false; // 🧪 Promijeni u true za testiranje
```

---

## 🚀 Testiranje - Step by Step

### 1️⃣ Dobij Google AI API Key (ako već nemaš)

🔗 **Idi na:** https://aistudio.google.com/apikey

1. Prijavi se Google accountom
2. Klikni **"Create API key"**
3. Kopiraj key (počinje sa `AIzaSy...`)

### 2️⃣ Dodaj API Key u Netlify

🔗 **Idi na:** Netlify Dashboard → Your Site → Site settings → Environment variables

**Dodaj novu varijablu:**
```
Key:   GOOGLE_AI_API_KEY
Value: AIzaSy... (tvoj API key)
```

**💡 Važno:** Klikni **Save** i onda **Redeploy** site!

### 3️⃣ Aktiviraj Google AI u kodu

**Otvori:** `order.html`  
**Nađi liniju ~1528:**

```javascript
// PRIJE (koristi Replicate)
const USE_GOOGLE_AI = false;

// PROMIJENI U (koristi Google AI)
const USE_GOOGLE_AI = true;
```

**Sačuvaj** fajl.

### 4️⃣ Deploy promjene

Opcija A: Push na GitHub (ako imaš auto-deploy)
```bash
git add order.html
git commit -m "Test Google AI toggle"
git push origin main
```

Opcija B: Ručni deploy u Netlify
- Drag & drop folder na Netlify Dashboard

### 5️⃣ Testiraj!

1. **Otvori** svoj site: `https://tvoj-site.netlify.app/order`
2. **Upload** sliku(e)
3. **Odaberi** template
4. **Klikni** "Generate"
5. **Provjeri** browser console (F12):
   ```
   🤖 AI Provider: Google AI Studio (TEST)
   📡 Endpoint: /.netlify/functions/generate-image-google
   ```

---

## 🔍 Što očekivati

### ✅ Ako Google AI radi:

**Console log:**
```
🤖 AI Provider: Google AI Studio (TEST)
📡 Endpoint: /.netlify/functions/generate-image-google
✅ Google AI direct response - image ready immediately!
Provider: Google AI Studio (direct)
Model: gemini-2.5-flash-image
📸 Displaying final image...
```

**Prednosti:**
- ⚡ **Brže** - slika odmah (bez pollinga)
- 💰 **Jeftinije** - ~$0.001 vs $0.039
- 🎁 **Besplatno** - 1,500 slika/dan

### ❌ Ako ne radi:

**Provjeri:**
1. Da li si dodao `GOOGLE_AI_API_KEY` u Netlify?
2. Da li si **redeploy-ao** site nakon dodavanja key-a?
3. Da li je `USE_GOOGLE_AI = true` u kodu?
4. Provjeri **Netlify Function Logs** za greške

**Console error primjeri:**
```
// ❌ API key missing
Error: GOOGLE_AI_API_KEY not configured

// ❌ API key nevažeći  
Error: Google AI API error (400)

// ❌ Rate limit
Error: Rate limit exceeded (429)
```

---

## 🔄 Povratak na Replicate

Ako Google AI ne radi ili želiš original:

**1. Otvori:** `order.html`  
**2. Promijeni:**
```javascript
const USE_GOOGLE_AI = false; // Nazad na Replicate
```
**3. Sačuvaj i deploy**

**Ili jednostavno nemoj deploy-ati tu promjenu!** Original i dalje radi. 😊

---

## 📊 Usporedba rezultata

### Replicate (Original)
```
⏱️ Vrijeme: 20-40 sekundi (polling)
💰 Cijena: $0.039 po slici
📡 Flow: Upload → Generate (predictionId) → Poll → CDN Upload → Prikaži
✅ Pouzdanost: Visoka
```

### Google AI (Test)
```
⏱️ Vrijeme: 10-20 sekundi (direktno)
💰 Cijena: ~$0.001 po slici (97% jeftinije!)
📡 Flow: Upload → Generate (direktna slika) → Prikaži
🧪 Pouzdanost: Testiranje potrebno
```

---

## 💡 Pro Tips

### Paralelno testiranje

Možeš dodati UI toggle da korisnik bira:

```javascript
// Dodaj checkbox u HTML
<label>
  <input type="checkbox" id="useGoogleAI"> Use Google AI (beta, faster)
</label>

// U JavaScript-u
const useGoogleAI = document.getElementById('useGoogleAI').checked;
const endpoint = useGoogleAI 
  ? '/.netlify/functions/generate-image-google'
  : '/.netlify/functions/generate-image';
```

### A/B Testing

Toggle možeš postaviti i randomom:

```javascript
// 50% korisnika dobije Google AI
const USE_GOOGLE_AI = Math.random() < 0.5;
console.log('🎲 Random A/B test:', USE_GOOGLE_AI ? 'Google AI' : 'Replicate');
```

---

## 🐛 Troubleshooting

### Problem: "GOOGLE_AI_API_KEY not configured"

**Rješenje:**
1. Idi na Netlify Dashboard
2. Site settings → Environment variables
3. Dodaj `GOOGLE_AI_API_KEY`
4. **Redeploy site!** (Environment promjene zahtijevaju redeploy)

### Problem: "Google AI API error (400)"

**Mogući uzroci:**
- API key nije valjan
- API key nema pristup `gemini-2.5-flash-image` modelu
- Prompt je predug (max ~8000 karaktera)

**Rješenje:**
- Provjer API key na https://aistudio.google.com/apikey
- Kreiraj novi API key ako treba

### Problem: "Rate limit exceeded (429)"

**Uzrok:** Besplatni tier ima 1,500 zahtjeva/dan

**Rješenje:**
- Pričekaj 24h
- Ili upgrade na plaćeni tier (i dalje jeftinije od Replicate)

### Problem: Slika se ne prikazuje

**Provjeri console:**
- Da li ima `finalImageUrl`?
- Je li slika u base64 formatu (`data:image/jpeg;base64,...`)?
- Da li `showResults()` funkcija radi?

---

## 📝 Nakon testiranja

### Ako Google AI RADI DOBRO:

**Opcija 1:** Zadrži toggle i promijeni default na `true`
```javascript
const USE_GOOGLE_AI = true; // Google AI je sada default
```

**Opcija 2:** Zamijeni original funkciju
```bash
# Backup original
mv netlify/functions/generate-image.js netlify/functions/generate-image-replicate-backup.js

# Aktiviraj Google kao glavni
mv netlify/functions/generate-image-google.js netlify/functions/generate-image.js

# Ukloni toggle iz order.html (uvijek koristi generate-image)
```

**Opcija 3:** Zadrži obje i daj korisniku izbor (premium feature!)

### Ako Google AI NE RADI:

**Jednostavno nemoj mijenjati `USE_GOOGLE_AI = false`**

Original Replicate verzija radi bez ikakvih promjena! ✅

---

## 📊 Statistika

Nakon ~100 testnih slika možeš usporediti:
- ⏱️ **Prosječno vrijeme generiranja**
- 💰 **Trošak**
- ✅ **Uspješnost (success rate)**
- 🎨 **Kvaliteta slika**

---

## 🎯 Trenutno stanje

✅ **Kod spreman** - toggle switch dodan u `order.html`  
✅ **Backup siguran** - original Replicate verzija netaknuta  
✅ **GitHub commit** - sve je commitano  
🎯 **Tvoj korak** - dobij Google AI API key i testiraj!

---

**Status:** 🟢 Ready for testing  
**Risk:** 🟢 Low (original backup postoji)  
**Potencijalna ušteda:** 💰 97%

Good luck! 🚀

