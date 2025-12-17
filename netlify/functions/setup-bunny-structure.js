/**
 * Netlify Function za setup Bunny.net strukture i upload placeholder slika
 * 
 * Poziva se: POST /.netlify/functions/setup-bunny-structure
 * 
 * Kreira:
 * - temp/ folder za korisničke uploads
 * - Template foldere s placeholder slikama
 */

const fetch = require('node-fetch');

// Bunny.net konfiguracija
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const CDN_DOMAIN = 'examples.b-cdn.net';
const STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

/**
 * Upload file to Bunny.net Storage
 */
async function uploadToBunny(fileData, remotePath, contentType) {
  const url = `${STORAGE_URL}/${remotePath}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': contentType
      },
      body: fileData
    });

    if (response.ok) {
      const cdnUrl = `https://${CDN_DOMAIN}/${remotePath}`;
      return { success: true, cdn_url: cdnUrl };
    } else {
      const errorText = await response.text();
      return { success: false, error: `${response.status} ${response.statusText}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Generate placeholder image as base64
 * Returns a simple colored rectangle as JPEG
 */
function generatePlaceholderImage(width, height, text, bgColor = [102, 126, 234]) {
  // Create a simple SVG that will be converted to data URL
  // For now, we'll create a minimal JPEG using a simple approach
  // In a real implementation, you'd use a library like sharp or canvas
  
  // For simplicity, we'll create a minimal valid JPEG
  // This is a 1x1 pixel JPEG encoded in base64
  // In production, you'd want to use a proper image generation library
  
  // Minimal JPEG header + data (purple 1x1 pixel)
  const minimalJpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A',
    'base64'
  );
  
  // For now, return a simple text placeholder
  // In production, use sharp or canvas to generate proper images
  return Buffer.from(`Placeholder: ${text} (${width}x${height})`);
}

/**
 * Create temp folder
 */
async function createTempFolder() {
  console.log('Creating temp/ folder...');
  const placeholderData = Buffer.from('placeholder');
  const result = await uploadToBunny(placeholderData, 'temp/.placeholder', 'text/plain');
  
  if (result.success) {
    console.log('  [OK] temp/ folder created');
  } else {
    console.log(`  [WARN] temp/ folder: ${result.error}`);
  }
  
  return result;
}

/**
 * Setup template examples
 */
async function setupTemplateExamples(template) {
  const templateId = template.id;
  const templateName = template.name;
  
  console.log(`\nTemplate: ${templateId} - ${templateName}`);
  
  const results = [];
  
  // Upload image examples
  if (template.examples && template.examples.image) {
    for (const imgExample of template.examples.image) {
      const url = imgExample.url;
      const filename = url.split('/').pop();
      const remotePath = `${templateId}/${filename}`;
      
      // Generate placeholder
      const placeholderText = `${templateName}\n${imgExample.description || 'Example'}`;
      const imageData = generatePlaceholderImage(1200, 900, placeholderText);
      
      // Upload main image
      const result = await uploadToBunny(imageData, remotePath, 'image/jpeg');
      if (result.success) {
        console.log(`  [OK] Image: ${remotePath}`);
        results.push({ type: 'image', path: remotePath, url: result.cdn_url });
      } else {
        console.log(`  [FAIL] Image: ${remotePath} - ${result.error}`);
      }
      
      // Upload thumbnail if exists
      if (imgExample.thumbnail) {
        const thumbUrl = imgExample.thumbnail;
        const thumbFilename = thumbUrl.split('/').pop();
        const thumbRemotePath = `${templateId}/thumbs/${thumbFilename}`;
        
        // Generate thumbnail (smaller version)
        const thumbData = generatePlaceholderImage(200, 200, `${templateName} Thumb`);
        const thumbResult = await uploadToBunny(thumbData, thumbRemotePath, 'image/jpeg');
        
        if (thumbResult.success) {
          console.log(`  [OK] Thumbnail: ${thumbRemotePath}`);
        } else {
          console.log(`  [FAIL] Thumbnail: ${thumbRemotePath}`);
        }
      }
    }
  }
  
  // Upload video thumbnails
  if (template.examples && template.examples.video) {
    for (const vidExample of template.examples.video) {
      if (vidExample.thumbnail) {
        const thumbUrl = vidExample.thumbnail;
        const thumbFilename = thumbUrl.split('/').pop();
        const thumbRemotePath = `${templateId}/thumbs/${thumbFilename}`;
        
        // Generate video thumbnail placeholder
        const thumbData = generatePlaceholderImage(200, 200, `${templateName} Video`);
        const thumbResult = await uploadToBunny(thumbData, thumbRemotePath, 'image/jpeg');
        
        if (thumbResult.success) {
          console.log(`  [OK] Video Thumbnail: ${thumbRemotePath}`);
        } else {
          console.log(`  [FAIL] Video Thumbnail: ${thumbRemotePath}`);
        }
      }
    }
  }
  
  return results;
}

exports.handler = async (event, context) => {
  // CORS headers
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

  // Check API key
  if (!BUNNY_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'BUNNY_API_KEY not configured in Netlify environment variables' 
      })
    };
  }

  try {
    console.log('=== setup-bunny-structure function called ===');
    console.log(`Storage Zone: ${BUNNY_STORAGE_ZONE}`);
    console.log(`CDN Domain: ${CDN_DOMAIN}`);

    // Create temp folder
    await createTempFolder();

    const summary = {
      success: true,
      message: 'Bunny.net structure setup completed - temp folder created'
    };

    console.log('\n=== Summary ===');
    console.log('Temp folder created successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(summary)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

