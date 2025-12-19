/**
 * Netlify Function: check-gcs-image
 * 
 * Provjerava da li slika postoji na Google Cloud Storage-u.
 * Koristi se kao proxy da izbjegne CORS probleme.
 * 
 * Input:
 * - imageUrl: GCS URL slike
 * - ili jobId: job ID (konstruira se URL)
 * 
 * Return:
 * - exists: true/false
 * - imageUrl: GCS URL
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('=== check-gcs-image function called ===');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Get imageUrl from query or body
    let imageUrl;
    if (event.httpMethod === 'GET') {
      imageUrl = event.queryStringParameters?.imageUrl || event.queryStringParameters?.url;
      const jobId = event.queryStringParameters?.jobId;
      
      if (jobId && !imageUrl) {
        // Construct URL from jobId
        const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
        const cdnUrl = process.env.GCS_CDN_URL || `https://storage.googleapis.com/${bucketName}`;
        imageUrl = `${cdnUrl}/temp/generated/${jobId}.jpg`;
      }
    } else {
      const body = JSON.parse(event.body || '{}');
      imageUrl = body.imageUrl || body.url;
      const jobId = body.jobId;
      
      if (jobId && !imageUrl) {
        const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
        const cdnUrl = process.env.GCS_CDN_URL || `https://storage.googleapis.com/${bucketName}`;
        imageUrl = `${cdnUrl}/temp/generated/${jobId}.jpg`;
      }
    }

    if (!imageUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing imageUrl or jobId' })
      };
    }

    console.log('Checking GCS image:', imageUrl);

    // Check if image exists using HEAD request
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    const exists = response.ok || response.status === 200;

    console.log('GCS image check result:', {
      exists: exists,
      status: response.status,
      imageUrl: imageUrl.substring(0, 80) + '...'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        exists: exists,
        imageUrl: imageUrl,
        status: exists ? 'ready' : 'not-ready',
        httpStatus: response.status
      })
    };

  } catch (error) {
    console.error('Error checking GCS image:', error);
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

