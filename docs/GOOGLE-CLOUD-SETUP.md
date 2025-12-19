# 🚀 Google Cloud Functions Setup Guide

## 📋 Pregled

Ova dokumentacija objašnjava kako postaviti Google Cloud Functions worker za Google AI generaciju, što eliminira timeout probleme na Netlify Free tieru.

**Prednosti:**
- ✅ **Nema timeout problema** (540s timeout vs 26s na Netlify Free)
- ✅ **Besplatno** za 100 slika/mjesec (Google Cloud Functions free tier)
- ✅ **Bolja integracija** s Google AI (isti network)
- ✅ **Brže** upload na Google Cloud Storage

---

## 🔧 Korak 1: Kreiraj Google Cloud Projekt

1. Idi na [Google Cloud Console](https://console.cloud.google.com/)
2. Klikni "Select a project" → "New Project"
3. Ime projekta: `raincrest-art` (ili bilo koje ime)
4. Klikni "Create"

---

## 🔧 Korak 2: Omogući Potrebne API-je

1. U Google Cloud Console, idi na "APIs & Services" → "Library"
2. Omogući sljedeće API-je:
   - **Cloud Functions API**
   - **Cloud Storage API**
   - **Cloud Build API** (za deployment)

---

## 🔧 Korak 3: Kreiraj Google Cloud Storage Bucket

1. Idi na "Cloud Storage" → "Buckets"
2. Klikni "Create Bucket"
3. Ime: `raincrest-art-images` (ili bilo koje ime)
4. Location: `us-central1` (ili najbliža regija)
5. Storage class: `Standard`
6. Access control: `Uniform` (ili `Fine-grained` ako želiš)
7. Klikni "Create"

### Postavi Public Access

1. Klikni na bucket → "Permissions"
2. Klikni "Grant Access"
3. Principal: `allUsers`
4. Role: `Storage Object Viewer`
5. Klikni "Save"

---

## 🔧 Korak 4: Kreiraj Service Account

1. Idi na "IAM & Admin" → "Service Accounts"
2. Klikni "Create Service Account"
3. Ime: `cloud-functions-worker`
4. Description: "Service account for Cloud Functions worker"
5. Klikni "Create and Continue"
6. Role: `Cloud Functions Invoker` + `Storage Object Admin`
7. Klikni "Done"

### Kreiraj JSON Key

1. Klikni na service account
2. Idi na "Keys" tab
3. Klikni "Add Key" → "Create new key"
4. Type: `JSON`
5. Klikni "Create" (download-uje se JSON fajl)
6. **VAŽNO:** Spremi ovaj fajl sigurno! Trebat će ti za deployment.

---

## 🔧 Korak 5: Postavi Environment Variables

1. Idi na "Cloud Functions" → "Create Function"
2. **Ime:** `generate-image-worker`
3. **Region:** `us-central1` (ili najbliža)
4. **Trigger:** `HTTP`
5. **Authentication:** `Allow unauthenticated invocations` (ili `Require authentication` za sigurnost)
6. **Runtime:** `Node.js 20`
7. **Entry point:** `generateImageWorker`
8. **Memory:** `512 MB`
9. **Timeout:** `540 seconds` (9 minuta - dovoljno za bilo koju generaciju!)

### Environment Variables:

Klikni "Runtime, build, connections and security settings" → "Runtime environment variables":

```
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GCS_BUCKET_NAME=raincrest-art-images
GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images
```

---

## 🔧 Korak 6: Deploy Google Cloud Function

### Opcija A: Preko Google Cloud Console (GUI)

1. Idi na "Cloud Functions" → "Create Function"
2. Popuni sve podatke iz Koraka 5
3. U "Source code" sekciji:
   - **Source:** `Inline editor` (za test) ili `Cloud Source Repository` (za production)
   - Kopiraj kod iz `netlify/functions/generate-image-google-worker-gcp.js`
4. Klikni "Deploy"

### Opcija B: Preko gcloud CLI (preporučeno)

```bash
# 1. Instaliraj Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# 2. Login
gcloud auth login

# 3. Postavi projekt
gcloud config set project raincrest-art

# 4. Deploy funkciju
gcloud functions deploy generate-image-worker \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=netlify/functions \
  --entry-point=generateImageWorker \
  --trigger=http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB \
  --set-env-vars GOOGLE_AI_API_KEY=xxx,GCS_BUCKET_NAME=raincrest-art-images,GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images \
  --service-account=cloud-functions-worker@raincrest-art.iam.gserviceaccount.com
```

**Napomena:** Zamijeni `xxx` sa svojim Google AI API key-om.

---

## 🔧 Korak 7: Dobij Function URL

1. Nakon deployment-a, idi na "Cloud Functions"
2. Klikni na `generate-image-worker`
3. Idi na "Trigger" tab
4. Kopiraj **Trigger URL** (npr. `https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker`)

---

## 🔧 Korak 8: Postavi u Netlify

1. Idi na Netlify Dashboard → Site settings → Environment variables
2. Dodaj:
   ```
   GCP_FUNCTION_URL=https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker
   GCS_BUCKET_NAME=raincrest-art-images
   GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images
   ```
3. **Redeploy site!** (Environment promjene zahtijevaju redeploy)

---

## 🔧 Korak 9: Instaliraj Dependencies (za lokalni deployment)

Ako deploy-uješ preko gcloud CLI, trebaš `package.json` u `netlify/functions/` folderu:

```json
{
  "name": "generate-image-worker",
  "version": "1.0.0",
  "dependencies": {
    "@google-cloud/functions-framework": "^3.0.0",
    "@google-cloud/storage": "^7.0.0",
    "node-fetch": "^2.6.7"
  }
}
```

---

## ✅ Testiranje

1. Otvori `order.html` u browseru
2. Upload sliku i klikni "Generate"
3. Provjeri Netlify Function logs - trebao bi vidjeti:
   ```
   Starting Google Cloud Function worker: https://...
   ```
4. Provjeri Google Cloud Function logs - trebao bi vidjeti:
   ```
   [Job google-...] Starting Google AI generation...
   [Job google-...] ✅ Success! Image available at: https://storage.googleapis.com/...
   ```

---

## 🐛 Troubleshooting

### Problem: "GCP_FUNCTION_URL not configured"

**Rješenje:**
- Provjeri da li si dodao `GCP_FUNCTION_URL` u Netlify Environment Variables
- **Redeploy site!**

### Problem: "Permission denied" pri upload-u na GCS

**Rješenje:**
- Provjeri da li je service account ima `Storage Object Admin` role
- Provjeri da li je bucket javno dostupan (ili da service account ima pristup)

### Problem: "Function timeout"

**Rješenje:**
- Provjeri da li je timeout postavljen na 540s u Cloud Function settings
- Provjeri Google Cloud Function logs za detalje

### Problem: "Bucket not found"

**Rješenje:**
- Provjeri da li je `GCS_BUCKET_NAME` točan
- Provjeri da li bucket postoji u Google Cloud Console

---

## 💰 Cijena

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

## 📊 Usporedba

| Feature | Netlify Worker | Google Cloud Function |
|---------|----------------|----------------------|
| **Timeout** | 26s (Free) / 120s (Pro) | 540s ✅ |
| **Cijena** | Besplatno (Free) / $19/mjesec (Pro) | Besplatno (Free tier) ✅ |
| **Setup** | Jednostavno | Kompleksnije |
| **Integracija** | Loša (vanjski servis) | Odlična (isti network) ✅ |

---

## 🎯 Preporuka

**Za 100 slika/mjesec:**
- ✅ Koristi Google Cloud Functions worker
- ✅ Besplatno (free tier dovoljan)
- ✅ Nema timeout problema
- ✅ Bolja integracija s Google AI

---

## 📚 Reference

- [Google Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Google Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Cloud Functions Pricing](https://cloud.google.com/functions/pricing)
- [Cloud Storage Pricing](https://cloud.google.com/storage/pricing)

---

**Status:** ✅ Ready za deployment  
**Datum:** 2024-12-19  
**Commit:** Google Cloud Functions worker implementacija

