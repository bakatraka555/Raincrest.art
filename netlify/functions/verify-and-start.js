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
 * 1. Pokreće Replicate API s modelom: black-forest-labs/flux-schnell
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

    console.log('Request body:', {
      hasImageUrl: !!imageUrl,
      hasPrompt: !!prompt,
      templateId,
      isCouple,
      hasImage2Url: !!image2Url
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

    // Get prompt (ako nije poslan, generiraj ga)
    const finalPrompt = prompt || getPrompt(templateId, isCouple);
    console.log('Using prompt (length):', finalPrompt.length);

    // Replicate API token
    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' })
      };
    }

    // Model: black-forest-labs/flux-schnell (najbrži)
    const REPLICATE_MODEL = 'black-forest-labs/flux-schnell';
    console.log('Using Replicate model:', REPLICATE_MODEL);

    // Pripremi image_input array
    const imageInput = [imageUrl];
    if (!isCouple && image2Url) {
      imageInput.push(image2Url);
    }
    // Logo URL (ako je potreban)
    const logoUrl = process.env.BUNNY_CDN_DOMAIN 
      ? `https://${process.env.BUNNY_CDN_DOMAIN}/logo.jpg`
      : 'https://examples.b-cdn.net/logo.jpg';
    imageInput.push(logoUrl);

    console.log('Image input array:', imageInput);

    // Replicate API input
    const inputData = {
      prompt: finalPrompt,
      image_input: imageInput
    };

    console.log('🚀 Starting Replicate generation (async)...');
    console.log('📦 Request size:', JSON.stringify(inputData).length, 'bytes');

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

