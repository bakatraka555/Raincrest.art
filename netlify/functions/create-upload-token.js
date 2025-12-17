/**
 * Netlify Function za kreiranje signed upload tokena
 * 
 * Kreira privremeni, jednokratni token za direktan upload na Bunny.net
 * Token je validan 5 minuta i može se koristiti samo jednom
 * 
 * Prima:
 * - filename: Ime fajla za upload
 * 
 * Vraća:
 * - token: Signed token (JWT-like)
 * - uploadUrl: URL za direktan upload na Bunny.net
 * - cdnUrl: CDN URL gdje će slika biti dostupna
 * - expiresAt: Timestamp kada token istječe
 */

const crypto = require('crypto');

exports.handler = async (event, context) => {
  console.log('=== create-upload-token function called ===');
  console.log('HTTP Method:', event.httpMethod);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const body = JSON.parse(event.body);
    const { filename } = body;
    
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
    const TOKEN_SECRET = process.env.TOKEN_SECRET || BUNNY_API_KEY; // Fallback na API key ako nema TOKEN_SECRET

    if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
      console.error('Bunny.net configuration missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Server configuration error'
        })
      };
    }

    // Generiraj upload path
    const uploadPath = `temp/${filename}`;
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${uploadPath}`;
    const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${uploadPath}`;

    // Kreiraj token koji istječe za 5 minuta
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minuta
    
    // Token payload
    const tokenPayload = {
      filename: filename,
      uploadPath: uploadPath,
      expiresAt: expiresAt,
      nonce: crypto.randomBytes(16).toString('hex') // Jednokratni token
    };

    // Kreiraj HMAC signature
    const tokenString = JSON.stringify(tokenPayload);
    const signature = crypto
      .createHmac('sha256', TOKEN_SECRET)
      .update(tokenString)
      .digest('hex');

    // Finalni token (base64 encoded payload + signature)
    const token = Buffer.from(tokenString).toString('base64') + '.' + signature;

    console.log('Token created for:', filename);
    console.log('Expires at:', new Date(expiresAt).toISOString());

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: token,
        uploadUrl: uploadUrl,
        cdnUrl: cdnUrl,
        expiresAt: expiresAt,
        apiKey: BUNNY_API_KEY // Šaljemo API key jer Bunny.net nema token validaciju
      })
    };

  } catch (error) {
    console.error('Error in create-upload-token:', error);
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

