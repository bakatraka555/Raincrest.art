/**
 * api-image-imagen3.js
 * 
 * Google Vertex AI Imagen 3 for TEXT-TO-IMAGE generation.
 * Based on official docs: https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images
 * 
 * Model: imagen-3.0-generate-002
 * COST: ~$0.03 per image (uses Google Cloud credits)
 * 
 * Required Environment Variables:
 * - GOOGLE_CLOUD_PROJECT: Your Google Cloud Project ID
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL: Service account email
 * - GOOGLE_PRIVATE_KEY: Service account private key (PEM format)
 * - GOOGLE_CLOUD_LOCATION: Region (default: us-central1)
 * 
 * Parameters:
 * - prompt: Text description of image to generate
 * - aspectRatio: 1:1, 3:4, 4:3, 9:16, 16:9 (default: 9:16)
 * - numberOfImages: 1-4 (default: 1)
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Latest Imagen 3 model per Google docs
const IMAGEN_MODEL = 'imagen-3.0-generate-002';

// Generate JWT for Service Account authentication
function createJWT(serviceAccountEmail, privateKey) {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const payload = {
        iss: serviceAccountEmail,
        sub: serviceAccountEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: expiry,
        scope: 'https://www.googleapis.com/auth/cloud-platform'
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;

    // Fix private key format (Netlify may escape newlines)
    const fixedKey = privateKey.replace(/\\n/g, '\n');

    const signature = crypto.createSign('RSA-SHA256');
    signature.update(signatureInput);
    const base64Signature = signature.sign(fixedKey, 'base64url');

    return `${signatureInput}.${base64Signature}`;
}

// Exchange JWT for Access Token
async function getAccessToken(serviceAccountEmail, privateKey) {
    const jwt = createJWT(serviceAccountEmail, privateKey);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Auth failed: ${JSON.stringify(data)}`);
    }
    return data.access_token;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body || '{}');
        const {
            prompt,
            aspectRatio = '9:16',
            numberOfImages = 1
        } = body;

        console.log('=== api-image-imagen3 (Vertex AI) START ===');
        console.log('Model:', IMAGEN_MODEL);
        console.log('Prompt:', prompt?.substring(0, 100));
        console.log('Aspect Ratio:', aspectRatio);
        console.log('Number of Images:', numberOfImages);

        // Validation
        if (!prompt || prompt.trim().length < 3) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt is required (min 3 characters)' })
            };
        }

        // Google Cloud Configuration (from existing Netlify env vars)
        const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
        const GOOGLE_CLOUD_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

        // BunnyCDN for storage
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        // Check required credentials
        if (!GOOGLE_CLOUD_PROJECT) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'GOOGLE_CLOUD_PROJECT not configured' }) };
        }
        if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Service account credentials not configured' }) };
        }

        // Get access token from service account
        console.log('Getting access token from service account...');
        const accessToken = await getAccessToken(GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY);
        console.log('Access token obtained');

        // Build Vertex AI Imagen 3 request (per official docs)
        // https://cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images
        const requestBody = {
            instances: [{
                prompt: prompt
            }],
            parameters: {
                sampleCount: Math.min(Math.max(parseInt(numberOfImages) || 1, 1), 4),
                aspectRatio: aspectRatio,
                // Enable prompt enhancement for better quality
                enhancePrompt: true,
                // Allow adult person generation (required for portraits)
                personGeneration: 'allow_adult',
                // Medium safety filter (balanced)
                safetySetting: 'block_medium_and_above',
                // Enable watermark
                addWatermark: true,
                // Output as PNG
                outputOptions: {
                    mimeType: 'image/png'
                }
            }
        };

        // Vertex AI Imagen 3 endpoint (per official docs)
        const apiUrl = `https://${GOOGLE_CLOUD_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GOOGLE_CLOUD_LOCATION}/publishers/google/models/${IMAGEN_MODEL}:predict`;

        console.log('Calling Vertex AI Imagen 3...');
        console.log('Endpoint:', apiUrl);
        console.log('Cost estimate: $' + (0.03 * requestBody.parameters.sampleCount).toFixed(2));

        const imagenResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await imagenResponse.text();
        console.log('Imagen 3 status:', imagenResponse.status);

        if (!imagenResponse.ok) {
            console.error('Imagen 3 error:', responseText.substring(0, 500));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Imagen 3 API error', details: responseText.substring(0, 300) })
            };
        }

        const imagenResult = JSON.parse(responseText);

        // Extract generated images from Vertex AI response
        // Response format: { predictions: [{ bytesBase64Encoded: "...", mimeType: "..." }] }
        const generatedImages = [];

        if (imagenResult.predictions && Array.isArray(imagenResult.predictions)) {
            for (let i = 0; i < imagenResult.predictions.length; i++) {
                const prediction = imagenResult.predictions[i];
                if (prediction.bytesBase64Encoded) {
                    const imageBase64 = prediction.bytesBase64Encoded;
                    const mimeType = prediction.mimeType || 'image/png';

                    // Upload to BunnyCDN
                    const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
                    const filename = `playground/imagen3-${Date.now()}-${i}.${ext}`;
                    const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
                    const imageBuffer = Buffer.from(imageBase64, 'base64');

                    console.log(`Uploading image ${i + 1}:`, filename, imageBuffer.length, 'bytes');

                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'PUT',
                        headers: {
                            'AccessKey': BUNNY_API_KEY,
                            'Content-Type': mimeType
                        },
                        body: imageBuffer
                    });

                    if (uploadResponse.ok || uploadResponse.status === 201) {
                        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${filename}`;
                        generatedImages.push(cdnUrl);
                        console.log(`✅ Image ${i + 1} uploaded:`, cdnUrl);
                    } else {
                        console.error(`Failed to upload image ${i + 1}:`, uploadResponse.status);
                    }
                }
            }
        }

        if (generatedImages.length === 0) {
            console.error('No images generated. Response:', JSON.stringify(imagenResult).substring(0, 500));
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'No images generated', details: 'Imagen 3 returned no predictions' }) };
        }

        console.log('✅ SUCCESS! Generated', generatedImages.length, 'images');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                images: generatedImages,
                imageUrl: generatedImages[0],
                model: IMAGEN_MODEL,
                cost: '$' + (0.03 * generatedImages.length).toFixed(2),
                settings: { aspectRatio, numberOfImages: generatedImages.length }
            })
        };

    } catch (error) {
        console.error('api-image-imagen3 error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
