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
    // NEW FORMAT: Accept { prompt, image: URL }
    const { prompt, image } = req.body;
    
    // Legacy format support (for backward compatibility)
    const { jobId: legacyJobId, imageParts: legacyImageParts, gcsUrl, gcsFilename, bunnyUrl, bunnyFilename } = req.body;
    
    if (!prompt) {
      res.status(400).json({ success: false, error: 'Missing required parameter: prompt' });
      return;
    }
    
    // Generate job ID if not provided
    const jobId = legacyJobId || `google-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    console.log(`[Job ${jobId}] Starting Google AI generation in Google Cloud Function...`);
    console.log(`[Job ${jobId}] Prompt length:`, prompt.length);
    console.log(`[Job ${jobId}] Image URL:`, image || 'Not provided (legacy format)');
    
    // Initialize GCS bucket
    const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
    if (!bucket) {
      bucket = storage.bucket(bucketName);
    }
    
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }
    
    // 1. Prepare imageParts array
    let imageParts = [];
    
    if (image) {
      // NEW FORMAT: Download image from URL and convert to base64
      console.log(`[Job ${jobId}] Downloading image from URL: ${image}`);
      
      try {
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        const imageBuffer = await imageResponse.buffer();
        const base64Image = imageBuffer.toString('base64');
        
        imageParts.push({
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Image
          }
        });
        
        console.log(`[Job ${jobId}] ✅ Image downloaded and converted (${Math.round(base64Image.length / 1024)} KB base64)`);
      } catch (downloadError) {
        console.error(`[Job ${jobId}] Error downloading image:`, downloadError);
        res.status(400).json({
          success: false,
          error: `Failed to download image: ${downloadError.message}`
        });
        return;
      }
      
      // Add logo URL (always add logo)
      const logoUrl = 'https://examples.b-cdn.net/logo.jpg';
      console.log(`[Job ${jobId}] Downloading logo from: ${logoUrl}`);
      
      try {
        const logoResponse = await fetch(logoUrl);
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.buffer();
          const base64Logo = logoBuffer.toString('base64');
          
          imageParts.push({
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Logo
            }
          });
          
          console.log(`[Job ${jobId}] ✅ Logo downloaded and converted (${Math.round(base64Logo.length / 1024)} KB base64)`);
        }
      } catch (logoError) {
        console.warn(`[Job ${jobId}] Logo download failed (non-critical):`, logoError.message);
      }
      
    } else if (legacyImageParts && Array.isArray(legacyImageParts) && legacyImageParts.length > 0) {
      // LEGACY FORMAT: Use provided imageParts
      imageParts = legacyImageParts;
      console.log(`[Job ${jobId}] Using legacy imageParts format (${imageParts.length} images)`);
    } else {
      res.status(400).json({
        success: false,
        error: 'Missing required parameter: image (URL) or imageParts (legacy)'
      });
      return;
    }
    
    // 2. Google AI API poziv
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
    
    // 4. Upload na storage (GCS - default, Bunny.net fallback)
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    let finalImageUrl;
    
    // Determine storage type (prefer GCS, fallback to Bunny.net)
    const useGCS = !!(gcsUrl || gcsFilename || !bunnyUrl);
    const useBunny = !!bunnyUrl && !useGCS;
    
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
    
    // Check if error is from Google AI API (safety blocking, etc.)
    if (error.message && error.message.includes('mask image bytes')) {
      res.status(400).json({
        success: false,
        error: 'Google AI je odbio zahtjev: Image editing failed with the following error: Failed to get mask image bytes: No uri or raw bytes are provided in media content.'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Worker error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

