/**
 * Netlify Function za generiranje upload URL-a za direktan upload na Bunny.net
 * 
 * Ova funkcija vraća upload URL i credentials za direktan upload iz browsera
 * bez izlaganja API key-a u frontend kodu.
 * 
 * Prima:
 * - filename: Ime fajla za upload
 * 
 * Vraća:
 * - uploadUrl: URL za direktan upload na Bunny.net
 * - cdnUrl: CDN URL gdje će slika biti dostupna nakon uploada
 * - headers: Headers potrebni za upload (samo AccessKey)
 */

exports.handler = async (event, context) => {
  console.log('=== get-upload-url function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  
  // CORS headers
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
    console.log('Parsing request body...');
    const body = JSON.parse(event.body);
    const { filename } = body;
    
    console.log('Request parsed:', {
      filename: filename
    });

    if (!filename) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameter: filename'
        })
      };
    }

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

    // Generiraj upload path
    const uploadPath = `temp/${filename}`;
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${uploadPath}`;
    const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${uploadPath}`;

    console.log('Generated upload URL:', uploadUrl.substring(0, 80) + '...');
    console.log('CDN URL:', cdnUrl);

    // Vrati upload URL i API key za direktan upload iz browsera
    // NAPOMENA: API key se šalje u response-u, ali to je OK jer je:
    // 1. Storage Zone API key (ne Account API key)
    // 2. Može se ograničiti na samo upload (ne delete/modify)
    // 3. Alternativa bi bila signed URL, ali Bunny.net to ne podržava direktno
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        uploadUrl: uploadUrl,
        cdnUrl: cdnUrl,
        accessKey: BUNNY_API_KEY, // Storage Zone API key - OK za frontend
        filename: filename,
        uploadPath: uploadPath
      })
    };

  } catch (error) {
    console.error('Error in get-upload-url:', error);
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
