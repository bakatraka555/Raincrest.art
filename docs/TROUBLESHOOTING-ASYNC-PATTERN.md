# 🔧 Troubleshooting: Async Pattern - Zapelo na koraku 3

## 🐛 Problem

Frontend poll-uje GCS URL, ali slika se ne pojavljuje (zapelo na "Processing your photos...").

---

## 🔍 Debugging Koraci

### 1. Provjeri Netlify Function Logs

**Netlify Dashboard → Functions → generate-image-google → Logs**

Traži:
```
🚀 Starting Google Cloud Function worker: https://...
📤 Sending request to Google Cloud Function worker...
📥 Worker response status: 200
✅ Worker started successfully (non-blocking)
```

**Ako vidiš grešku:**
- `⚠️ Worker start error` → Google Cloud Function se ne može pozvati
- `⚠️ Worker start returned non-OK status: 500` → Google Cloud Function ima grešku

---

### 2. Provjeri Google Cloud Function Logs

**Google Cloud Console → Cloud Functions → generate-image-worker → Logs**

Traži:
```
=== Google Cloud Function: generate-image-worker ===
[Job google-...] Starting Google AI generation...
[Job google-...] Calling Google AI API...
[Job google-...] ✅ Success! Image available at: https://...
```

**Ako vidiš grešku:**
- `GOOGLE_AI_API_KEY not configured` → Postavi environment variable
- `Google AI API error: 429` → Rate limit exceeded
- `Google AI API error: 500` → Google AI greška
- `GCS bucket permission denied` → Bucket nije javno dostupan

---

### 3. Provjeri GCS Bucket Permissions

**Google Cloud Console → Cloud Storage → raincrest-art-images → Permissions**

**Provjeri:**
- ✅ Bucket ima `allUsers` s `Storage Object Viewer` role
- ✅ Files imaju public access

**Ako nije javno dostupan:**
```bash
# Postavi bucket javno dostupan
gsutil iam ch allUsers:objectViewer gs://raincrest-art-images

# Ili za specifičan file
gsutil acl ch -u AllUsers:R gs://raincrest-art-images/temp/generated/google-123.jpg
```

---

### 4. Provjeri Environment Variables

**Netlify Dashboard → Site settings → Environment variables**

**Potrebno:**
```
GCP_FUNCTION_URL=https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker
GCS_BUCKET_NAME=raincrest-art-images
GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images
GOOGLE_AI_API_KEY=AIzaSy...
```

**Google Cloud Console → Cloud Functions → generate-image-worker → Environment variables**

**Potrebno:**
```
GOOGLE_AI_API_KEY=AIzaSy...
GCS_BUCKET_NAME=raincrest-art-images
GCS_CDN_URL=https://storage.googleapis.com/raincrest-art-images
```

---

### 5. Test Google Cloud Function Direktno

```bash
curl -X POST https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-123",
    "prompt": "test prompt",
    "imageParts": [{
      "inline_data": {
        "mime_type": "image/jpeg",
        "data": "/9j/4AAQSkZJRg..."
      }
    }],
    "gcsUrl": "https://storage.googleapis.com/raincrest-art-images/temp/generated/test-123.jpg",
    "gcsFilename": "temp/generated/test-123.jpg"
  }'
```

**Ako dobiješ grešku:**
- `401 Unauthorized` → Function nije `allow-unauthenticated`
- `404 Not Found` → Function URL nije ispravan
- `500 Internal Server Error` → Provjeri logs

---

### 6. Provjeri Frontend Console

**Browser Console (F12)**

Traži:
```
✅ Google AI job created - starting async polling pattern...
📋 Job details: { jobId: "...", imageUrl: "..." }
🔄 Starting polling loop: max 200 attempts...
[1/200] [2s] Polling GCS URL...
[10/200] [20s] Polling GCS URL... Status: 404...
```

**Ako vidiš:**
- `Status: 404` → Slika se još generira (normalno)
- `Status: 403` → GCS bucket nije javno dostupan (KRITIČNO!)
- `Status: 500` → GCS greška

---

## ✅ Rješenja

### Problem 1: Google Cloud Function se ne poziva

**Rješenje:**
1. Provjeri da li je `GCP_FUNCTION_URL` postavljen u Netlify
2. Provjeri da li je URL ispravan
3. **Redeploy Netlify site** (environment variables zahtijevaju redeploy)

---

### Problem 2: Google Cloud Function ima grešku

**Rješenje:**
1. Provjeri Google Cloud Function logs
2. Provjeri environment variables u Google Cloud Console
3. Provjeri da li je `GOOGLE_AI_API_KEY` validan

---

### Problem 3: GCS Bucket nije javno dostupan (403 error)

**Rješenje:**
```bash
# Postavi bucket javno dostupan
gsutil iam ch allUsers:objectViewer gs://raincrest-art-images

# Provjeri
gsutil iam get gs://raincrest-art-images
```

**Ili u Google Cloud Console:**
1. Cloud Storage → raincrest-art-images → Permissions
2. Grant Access → Principal: `allUsers` → Role: `Storage Object Viewer`
3. Save

---

### Problem 4: Google AI API greška

**Rješenje:**
1. Provjeri da li je `GOOGLE_AI_API_KEY` validan
2. Provjeri rate limits u Google AI Studio
3. Provjeri billing status

---

## 📊 Checklist

- [ ] Netlify Function log-uje da pokreće worker
- [ ] Google Cloud Function prima request
- [ ] Google Cloud Function log-uje Google AI API poziv
- [ ] Google AI API vraća sliku
- [ ] Google Cloud Function upload-uje na GCS
- [ ] GCS bucket je javno dostupan
- [ ] Frontend poll detektira da slika postoji (200 OK)

---

## 🚨 Najčešći Problemi

1. **GCS bucket nije javno dostupan** (403 error) → 90% problema
2. **Google Cloud Function environment variables nisu postavljeni** → 5% problema
3. **Google AI API rate limit** → 3% problema
4. **Netlify environment variables nisu postavljeni** → 2% problema

---

**Status:** Troubleshooting guide  
**Datum:** 2024-12-19

