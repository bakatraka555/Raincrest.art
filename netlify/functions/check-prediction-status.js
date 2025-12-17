/**
 * Netlify Function za provjeru statusa Replicate prediction-a
 * 
 * Prima:
 * - predictionId: ID prediction-a
 * 
 * Vraća:
 * - status: status prediction-a ('starting', 'processing', 'succeeded', 'failed')
 * - imageUrl: URL generirane slike (ako je succeeded)
 * - error: error message (ako je failed)
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('=== check-prediction-status function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  // Only allow GET or POST
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get predictionId from query string or body
    let predictionId;
    if (event.httpMethod === 'GET') {
      predictionId = event.queryStringParameters?.predictionId;
    } else {
      const body = JSON.parse(event.body || '{}');
      predictionId = body.predictionId;
    }

    if (!predictionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameter: predictionId' })
      };
    }

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' })
      };
    }

    // Provjeri status prediction-a
    console.log('Checking prediction status for ID:', predictionId);
    const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Bearer ${REPLICATE_API_TOKEN}`
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Status check failed:', statusResponse.status, errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Status check failed', 
          details: errorText,
          status: statusResponse.status
        })
      };
    }

    const result = await statusResponse.json();
    console.log('Prediction status:', result.status);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: result.status,
        imageUrl: result.output || null,
        error: result.error || null,
        predictionId: result.id
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

