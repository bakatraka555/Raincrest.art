/**
 * TEST: Google AI Studio verzija (direktan API)
 * Endpoint: /.netlify/functions/generate-image-google
 * 
 * Ovo je testna verzija koja koristi Google AI Studio API direktno.
 * Jeftinije i pouzdanije od Replicate, ali novi kod.
 * 
 * Environment varijable potrebne:
 * - GOOGLE_AI_API_KEY: API key iz https://aistudio.google.com/apikey
 * - BUNNY_API_KEY: Za upload slika (već postojeća)
 * - BUNNY_STORAGE_ZONE: Storage zona (već postojeća)
 * 
 * Cijena: ~$0.001 per slika (besplatno do 1500/dan)
 * vs Replicate: $0.039 per slika
 */

const fetch = require('node-fetch');
const crypto = require('crypto');
const { getPrompt, templateScenes } = require('./prompts');

exports.handler = async (event, context) => {
  console.log('=== generate-image-google (TEST - Google AI Studio) function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers');
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        receivedMethod: event.httpMethod,
        expectedMethod: 'POST'
      })
    };
  }

  try {
    console.log('Parsing request body...');
    const body = JSON.parse(event.body);
    console.log('Request body parsed. Keys:', Object.keys(body));
    
    const { templateId, image1Url, image2Url, image1, image2, isCouple } = body;

    // Provjeri da li imamo novi format (URL-ovi) ili stari format (base64)
    const hasNewFormat = image1Url && image1Url.startsWith('http');
    const hasOldFormat = image1 && (typeof image1 === 'string' && image1.length > 100);

    console.log('Format detected:', hasNewFormat ? 'NEW (URLs)' : hasOldFormat ? 'LEGACY (base64)' : 'UNKNOWN');

    // Google AI API Key
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'GOOGLE_AI_API_KEY not configured',
          hint: 'Add GOOGLE_AI_API_KEY in Netlify Dashboard → Site settings → Environment variables',
          getKeyAt: 'https://aistudio.google.com/apikey'
        })
      };
    }

    if (!templateId || (!hasNewFormat && !hasOldFormat)) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'Need templateId and either image1Url (URLs) or image1 (base64)'
        })
      };
    }

    // Provjeri template
    if (!templateScenes[templateId]) {
      console.log('Template not found:', templateId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Template not found',
          availableTemplates: Object.keys(templateScenes)
        })
      };
    }

    // Učitaj prompt
    const prompt = getPrompt(templateId, isCouple);
    console.log('Using prompt for:', templateId, 'isCouple:', isCouple);
    console.log('Prompt length:', prompt.length);

    // Helper funkcija za upload na Bunny.net (ako koristimo stari format)
    const uploadToBunny = async (imageBase64, filename) => {
      const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
      const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
      
      if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
        throw new Error('Bunny.net not configured - check BUNNY_API_KEY and BUNNY_STORAGE_ZONE');
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
      
      console.log('Uploading to Bunny.net:', uploadUrl.substring(0, 100) + '...');
      
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
        console.error('Bunny.net upload error:', uploadResponse.status, errorText);
        throw new Error(`Bunny.net upload failed (${uploadResponse.status}): ${errorText}`);
      }

      const cdnDomain = process.env.BUNNY_CDN_DOMAIN || 'examples.b-cdn.net';
      const publicUrl = `https://${cdnDomain}/${filename}`;
      console.log('Upload successful, Public URL:', publicUrl);
      return publicUrl;
    };

    // 1. Dobij URL-ove slika
    let finalImage1Url, finalImage2Url;
    
    if (hasNewFormat) {
      // NOVI FORMAT: URL-ovi već postoje
      console.log('Using new format - URLs already provided');
      finalImage1Url = image1Url;
      finalImage2Url = image2Url || null;
      
      // Pričekaj 2 sekunde za CDN propagaciju
      console.log('Waiting 2 seconds for CDN propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // STARI FORMAT: Upload base64 na Bunny.net
      console.log('Using legacy format - uploading base64 images to Bunny.net');
      try {
        const image1Base64 = image1.includes(',') ? image1.split(',')[1] : image1;
        const timestamp = Date.now();
        const userId = `user-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        
        const image1Filename = `temp/${userId}-image1.jpg`;
        finalImage1Url = await uploadToBunny(image1Base64, image1Filename);
        console.log('Image1 uploaded:', finalImage1Url);

        if (!isCouple && image2) {
          const image2Base64 = image2.includes(',') ? image2.split(',')[1] : image2;
          const image2Filename = `temp/${userId}-image2.jpg`;
          finalImage2Url = await uploadToBunny(image2Base64, image2Filename);
          console.log('Image2 uploaded:', finalImage2Url);
        } else {
          finalImage2Url = null;
        }
      } catch (uploadError) {
        console.error('Error uploading to Bunny.net:', uploadError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to upload images to Bunny.net',
            details: uploadError.message
          })
        };
      }
    }

    // 2. Pripremi slike za Google AI (trebaju biti base64)
    const imageUrls = [finalImage1Url];
    if (!isCouple && finalImage2Url) {
      imageUrls.push(finalImage2Url);
    }
    
    // Dodaj logo
    const logoUrl = 'https://examples.b-cdn.net/logo.jpg';
    imageUrls.push(logoUrl);

    console.log('Fetching images to convert to base64 for Google AI...');
    console.log('Images to fetch:', imageUrls.length);
    
    // Google AI zahtijeva base64 format inline_data
    const imageParts = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      try {
        console.log(`Fetching image ${i + 1}/${imageUrls.length}:`, imageUrl.substring(0, 60) + '...');
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          console.error('Failed to fetch image:', imageUrl, 'Status:', imageResponse.status);
          throw new Error(`Failed to fetch image (${imageResponse.status}): ${imageUrl}`);
        }
        
        const imageBuffer = await imageResponse.buffer();
        const base64Image = imageBuffer.toString('base64');
        
        imageParts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        });
        
        console.log(`✅ Image ${i + 1} converted:`, Math.round(base64Image.length / 1024), 'KB (base64)');
      } catch (err) {
        console.error('Error fetching/converting image:', imageUrl, err);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch and convert image',
            imageUrl: imageUrl,
            details: err.message
          })
        };
      }
    }

    console.log('All images converted to base64, total:', imageParts.length);

    // 3. Kreiraj job ID i Google Cloud Storage URL
    const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
    const GCS_CDN_URL = process.env.GCS_CDN_URL || `https://storage.googleapis.com/${GCS_BUCKET_NAME}`;
    
    const jobId = `google-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    const imageFilename = `temp/generated/${jobId}.jpg`;
    const imageUrl = `${GCS_CDN_URL}/${imageFilename}`;
    
    console.log('=== ASYNC JOB PATTERN: Creating job with Google Cloud Storage ===');
    console.log('Job ID:', jobId);
    console.log('GCS URL:', imageUrl);
    console.log('GCS filename:', imageFilename);
    console.log('GCS Bucket:', GCS_BUCKET_NAME);

    // 4. Spremi job info (opcionalno - za debugging)
    const jobInfo = {
      jobId,
      templateId,
      isCouple,
      prompt,
      imageParts: imageParts.map(part => ({
        mime_type: part.inline_data?.mime_type || 'image/jpeg',
      })),
      imageUrl: imageUrl,
      imageFilename: imageFilename,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // 5. Pokreni Google Cloud Function worker (ne čekaj!)
    // Koristi environment variable ili fallback na tvoj deploy-ani URL
    const GCP_FUNCTION_URL = process.env.GCP_FUNCTION_URL || 'https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker';
    
    if (!GCP_FUNCTION_URL || !GCP_FUNCTION_URL.startsWith('http')) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'GCP_FUNCTION_URL not configured',
          details: 'Please set GCP_FUNCTION_URL in Netlify Environment Variables',
          expectedFormat: 'https://us-central1-raincrest-art.cloudfunctions.net/generate-image-worker'
        })
      };
    }
    
    console.log('🚀 Starting Google Cloud Function worker:', GCP_FUNCTION_URL);
    console.log('📦 Sending job:', {
      jobId,
      promptLength: prompt.length,
      imagePartsCount: imageParts.length,
      gcsUrl: imageUrl,
      gcsFilename: imageFilename
    });
    
    // Pokreni worker u pozadini (fire-and-forget, ne čekaj response!)
    fetch(GCP_FUNCTION_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobId,
        prompt,
        imageParts, // Pošalji imageParts direktno (base64 data)
        gcsUrl: imageUrl,
        gcsFilename: imageFilename,
        templateId,
        isCouple
      })
    }).then(response => {
      if (!response.ok) {
        console.error('⚠️ Worker start returned non-OK status:', response.status);
      } else {
        console.log('✅ Worker started successfully (non-blocking)');
      }
    }).catch(err => {
      // Ignoriraj greške - worker će se možda pokrenuti kasnije
      // Ovo je fire-and-forget pattern, frontend će poll-ovati image URL
      console.error('⚠️ Worker start error (non-critical, will poll for result):', err.message);
    });

    // 6. Vrati job ID ODMAH (kao Replicate!)
    console.log('✅ Returning job ID immediately (like Replicate pattern)');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: jobId,
        imageUrl: imageUrl, // Frontend će poll-ovati ovaj URL (GCS ili Bunny)
        status: 'processing',
        provider: 'Google AI Studio + Google Cloud Storage (async - Nano Banana Pro)',
        templateId: templateId,
        isCouple: isCouple,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('=== ERROR in generate-image-google ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString()
      })
    };
  }
};

