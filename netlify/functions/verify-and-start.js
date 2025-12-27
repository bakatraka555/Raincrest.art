/**
 * Netlify Function: verify-and-start
 * 
 * Pokreće Replicate generaciju nakon "verifikacije" (za sada bez Stripe-a).
 * 
 * Input:
 * - imageUrl: URL slike na Bunny CDN
 * - prompt: generirani prompt
 * - templateId: ID templatea
 * - isCouple: boolean
 * 
 * Action:
 * 1. Pokreće Replicate API s modelom: google/nano-banana
 * 2. NE čeka rezultat - vraća prediction_id odmah
 * 
 * Return:
 * - success: true
 * - predictionId: Replicate prediction ID
 * - status: 'starting'
 */

const fetch = require('node-fetch');
const { getPrompt, templateScenes } = require('./prompts');

exports.handler = async (event, context) => {
  console.log('=== verify-and-start function called ===');
  console.log('HTTP Method:', event.httpMethod);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { imageUrl, prompt, templateId, isCouple, image2Url } = body;

    console.log('=== verify-and-start Request ===');
    console.log('Request body:', {
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl ? imageUrl.substring(0, 80) + '...' : null,
      hasPrompt: !!prompt,
      promptLength: prompt ? prompt.length : 0,
      templateId,
      isCouple: isCouple,
      isCoupleType: typeof isCouple,
      hasImage2Url: !!image2Url,
      image2Url: image2Url ? image2Url.substring(0, 80) + '...' : null
    });

    // Validation
    if (!imageUrl || !templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing required parameters',
          required: ['imageUrl', 'templateId']
        })
      };
    }

    // Validate URLs
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid imageUrl',
          details: 'imageUrl must be a valid HTTP(S) URL'
        })
      };
    }

    if (image2Url && !image2Url.startsWith('http://') && !image2Url.startsWith('https://')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid image2Url',
          details: 'image2Url must be a valid HTTP(S) URL'
        })
      };
    }

    // Provjeri da li template postoji
    if (!templateScenes[templateId]) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Template not found',
          availableTemplates: Object.keys(templateScenes)
        })
      };
    }

    // Normalize isCouple to boolean
    const isCoupleBool = !!isCouple;
    console.log('Normalized isCouple:', isCoupleBool);

    // Get prompt (ISTA LOGIKA KAO U generate-image.js)
    // U generate-image.js se prompt generira s: getPrompt(templateId, isCouple)
    const finalPrompt = prompt || getPrompt(templateId, isCoupleBool);
    console.log('Using prompt (length):', finalPrompt.length);
    console.log('Prompt preview (first 200 chars):', finalPrompt.substring(0, 200) + '...');
    console.log('Prompt preview (last 200 chars):', '...' + finalPrompt.substring(finalPrompt.length - 200));

    if (!finalPrompt || finalPrompt.length < 10) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to generate prompt',
          details: 'Prompt is empty or too short',
          promptLength: finalPrompt ? finalPrompt.length : 0
        })
      };
    }

    // Replicate API token
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' })
      };
    }

    // Model: google/nano-banana-pro (PRO verzija za bolju kvalitetu)
    const REPLICATE_MODEL = 'google/nano-banana-pro';
    console.log('Using Replicate model:', REPLICATE_MODEL);

    // Pripremi image_input array (ISTA LOGIKA KAO U generate-image.js)
    const imageInput = [imageUrl];
    if (!isCoupleBool && image2Url) {
      imageInput.push(image2Url);
    }
    // Logo URL (ISTI KAO U generate-image.js)
    const logoUrl = 'https://examples.b-cdn.net/logo.jpg';
    imageInput.push(logoUrl); // Logo je uvijek zadnji

    console.log('=== Image Input Array ===');
    console.log('Image count:', imageInput.length);
    console.log('Image URLs:', imageInput.map(url => url.substring(0, 80) + '...'));
    console.log('isCouple:', isCoupleBool);
    console.log('Has image2:', !isCoupleBool && !!image2Url);

    // Replicate API input (ISTI FORMAT KAO U generate-image.js)
    const inputData = {
      prompt: finalPrompt,
      image_input: imageInput
    };

    console.log('=== Full Input Data ===');
    console.log('Prompt length:', inputData.prompt.length);
    console.log('Image input count:', inputData.image_input.length);
    console.log('Full inputData:', JSON.stringify(inputData, null, 2));

    console.log('🚀 Starting Replicate generation (async)...');
    console.log('📦 Request size:', JSON.stringify({ input: inputData }).length, 'bytes');

    // Pokreni Replicate prediction (NE čekaj rezultat!)
    const replicateResponse = await fetch(
      `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input: inputData })
      }
    );

    if (!replicateResponse.ok) {
      const errorText = await replicateResponse.text();
      console.error('Replicate API error:', replicateResponse.status, errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Failed to start Replicate generation',
          details: errorText,
          status: replicateResponse.status
        })
      };
    }

    const replicateResult = await replicateResponse.json();
    console.log('✅ Replicate prediction started:', replicateResult.id);
    console.log('📋 Status:', replicateResult.status);

    // Vrati prediction_id ODMAH (ne čekaj rezultat!)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        predictionId: replicateResult.id,
        status: replicateResult.status || 'starting',
        createdAt: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in verify-and-start:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};

