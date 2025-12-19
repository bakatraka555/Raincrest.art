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

    // Extract jobId from imageUrl if not provided
    let jobId = event.queryStringParameters?.jobId || JSON.parse(event.body || '{}').jobId;
    if (!jobId && imageUrl) {
      const match = imageUrl.match(/google-([a-f0-9-]+)\.jpg/);
      if (match) {
        jobId = match[1].split('-').slice(0, -1).join('-'); // Remove last part (random hex)
        const fullMatch = imageUrl.match(/(google-[a-f0-9-]+)\.jpg/);
        if (fullMatch) {
          jobId = fullMatch[1];
        }
      }
    }

    // Try to check job info file first (more reliable)
    let exists = false;
    let httpStatus = 0;
    
    if (jobId) {
      const bucketName = process.env.GCS_BUCKET_NAME || 'raincrest-art-images';
      const jobInfoUrl = `https://storage.googleapis.com/${bucketName}/jobs/${jobId}.json`;
      
      try {
        const jobInfoResponse = await fetch(jobInfoUrl, {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (jobInfoResponse.ok) {
          const jobInfo = await jobInfoResponse.json();
          if (jobInfo.status === 'completed' || jobInfo.status === 'ready') {
            exists = true;
            httpStatus = 200;
            console.log('Job info indicates image is ready:', jobInfo.status);
          }
        }
      } catch (jobError) {
        console.log('Job info check failed (non-critical):', jobError.message);
      }
    }

    // If job info doesn't exist or status is not ready, try direct image check
    if (!exists) {
      try {
        // Use GET request with Range header (more reliable than HEAD for GCS)
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0', // Request only first byte (efficient!)
            'Cache-Control': 'no-cache'
          }
        });

        httpStatus = response.status;
        exists = response.ok || response.status === 200 || response.status === 206; // 206 = Partial Content

        console.log('GCS image check result:', {
          exists: exists,
          status: response.status,
          imageUrl: imageUrl.substring(0, 80) + '...'
        });
      } catch (fetchError) {
        console.error('Error checking image:', fetchError.message);
        exists = false;
        httpStatus = 0;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        exists: exists,
        imageUrl: imageUrl,
        status: exists ? 'ready' : 'not-ready',
        httpStatus: httpStatus
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

