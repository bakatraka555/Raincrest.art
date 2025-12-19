# 🚀 Google AI Quick Start

## Što je spremno:

✅ **Backup original verzije** - `generate-image.js` (Replicate) i dalje radi  
✅ **Nova test verzija** - `generate-image-google.js` kreiran  
✅ **Dokumentacija** - `README-GOOGLE-AI-TEST.md`  
✅ **GitHub commit & push** - Sve je sigurno na GitHub-u

---

## 📝 Tvoj sljedeći korak:

### 1. Dobij Google AI API Key (5 min)

```
🔗 https://aistudio.google.com/apikey
```

1. Prijavi se
2. Klikni "Create API key"
3. Kopiraj key (počinje sa `AIzaSy...`)

### 2. Dodaj u Netlify (2 min)

```
Netlify Dashboard → Your Site → Site settings → Environment variables
```

Dodaj novu varijablu:
```
Key:   GOOGLE_AI_API_KEY
Value: AIzaSy... (tvoj key)
```

Klikni **Save** i **Redeploy site**

### 3. Testiraj (1 min)

Promijeni endpoint u tvom frontend kodu:

```javascript
// PRIJE (Replicate):
const endpoint = '/.netlify/functions/generate-image';

// SADA (Google AI Test):
const endpoint = '/.netlify/functions/generate-image-google';
```

---

## 💰 Ušteda

- **Prije**: $0.039 po slici (Replicate)
- **Sada**: $0.001 po slici (Google AI)
- **Besplatno**: 1,500 slika/dan!

---

## ⚠️ Ako nešto ne radi

Jednostavno vrati original endpoint:

```javascript
const endpoint = '/.netlify/functions/generate-image';
```

Original verzija i dalje radi - ništa nije pokvareno! ✅

---

## 📊 Gdje je što?

| Fajl | Što je |
|------|--------|
| `netlify/functions/generate-image.js` | ✅ Original (Replicate) - backup |
| `netlify/functions/generate-image-google.js` | 🧪 Novi (Google AI) - test |
| `netlify/functions/README-GOOGLE-AI-TEST.md` | 📚 Detaljne upute |
| `GOOGLE-AI-QUICK-START.md` | ⚡ Quick start (ovaj fajl) |

---

**Status**: ✅ Sve je commitano na GitHub  
**Branch**: main  
**Commit**: 82a12ea  
**Akcija**: Idi dobiti Google AI API key! 🎯


