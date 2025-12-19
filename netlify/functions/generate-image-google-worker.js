/**
 * Worker funkcija za Google AI generaciju u pozadini
 * Endpoint: /.netlify/functions/generate-image-google-worker
 * 
 * Ova funkcija se poziva iz generate-image-google.js i radi u pozadini.
 * Može trajati 30-90 sekundi bez timeout problema.
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('=== generate-image-google-worker function called ===');
  console.log('HTTP Method:', event.httpMethod);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { jobId, prompt, imageParts, bunnyUrl, bunnyFilename, templateId, isCouple } = body;

    if (!jobId || !prompt || !imageParts || !bunnyUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    console.log(`[Job ${jobId}] Starting Google AI generation in background...`);

    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
    const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
    if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY) {
      throw new Error('Bunny.net not configured');
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

    // 4. Upload na Bunny.net
    const imageBuffer = Buffer.from(generatedImageBase64, 'base64');
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${bunnyFilename}`;
    
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

    console.log(`[Job ${jobId}] ✅ Success! Image available at: ${bunnyUrl}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: jobId,
        imageUrl: bunnyUrl,
        status: 'completed'
      })
    };

  } catch (error) {
    console.error('=== ERROR in generate-image-google-worker ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Worker error',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

