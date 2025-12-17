# 🔐 Environment Variables Setup Guide

## ✅ Tvoj kod već koristi Environment Variables!

Tvoj kod već pravilno čita API ključeve iz environment varijabli:

```javascript
// U netlify/functions/generate-image-google.js (linija 70)
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
```

**To je ispravno!** ✅ Ključevi se **NE** pišu direktno u kod.

---

## 🌐 1. Postavi na Netlify (Production)

### Korak 1: Idi na Netlify Dashboard

🔗 **https://app.netlify.com**

1. Odaberi svoj site (raincrest.art)
2. Klikni **"Site settings"** (lijevi menu)
3. Klikni **"Environment variables"** (lijevi menu)

### Korak 2: Dodaj varijable

**Za Google AI:**
```
Key:   GOOGLE_AI_API_KEY
Value: AIzaSy... (tvoj API key)
Scope: All scopes (Builds, Functions, Deploys)
```

**Za Replicate (backup):**
```
Key:   REPLICATE_API_TOKEN
Value: r8_... (tvoj Replicate token)
Scope: All scopes
```

**Za Bunny.net (upload slika):**
```
Key:   BUNNY_API_KEY
Value: tvoj_bunny_key
Key:   BUNNY_STORAGE_ZONE
Value: tvoj_storage_zone_name
Key:   BUNNY_CDN_DOMAIN (opciono)
Value: tvoj_cdn_domain.b-cdn.net
```

### Korak 3: Redeploy!

**VAŽNO:** Nakon dodavanja environment varijabli, **moraš redeploy-ati site!**

```
Netlify Dashboard → Deploys → Trigger deploy → Deploy site
```

💡 **Zašto?** Environment varijable se učitavaju samo pri deploy-u, ne u runtime!

---

## 💻 2. Lokalno testiranje (Development)

### Korak 1: Instaliraj Netlify CLI

```bash
npm install -g netlify-cli
```

Ili sa `npx` (bez instalacije):
```bash
npx netlify-cli dev
```

### Korak 2: Kreiraj `.env` fajl

U **root folderu** projekta (gdje je `netlify.toml`), kreiraj fajl `.env`:

```bash
# .env (NE COMMITAJ OVAJ FAJL!)
GOOGLE_AI_API_KEY=AIzaSy_tvoj_stvarni_key_ovdje
REPLICATE_API_TOKEN=r8_tvoj_token_ovdje
BUNNY_API_KEY=tvoj_bunny_key
BUNNY_STORAGE_ZONE=tvoj_storage_zone
BUNNY_CDN_DOMAIN=tvoj_cdn_domain.b-cdn.net
```

### Korak 3: Pokreni Netlify Dev

```bash
netlify dev
```

**Netlify CLI automatski učitava `.env` fajl!** ✅

---

## 🔒 Sigurnost

### ✅ Što je već napravljeno:

1. **`.gitignore`** - `.env` je već ignoriran (linija 13)
2. **Kod koristi `process.env`** - ne hardcode-uje ključeve
3. **Error handling** - ako ključ nije pronađen, vraća jasnu grešku

### ⚠️ Što NE raditi:

❌ **NE piši ključeve direktno u kod:**
```javascript
// ❌ LOŠE - nikad ovo!
const API_KEY = "AIzaSy_1234567890";
```

✅ **DOBRO - koristi environment:**
```javascript
// ✅ DOBRO - koristi environment
const API_KEY = process.env.GOOGLE_AI_API_KEY;
```

❌ **NE commitaj `.env` fajl:**
```bash
# ❌ LOŠE
git add .env
git commit -m "Add API keys"  # NIKAD!
```

✅ **DOBRO - `.env` je u `.gitignore`:**
```bash
# ✅ DOBRO - .env je ignoriran
git status  # .env se neće pojaviti
```

---

## 📋 Checklist

### Production (Netlify):
- [ ] `GOOGLE_AI_API_KEY` dodan u Netlify Environment variables
- [ ] `REPLICATE_API_TOKEN` dodan (backup)
- [ ] `BUNNY_API_KEY` dodan
- [ ] `BUNNY_STORAGE_ZONE` dodan
- [ ] Site **redeploy-ovan** nakon dodavanja varijabli
- [ ] Testirao da radi

### Development (Lokalno):
- [ ] Netlify CLI instaliran (`npm install -g netlify-cli`)
- [ ] `.env` fajl kreiran u root folderu
- [ ] API ključevi dodani u `.env`
- [ ] `.env` je u `.gitignore` (već je!)
- [ ] `netlify dev` radi i učitava varijable

---

## 🧪 Testiranje

### Test 1: Provjeri da li se varijabla učitava

U Netlify Function, dodaj privremeno:

```javascript
console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);
console.log('API Key length:', process.env.GOOGLE_AI_API_KEY?.length || 0);
```

**Ako vidiš:**
- `API Key present: true` → ✅ Radi!
- `API Key present: false` → ❌ Varijabla nije postavljena ili redeploy nije napravljen

### Test 2: Provjeri Netlify Dashboard

1. Idi na **Site settings → Environment variables**
2. Provjeri da li su sve varijable vidljive
3. Provjeri **Scope** - mora biti "All scopes" ili barem "Functions"

---

## 🐛 Troubleshooting

### Problem: "GOOGLE_AI_API_KEY not configured"

**Uzrok:**
- Varijabla nije dodana u Netlify
- Site nije redeploy-ovan nakon dodavanja
- Scope nije ispravan

**Rješenje:**
1. Provjeri Netlify Dashboard → Environment variables
2. Dodaj varijablu ako nije
3. **Redeploy site!** (Deploys → Trigger deploy)

### Problem: Lokalno ne radi (`netlify dev`)

**Uzrok:**
- `.env` fajl ne postoji
- `.env` nije u root folderu
- Netlify CLI nije instaliran

**Rješenje:**
1. Kreiraj `.env` u root folderu (gdje je `netlify.toml`)
2. Dodaj varijable u `.env`
3. Pokreni `netlify dev` (ne `npm start`)

### Problem: Varijabla se ne učitava

**Provjeri:**
1. Ime varijable je **točno** isto (case-sensitive!)
2. Nema razmaka oko `=` u `.env`: `KEY=value` (ne `KEY = value`)
3. Nema navodnika oko vrijednosti: `KEY=value` (ne `KEY="value"`)

---

## 📚 Dodatni resursi

- **Netlify Environment Variables:** https://docs.netlify.com/environment-variables/overview/
- **Netlify CLI:** https://cli.netlify.com/
- **Google AI API Key:** https://aistudio.google.com/apikey
- **Replicate API Tokens:** https://replicate.com/account/api-tokens

---

## ✅ Status

- ✅ Kod koristi `process.env` (sigurno)
- ✅ `.env` je u `.gitignore` (sigurno)
- ✅ Error handling postoji (jasne greške)
- 🎯 **Tvoj korak:** Dodaj varijable u Netlify Dashboard i redeploy!

---

**Sve je spremno za sigurno korištenje API ključeva!** 🔒

