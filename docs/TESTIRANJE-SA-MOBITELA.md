# 📱 Testiranje sa Mobitela - Raincrest.art

## ⚠️ Trenutno Stanje

**Stranica još NIJE deployana**, pa nema live URL-a. Ne može se pristupiti s mobitela preko interneta.

---

## 🎯 Opcije za Testiranje

### **Opcija 1: Lokalno Testiranje (Preko WiFi Mreže)** ⭐ Preporučeno za brzo testiranje

#### Što Trebaš:
- ✅ Računalo i mobitel na ISTOJ WiFi mreži
- ✅ Netlify CLI instaliran
- ✅ Node.js instaliran

#### Koraci:

**1. Pronađi IP adresu računala:**
```powershell
# U PowerShell-u:
ipconfig
```
Traži **IPv4 Address** (npr. `192.168.1.100`)

**2. Pokreni lokalni server:**
```powershell
# U folderu projekta:
netlify dev
```
Ili ako nemaš Netlify CLI:
```powershell
# Jednostavni HTTP server (instaliraj prvo: npm install -g http-server)
http-server -p 8888 -a 0.0.0.0
```

**3. Otvori na mobitelu:**
- U browseru na mobitelu upiši:
```
http://192.168.1.100:8888
```
(Zamijeni `192.168.1.100` s tvojom IP adresom)

**4. Ako ne radi:**
- Provjeri Windows Firewall (dopusti port 8888)
- Provjeri da su računalo i mobitel na istoj WiFi mreži
- Pokušaj s `http://localhost:8888` na računalu prvo

---

### **Opcija 2: Deploy na Netlify (Online, Dostupno Svugdje)** ⭐ Preporučeno za production

#### Koraci:

**1. Instaliraj Netlify CLI (ako već nemaš):**
```powershell
npm install -g netlify-cli
```

**2. Login u Netlify:**
```powershell
netlify login
```
- Otvorit će se browser
- Autoriziraj pristup

**3. Linkaj projekt (prvi put):**
```powershell
cd C:\Users\bakat\Desktop\tapthemap\raincrest.art
netlify init
```

Odaberi:
- **Create & configure new site**
- **Team:** Tvoj account
- **Site name:** `raincrest-art` (ili custom)
- **Build command:** (prazno - static site)
- **Publish directory:** `.` (trenutni folder)

**4. Deploy:**
```powershell
netlify deploy --prod
```

**5. Dobit ćeš URL:**
```
https://raincrest-art.netlify.app
```
(ili custom ime ako si ga odabrao)

**6. Otvori na mobitelu:**
- U browseru na mobitelu upiši dobiveni URL
- Stranica je dostupna svugdje (ne samo na WiFi mreži)

---

### **Opcija 3: GitHub Pages (Alternativa)** 

Ako ne želiš koristiti Netlify:

**1. Push na GitHub:**
```powershell
git push origin main
```

**2. U GitHub repozitoriju:**
- Settings → Pages
- Source: `main` branch
- Save

**3. URL će biti:**
```
https://bakatraka555.github.io/Raincrest.art/
```

---

## 🚀 Brzi Start - Netlify Deploy

### Jednostavni Workflow:

```powershell
# 1. Provjeri da si u pravom folderu
cd C:\Users\bakat\Desktop\tapthemap\raincrest.art

# 2. Login (samo prvi put)
netlify login

# 3. Init (samo prvi put)
netlify init

# 4. Deploy
netlify deploy --prod
```

**Nakon deploya:**
- Dobit ćeš URL tipa: `https://raincrest-art.netlify.app`
- Otvori taj URL na mobitelu
- Stranica je live! 🎉

---

## 📱 Testiranje na Mobitelu

### Što Testirati:

1. **Hero sekcija:**
   - ✅ Trading card slika se učitava
   - ✅ Animacije rade
   - ✅ CTA button je klikabilan

2. **Gallery sekcija:**
   - ✅ Slike se učitavaju
   - ✅ Swipe/carousel radi
   - ✅ Overlay informacije su vidljive

3. **Scene sekcija:**
   - ✅ Scene slike se učitavaju
   - ✅ Klik na scene radi

4. **Before/After slider:**
   - ✅ Slider radi (touch)
   - ✅ Slike se učitavaju

5. **Responsive dizajn:**
   - ✅ Tekst je čitljiv
   - ✅ Buttoni su dovoljno veliki za touch
   - ✅ Layout je dobar na malom ekranu

6. **Performance:**
   - ✅ Stranica se brzo učitava
   - ✅ Slike se optimizirano učitavaju

---

## 🔧 Troubleshooting

### Problem: "Cannot connect" na mobitelu

**Rješenje:**
- Provjeri da su računalo i mobitel na istoj WiFi mreži
- Provjeri Windows Firewall (dopusti port 8888)
- Pokušaj s drugim portom: `http-server -p 3000 -a 0.0.0.0`

### Problem: "Site not found" na Netlify

**Rješenje:**
- Provjeri da si deployao: `netlify deploy --prod`
- Provjeri Netlify Dashboard da je deploy uspješan
- Provjeri URL u Netlify Dashboard

### Problem: Slike se ne učitavaju

**Rješenje:**
- Provjeri da su sve slike commitane i pushane na GitHub
- Provjeri da su putanje u `index.html` točne
- Provjeri da su slike u root folderu

---

## ✅ Checklist Prije Deploya

- [ ] Sve slike su generirane i u folderu
- [ ] `index.html` koristi lokalne slike (ne Unsplash)
- [ ] Sve promjene su commitane: `git add . && git commit -m "Ready for deploy"`
- [ ] Pushano na GitHub: `git push origin main`
- [ ] Netlify CLI instaliran: `npm install -g netlify-cli`
- [ ] Netlify login: `netlify login`

---

## 🎯 Preporučeni Redoslijed

1. **Prvo: Lokalno testiranje** (Opcija 1)
   - Brzo testiranje na mobitelu
   - Provjeri da sve radi

2. **Zatim: Deploy na Netlify** (Opcija 2)
   - Stranica dostupna online
   - Možeš dijeliti URL s drugima
   - Production-ready

---

## 📞 Quick Commands

```powershell
# Lokalno testiranje
netlify dev
# Ili:
http-server -p 8888 -a 0.0.0.0

# Deploy na Netlify
netlify deploy --prod

# Provjeri status
netlify status
```

---

## 🎉 Nakon Deploya

Kada je stranica deployana:

1. **Otvori na mobitelu:**
   ```
   https://raincrest-art.netlify.app
   ```

2. **Dijeli s drugima:**
   - Pošalji URL prijateljima
   - Testiraj na različitim uređajima
   - Provjeri na različitim browserima

3. **Monitoriraj:**
   - Netlify Dashboard → Analytics
   - Provjeri brzinu učitavanja
   - Provjeri greške (ako ih ima)

---

**Spremno za testiranje!** 🚀

