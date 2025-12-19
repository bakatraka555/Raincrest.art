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
    const { jobId, prompt, imageParts, gcsUrl, gcsFilename, bunnyUrl, bunnyFilename, templateId, isCouple } = req.body;
    
    if (!jobId || !prompt || !imageParts) {
      res.status(400).json({ error: 'Missing required parameters' });
      return;
    }
    
    console.log(`[Job ${jobId}] Starting Google AI generation in Google Cloud Function...`);
    
    // Determine storage type (GCS or Bunny.net fallback)
    const useGCS = !!(gcsUrl || gcsFilename);
    const useBunny = !!(bunnyUrl || bunnyFilename);
    
    if (!useGCS && !useBunny) {
      res.status(400).json({ error: 'Missing storage URL (gcsUrl or bunnyUrl required)' });
      return;
    }
    
    // Initialize GCS bucket if using GCS
    if (useGCS) {
      const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
      if (!bucket) {
        bucket = storage.bucket(bucketName);
      }
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
              mime_type: part.inline_data?.mime_type || part.inlineData?.mime_type || 'image/jpeg',
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
    
    // 4. Upload na storage (GCS ili Bunny.net)
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    let finalImageUrl;
    
    if (useGCS) {
      // Upload na Google Cloud Storage
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
      const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
      const cdnUrl = process.env.GCS_CDN_URL 
        ? `${process.env.GCS_CDN_URL}/${filename}`
        : publicUrl;
      
      finalImageUrl = cdnUrl;
      console.log(`[Job ${jobId}] ✅ Success! Image available at: ${finalImageUrl}`);
      
    } else if (useBunny) {
      // Fallback: Upload na Bunny.net
      const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
      const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
      const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';
      
      if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
        throw new Error('Bunny.net not configured');
      }
      
      const filename = bunnyFilename || `temp/generated/${jobId}.jpg`;
      const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
      
      console.log(`[Job ${jobId}] Uploading to Bunny.net (${Math.round(imageBuffer.length / 1024)} KB)...`);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`[Job ${jobId}] Bunny upload failed:`, uploadResponse.status, errorText);
        throw new Error(`Bunny.net upload failed: ${uploadResponse.status}`);
      }
      
      finalImageUrl = `https://${BUNNY_CDN_DOMAIN}/${filename}`;
      console.log(`[Job ${jobId}] ✅ Success! Image available at: ${finalImageUrl}`);
    }
    
    res.status(200).json({
      success: true,
      jobId: jobId,
      imageUrl: finalImageUrl,
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

