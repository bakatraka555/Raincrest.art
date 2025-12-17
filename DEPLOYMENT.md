# 🚀 Raincrest Art - Deployment Guide

Kompletne instrukcije za deployment tvoje nove aplikacije **Raincrest Art** na Netlify!

---

## ✅ Što je već gotovo

### Branding - 100% Završeno ✨
- ✅ **Naziv**: "Raincrest Art" (svugdje prebrendiran)
- ✅ **Download filenames**: `raincrest-image.jpg`, `raincrest-video.mp4`
- ✅ **Dizajn**: Moderan ljubičasti gradient (#667eea → #764ba2)
- ✅ **Landing page**: `index.html` sa punim Raincrest brandom
- ✅ **Order page**: `order.html` sa 🎨 emoji i art temom
- ✅ **localStorage**: `raincrestProgress` (više nije "lovestories")
- ✅ **package.json**: `raincrest-art` package name
- ✅ **README.md**: Sva dokumentacija ažurirana
- ✅ **netlify.toml**: Konfiguracija ažurirana
- ✅ **Netlify Functions**: Sve fallback vrijednosti postavljene na `raincrest-art`

### Battle-Tested Fixes Uključeni
- ✅ Canvas-to-Blob konverzija za Android compatibility
- ✅ Signed token system (E006 fix)
- ✅ Direct browser-to-CDN upload
- ✅ HEIC image support
- ✅ Mobile-first responsive design
- ✅ Automatic CDN propagation handling

---

## 📋 Što trebaš PRIJE deployementa

### 1. GitHub Account
Ako još nemaš GitHub nalog:
1. Idi na https://github.com
2. Klikni "Sign up"
3. Kreiraj nalog sa email adresom

### 2. Bunny.net Storage Zone
Kreiraj novu Storage Zone za Raincrest:
1. Log in na https://bunny.net
2. Storage → Add Storage Zone
3. **Name**: `raincrest-art`
4. **Region**: Odaberi najbliži region (npr. Stockholm ili Frankfurt za EU)
5. Kreiraj **Pull Zone** (CDN):
   - Name: `raincrest-cdn`
   - Hostname: `raincrest-cdn.b-cdn.net`
   - Origin: Link na `raincrest-art` Storage Zone

### 3. Netlify Account
1. Idi na https://netlify.com
2. "Sign up" → Odaberi "Sign up with GitHub"
3. Autoriziraj Netlify da pristupa tvom GitHub nalogu

---

## 🚀 Deployment Steps

### Step 1: Postavi Git Configuration
Otvori PowerShell u `C:\Users\bakat\Desktop\tapthemap\raincrest.art` folderu:

```bash
# Postavi svoj email i ime
git config user.email "tvoj@email.com"
git config user.name "Tvoje Ime"
```

### Step 2: Kreiraj GitHub Repository
1. Idi na https://github.com/new
2. **Repository name**: `raincrest-art`
3. **Visibility**: Public (ili Private ako želiš)
4. **NE** dodaj README, .gitignore, ili license (već imaš u projektu)
5. Klikni "Create repository"

### Step 3: Push Code na GitHub
Kopiraj ove komande (zamijeni `[username]` sa svojim GitHub korisničkim imenom):

```bash
cd "C:\Users\bakat\Desktop\tapthemap\raincrest.art"

# Provjeri status
git status

# Commit sve promjene
git add .
git commit -m "🎨 Rebrand: Raincrest Art deployment ready"

# Dodaj GitHub remote
git remote add origin https://github.com/[username]/raincrest-art.git

# Push na GitHub
git push -u origin main
```

**Napomena**: Možda će ti GitHub zatražiti authentication. Koristi GitHub Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Odaberi scope: `repo` (puni pristup repozitorijima)
4. Kopiraj token i koristi ga kao password

### Step 4: Deploy na Netlify
1. Log in na https://app.netlify.com
2. Klikni "Add new site" → "Import an existing project"
3. Odaberi "GitHub" kao Git provider
4. Odaberi `raincrest-art` repository
5. **Build settings**:
   - Build command: (ostavi prazno)
   - Publish directory: `.` (root)
6. Klikni "Deploy site"

### Step 5: Postavi Environment Variables u Netlify
1. U Netlify Dashboard, idi u svoj site
2. Site settings → Environment variables
3. Klikni "Add a variable" za svaku od ovih:

```env
REPLICATE_API_TOKEN=isti_kao_lovestories
BUNNY_API_KEY=isti_kao_lovestories
BUNNY_STORAGE_ZONE=raincrest-art
BUNNY_CDN_DOMAIN=raincrest-cdn.b-cdn.net
REPLICATE_MODEL=google/nano-banana
```

**Napomena**: Kopiraj vrijednosti `REPLICATE_API_TOKEN` i `BUNNY_API_KEY` iz Love Stories Netlify environment variables.

### Step 6: Redeploy sa Environment Variables
1. Deploys tab → Klikni "Trigger deploy" → "Deploy site"
2. Pričekaj da deployment završi (~1 min)

---

## 🎯 Test Deployment

Nakon što je deployment završen:

1. **Test Landing Page**:
   - Otvori svoj Netlify site URL (npr. `https://raincrest-art.netlify.app`)
   - Provjeri da vidiš: "🎨 Raincrest Art" naslov, ljubičasti gradient
   - Klikni "Create Your Art →" button

2. **Test Photo Upload**:
   - Upload test sliku (bilo koju fotografiju)
   - Provjeri da upload radi i preview se prikazuje

3. **Test AI Generation**:
   - Pošalji za generaciju
   - Provjeri da dobijaš rezultat (može trajati 30-60 sec)

4. **Test Download**:
   - Klikni "⬇️ Download Image"
   - Provjeri da file ima ime `raincrest-image.jpg`

---

## 🔧 Bunny.net CORS Setup

Ako upload ne radi, možda trebaš omogućiti CORS:

1. Bunny.net Dashboard → Storage Zones → `raincrest-art`
2. **CORS Settings**:
   - Enable CORS: ✅
   - Allowed Origins:
     - `https://*.netlify.app`
     - `https://raincrest-art.netlify.app` (tvoj exact domain)
   - Allowed Methods: `GET, PUT, POST, DELETE`
   - Allowed Headers: `*`

3. Isto uradi za **Pull Zone** (`raincrest-cdn`):
   - Pull Zones → `raincrest-cdn` → CORS Settings
   - Omogući iste postavke

---

## 🎨 Customization Ideas (Opciono)

Nakon što sve radi, možeš dodati:

### Custom Domain
1. Kupi domain (npr. `raincrest.art` ili `raincrestart.com`)
2. Netlify → Domain settings → Add custom domain
3. Konfiguriraj DNS settings kako ti Netlify kaže

### Logo Upload
Upload svoj logo na Bunny.net:
```bash
# Kreiraj logo.jpg file
# Upload na Bunny.net Storage Zone root
# Logo će biti dostupan na: https://raincrest-cdn.b-cdn.net/logo.jpg
```

### Branded Favicon
Dodaj favicon u `index.html` i `order.html`:
```html
<link rel="icon" type="image/png" href="favicon.png">
```

---

## 📊 Monitoring

### Netlify Dashboard
- **Deploys**: Vidi sve deploymente i buildove
- **Functions**: Logovi za svaku serverless funkciju
- **Analytics**: Traffic i korištenje (potreban Netlify Analytics plan)

### Bunny.net Dashboard
- **Storage**: Koliko prostora koristiš
- **Bandwidth**: Koliko traffica generiraš
- **Statistics**: Broj requesta, cache hit rate

### Replicate Dashboard
- **API Usage**: Koliko AI generacija si koristio
- **Costs**: Trošak po modelu
- Link: https://replicate.com/account/billing

---

## 🐛 Troubleshooting

### "Upload failed" greška
- Provjeri Bunny.net CORS settings
- Provjeri da je `BUNNY_API_KEY` točno postavljen
- Otvori browser console (F12) i pogledaj errore

### "Generation failed" ili E006 error
- Provjeri da je `REPLICATE_API_TOKEN` postavljen
- Provjeri da je `REPLICATE_MODEL=google/nano-banana`
- Provjeri Netlify function logs

### Deployment fails
- Provjeri da su sve environment variables postavljene
- Provjeri build logs u Netlify
- Provjeri da GitHub repo ima sve filesove

---

## 🎉 Next Steps

Kada sve radi:
1. ✅ Test sa mobitelom (QR code ili direktan link)
2. ✅ Podijeli link sa prijateljima za feedback
3. ✅ Razmisli o custom domain
4. ✅ Monitor usage na Bunny.net i Replicate
5. ✅ Dodaj Google Analytics (opciono)

---

## 📞 Need Help?

- **GitHub Issues**: Kreiraj issue u svom repo
- **Netlify Support**: https://answers.netlify.com
- **Bunny.net Support**: https://bunny.net/support
- **Replicate Docs**: https://replicate.com/docs

---

**Built with ❤️ - Your Raincrest Art is ready to shine! 🎨✨**

