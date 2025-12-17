/**
 * Netlify Function za upload korisničkih slika na Bunny.net
 * 
 * Prima FormData (multipart/form-data) umjesto base64 za manji overhead:
 * - image: File blob (binary data)
 * - filename: Ime fajla za upload
 * 
 * Vraća:
 * - url: CDN URL uploadane slike
 * - success: boolean
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('=== upload-user-image function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Has body:', !!event.body);
  console.log('Body length:', event.body ? event.body.length : 0);
  console.log('Content-Type:', event.headers['content-type'] || event.headers['Content-Type']);
  
  // CORS headers - poboljšano za Android
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Max-Age': '86400',
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
    // Parse JSON body (base64 format)
    console.log('Parsing JSON body...');
    const body = JSON.parse(event.body);
    const { imageBase64, filename } = body;
    
    if (!imageBase64 || !filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'Both imageBase64 and filename are required'
        })
      };
    }
    
    // Extract base64 data (remove data:image/jpeg;base64, prefix if present)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;
    
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('Request parsed:', {
      imageBufferSize: imageBuffer.length,
      filename: filename
    });

    const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
    const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
    const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'examples.b-cdn.net';

    if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
      console.error('Bunny.net configuration missing:', {
        hasApiKey: !!BUNNY_API_KEY,
        hasStorageZone: !!BUNNY_STORAGE_ZONE
      });
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Bunny.net API not configured',
          details: 'Check BUNNY_API_KEY and BUNNY_STORAGE_ZONE environment variables'
        })
      };
    }

    // Upload path - koristi temp folder
    const uploadPath = `temp/${filename}`;
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${uploadPath}`;
    
    console.log('Uploading to Bunny.net:', uploadUrl.substring(0, 80) + '...');
    console.log('File size:', imageBuffer.length, 'bytes');
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'image/jpeg'
      },
      body: imageBuffer
    });

    const responseText = await uploadResponse.text();

    if (!uploadResponse.ok) {
      console.error('Bunny.net upload error:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: responseText
      });
      
      if (uploadResponse.status === 401) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Bunny.net authentication failed',
            details: 'Check BUNNY_API_KEY in Netlify environment variables'
          })
        };
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Upload failed',
          details: responseText || uploadResponse.statusText,
          status: uploadResponse.status
        })
      };
    }

    // CDN URL
    const publicUrl = `https://${BUNNY_CDN_DOMAIN}/${uploadPath}`;
    console.log('Upload successful! Public URL:', publicUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        url: publicUrl,
        filename: filename,
        size: imageBuffer.length
      })
    };

  } catch (error) {
    console.error('Error in upload-user-image:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      })
    };
  }
};

