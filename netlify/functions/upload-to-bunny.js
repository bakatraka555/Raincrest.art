/**
 * Netlify Function za upload generirane slike na Bunny.net Storage
 * 
 * Prima:
 * - imageUrl: URL generirane slike (s Replicate)
 * - templateId: ID templatea
 * - userId: ID korisnika (opcionalno)
 * 
 * Vraća:
 * - cdnUrl: CDN URL uploadane slike
 * - thumbnailUrl: CDN URL thumbnail slike (automatski generiran)
 */

const fetch = require('node-fetch');
const sharp = require('sharp');

exports.handler = async (event, context) => {
  console.log('=== upload-to-bunny function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Has body:', !!event.body);
  
  // CORS headers
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
    console.log('Parsing request body...');
    const { imageUrl, templateId, userId } = JSON.parse(event.body);
    console.log('Request body parsed. Keys:', Object.keys({ imageUrl, templateId, userId }));
    console.log('imageUrl:', imageUrl ? imageUrl.substring(0, 50) + '...' : 'null');
    console.log('templateId:', templateId);
    console.log('userId:', userId);

    if (!imageUrl || !templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters: imageUrl, templateId' })
      };
    }

    const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
    const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;

    if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Bunny.net API not configured' })
      };
    }

    // Download sliku s Replicate URL-a
    console.log('Downloading image from:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Generiraj unique filename
    const timestamp = Date.now();
    const filename = userId 
      ? `${templateId}/user-${userId}-${timestamp}.jpg`
      : `${templateId}/generated-${timestamp}.jpg`;

    // Upload na Bunny.net Storage
    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
    
    console.log('Uploading to:', uploadUrl);
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
      console.error('Bunny.net upload error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Upload failed', 
          details: errorText,
          status: uploadResponse.status
        })
      };
    }

    // CDN URL (koristi pravi CDN domain)
    const cdnDomain = process.env.BUNNY_CDN_DOMAIN || 'examples.b-cdn.net';
    const cdnUrl = `https://${cdnDomain}/${filename}`;
    
    console.log('Upload successful, CDN URL:', cdnUrl);

    // Generiraj thumbnail automatski
    let thumbnailUrl = null;
    try {
      console.log('Generating thumbnail...');
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Generiraj thumbnail filename
      const thumbFilename = filename.replace(/\/([^/]+)$/, '/thumbs/$1-thumb.jpg');
      const thumbUploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${thumbFilename}`;
      
      console.log('Uploading thumbnail to:', thumbUploadUrl);
      const thumbUploadResponse = await fetch(thumbUploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'image/jpeg'
        },
        body: thumbnailBuffer
      });

      if (thumbUploadResponse.ok) {
        thumbnailUrl = `https://${cdnDomain}/${thumbFilename}`;
        console.log('Thumbnail uploaded successfully:', thumbnailUrl);
      } else {
        console.warn('Thumbnail upload failed (non-critical):', thumbUploadResponse.statusText);
      }
    } catch (thumbError) {
      // Thumbnail generation is non-critical, log but don't fail
      console.warn('Thumbnail generation failed (non-critical):', thumbError.message);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        cdnUrl: cdnUrl,
        thumbnailUrl: thumbnailUrl || cdnUrl, // Fallback to main image if thumbnail fails
        filename: filename
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

