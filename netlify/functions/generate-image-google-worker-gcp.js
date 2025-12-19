/**
 * Google Cloud Function worker za Google AI generaciju
 * 
 * Ova funkcija se pokreće na Google Cloud Functions (umjesto Netlify)
 * Timeout: 540 sekundi (9 minuta) - dovoljno za bilo koju generaciju!
 * 
 * Deployment:
 * gcloud functions deploy generate-image-worker \
 *   --gen2 \
 *   --runtime=nodejs20 \
 *   --region=us-central1 \
 *   --source=. \
 *   --entry-point=generateImageWorker \
 *   --trigger=http \
 *   --allow-unauthenticated \
 *   --timeout=540s \
 *   --memory=512MB \
 *   --set-env-vars GOOGLE_AI_API_KEY=xxx,GCS_BUCKET_NAME=raincrest-art-images
 */

const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');
const fetch = require('node-fetch');

// Initialize Google Cloud Storage
const storage = new Storage();
let bucket = null;

functions.http('generateImageWorker', async (req, res) => {
  console.log('=== Google Cloud Function: generate-image-worker ===');
  console.log('HTTP Method:', req.method);
  
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { jobId, prompt, imageParts, gcsUrl, gcsFilename, templateId, isCouple } = req.body;
    
    if (!jobId || !prompt || !imageParts || !gcsUrl) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    console.log(`[Job ${jobId}] Starting Google AI generation in Google Cloud Function...`);
    
    // Initialize bucket if not already done
    const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
    if (!bucket) {
      bucket = storage.bucket(bucketName);
    }
    
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    
    // 1. Google AI API poziv
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;
    
    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          ...imageParts.map(part => ({
            inline_data: {
              mime_type: part.inline_data?.mime_type || 'image/jpeg',
              data: part.inline_data?.data || part.inlineData?.data
            }
          }))
        ]
      }],
      generationConfig: {
        response_modalities: ["IMAGE"],
        temperature: 0.9,
        image_config: {
          aspect_ratio: "1:1"
        }
      }
    };
    
    console.log(`[Job ${jobId}] Calling Google AI API...`);
    console.log(`[Job ${jobId}] Prompt length:`, prompt.length);
    console.log(`[Job ${jobId}] Images count:`, imageParts.length);
    
    const googleResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    
    const responseText = await googleResponse.text();
    
    if (!googleResponse.ok) {
      console.error(`[Job ${jobId}] Google AI error:`, responseText.substring(0, 500));
      throw new Error(`Google AI API error: ${googleResponse.status} - ${responseText.substring(0, 200)}`);
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[Job ${jobId}] Failed to parse response:`, parseError);
      throw new Error('Failed to parse Google AI response');
    }
    
    const candidate = result.candidates?.[0];
    if (!candidate) {
      console.error(`[Job ${jobId}] No candidates in response`);
      throw new Error('No candidates in Google AI response');
    }
    
    // 2. Extract image
    let imagePart = candidate.content?.parts?.find(part => part.inlineData || part.inline_data);
    let generatedImageBase64 = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
    
    if (!generatedImageBase64) {
      console.error(`[Job ${jobId}] No image data found`);
      throw new Error('No image data in Google AI response');
    }
    
    // 3. Konvertuj ako treba
    if (Buffer.isBuffer(generatedImageBase64)) {
      generatedImageBase64 = generatedImageBase64.toString('base64');
    } else if (generatedImageBase64 instanceof Uint8Array || generatedImageBase64 instanceof ArrayBuffer) {
      generatedImageBase64 = Buffer.from(generatedImageBase64).toString('base64');
    } else if (typeof generatedImageBase64 === 'string') {
      if (!generatedImageBase64.startsWith('/9j/') && !generatedImageBase64.startsWith('iVBORw0KG')) {
        console.log(`[Job ${jobId}] Image data is string, assuming base64`);
      }
    }
    
    // 4. Upload na Google Cloud Storage
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    const filename = gcsFilename || `temp/generated/${jobId}.jpg`;
    
    console.log(`[Job ${jobId}] Uploading to Google Cloud Storage (${Math.round(imageBuffer.length / 1024)} KB)...`);
    
    const file = bucket.file(filename);
    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    // Or use Cloud CDN URL if configured
    const cdnUrl = process.env.GCS_CDN_URL 
      ? `${process.env.GCS_CDN_URL}/${filename}`
      : publicUrl;
    
    console.log(`[Job ${jobId}] ✅ Success! Image available at: ${cdnUrl}`);
    
    res.status(200).json({
      success: true,
      jobId: jobId,
      imageUrl: cdnUrl,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('=== ERROR in Google Cloud Function worker ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      error: 'Worker error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

