/**
 * Netlify Function za kreiranje Bunny.net folder strukture
 * 
 * Poziva se: POST /.netlify/functions/create-bunny-folders
 * 
 * Kreira samo folder strukturu (bez slika)
 * Placeholder slike možeš uploadati ručno preko Bunny.net dashboarda
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Bunny.net konfiguracija
const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const STORAGE_URL = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}`;

/**
 * Create folder by uploading a placeholder file
 */
async function createFolder(folderPath) {
  const url = `${STORAGE_URL}/${folderPath}/.placeholder`;
  const placeholderData = Buffer.from('placeholder');
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'text/plain'
      },
      body: placeholderData
    });

    if (response.ok) {
      return { success: true, path: folderPath };
    } else {
      const errorText = await response.text();
      return { success: false, error: `${response.status}: ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

exports.handler = async (event, context) => {
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

  if (!BUNNY_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'BUNNY_API_KEY not configured' 
      })
    };
  }

  try {
    console.log('=== create-bunny-folders function called ===');

    const foldersCreated = [];
    const errors = [];

    // Create temp folder for user uploads
    const tempResult = await createFolder('temp');
    if (tempResult.success) {
      foldersCreated.push('temp');
      console.log('[OK] temp/');
    } else {
      errors.push({ folder: 'temp', error: tempResult.error });
      console.log(`[FAIL] temp/ - ${tempResult.error}`);
    }

    // Create public folder for demo images
    const publicResult = await createFolder('public');
    if (publicResult.success) {
      foldersCreated.push('public');
      console.log('[OK] public/');
    } else {
      errors.push({ folder: 'public', error: publicResult.error });
      console.log(`[FAIL] public/ - ${publicResult.error}`);
    }

    const summary = {
      success: true,
      foldersCreated: foldersCreated.length,
      totalFolders: foldersCreated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Created ${foldersCreated.length} folders. Now upload placeholder images manually via Bunny.net dashboard.`
    };

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

