# Google Cloud Function: generate-image-worker

## 📋 Pregled

Ova Google Cloud Function radi kao worker za Google AI generaciju slika. Eliminira timeout probleme na Netlify Free tieru.

**Prednosti:**
- ✅ Timeout: 540 sekundi (9 minuta) - dovoljno za bilo koju generaciju!
- ✅ Besplatno za 100 slika/mjesec (Google Cloud Functions free tier)
- ✅ Bolja integracija s Google AI (isti network)
- ✅ Podržava i Google Cloud Storage i Bunny.net (fallback)

---

## 🚀 Quick Start

### 1. Instaliraj Google Cloud SDK

```bash
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Mac: brew install google-cloud-sdk
# Linux: curl https://sdk.cloud.google.com | bash
```

### 2. Login i postavi projekt

```bash
gcloud auth login
gcloud config set project raincrest-art
```

### 3. Deploy funkciju

```bash
cd gcp-function
npm install
gcloud functions deploy generate-image-worker \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=. \
  --entry-point=generateImageWorker \
  --trigger=http \
  --allow-unauthenticated \
  --timeout=540s \
  --memory=512MB \
  --set-env-vars GOOGLE_AI_API_KEY=your_key_here,GCS_BUCKET_NAME=raincrest-art-images
```

### 4. Dobij Function URL

```bash
gcloud functions describe generate-image-worker --gen2 --region=us-central1 --format="value(serviceConfig.uri)"
```

Kopiraj URL i dodaj u Netlify Environment Variables kao `GCP_FUNCTION_URL`.

---

## 📁 Struktura

```
gcp-function/
├── index.js              # Main function code
├── package.json          # Dependencies
├── .gcloudignore        # Files to ignore on deploy
└── README.md            # This file
```

---

## 🔧 Environment Variables

Postavi u Google Cloud Console → Cloud Functions → Environment variables:

```
GOOGLE_AI_API_KEY=your_google_ai_api_key
GCS_BUCKET_NAME=raincrest-art-images
GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images
BUNNY_STORAGE_ZONE=raincrest-art (optional, za fallback)
BUNNY_API_KEY=xxx (optional, za fallback)
BUNNY_CDN_DOMAIN=raincrest-cdn.b-cdn.net (optional, za fallback)
```

---

## 🧪 Lokalno testiranje

```bash
cd gcp-function
npm install
npm start
```

Funkcija će biti dostupna na `http://localhost:8080`

Test request:
```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-123",
    "prompt": "test prompt",
    "imageParts": [],
    "gcsUrl": "https://storage.googleapis.com/bucket/test.jpg",
    "gcsFilename": "test.jpg"
  }'
```

---

## 📊 Monitoring

### Provjeri logs:

```bash
gcloud functions logs read generate-image-worker --gen2 --region=us-central1 --limit=50
```

### Provjeri u Google Cloud Console:

1. Idi na "Cloud Functions"
2. Klikni na `generate-image-worker`
3. Idi na "Logs" tab

---

## 🔄 Update funkcije

```bash
cd gcp-function
# Napravi promjene u index.js
gcloud functions deploy generate-image-worker \
  --gen2 \
  --runtime=nodejs20 \
  --region=us-central1 \
  --source=.
```

---

## 🐛 Troubleshooting

### Problem: "Permission denied"

**Rješenje:**
- Provjeri da li service account ima `Storage Object Admin` role
- Provjeri da li je bucket javno dostupan

### Problem: "Bucket not found"

**Rješenje:**
- Provjeri da li je `GCS_BUCKET_NAME` točan
- Provjeri da li bucket postoji u Google Cloud Console

### Problem: "Function timeout"

**Rješenje:**
- Provjeri da li je timeout postavljen na 540s
- Provjeri Google Cloud Function logs

---

## 💰 Cijena

**Free Tier (dovoljan za 100 slika/mjesec):**
- Pozivi: 2 milijuna/mjesec ✅
- Compute: 400,000 GB-sec/mjesec ✅
- Storage: 5 GB ✅

**Total: $0/mjesec** 🎉

---

## 📚 Reference

- [Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Cloud Storage Docs](https://cloud.google.com/storage/docs)
- [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)

