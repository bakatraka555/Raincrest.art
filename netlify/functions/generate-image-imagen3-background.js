/**
 * Netlify Background Function: generate-image-imagen3-background
 * 
 * Uses Google Imagen 3 (Vertex AI) with Subject Customization
 * via RAW REST API to bypass SDK version issues.
 * 
 * Key configuration:
 * - Auth: google-auth-library (Service Account)
 * - API: Vertex AI Prediction Service (REST)
 * - Model: imagen-3.0-capability-001
 * - Feature: Subject Customization with [1] reference (REST Schema)
 */

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

// ============================================================================
// CONFIGURATION
// ============================================================================
const IMAGEN_CONFIG = {
    location: 'us-central1',
    model: 'imagen-3.0-capability-001',
    aspectRatio: '16:9', // Optimized for video
    numberOfImages: 1
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== generate-image-imagen3-background STARTED (REST API v3) ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender, jobId, outputFilename, faceAnalysis } = body;

        console.log('Job:', jobId);
        console.log('Template:', templateId);

        // 1. Validation and Env Check
        if (!imageUrl || !jobId || !outputFilename) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';

        // Granular Env Check
        if (!GOOGLE_CLOUD_PROJECT || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !BUNNY_API_KEY) {
            const missing = [];
            if (!GOOGLE_CLOUD_PROJECT) missing.push('GOOGLE_CLOUD_PROJECT');
            if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
            if (!GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_PRIVATE_KEY');
            if (!BUNNY_API_KEY) missing.push('BUNNY_API_KEY');

            console.error('Missing env vars:', missing.join(', '));
            return { statusCode: 500, body: JSON.stringify({ error: `Missing vars: ${missing.join(', ')}` }) };
        }

        // 2. Fetch Tourist Image
        console.log('Fetching tourist image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // 3. Authenticate with Google
        console.log('Authenticating with Service Account...');
        const auth = new GoogleAuth({
            credentials: {
                client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();
        const token = accessToken.token;
        console.log('Auth successful (token obtained)');

        // 4. Construct Prompt (Singular for Subject Customization)
        // Subject Customization works best with 1-to-1 mapping
        const targetRole = gender === 'queen' ? 'QUEEN' : 'KING';
        // Ensure we refer to "the person in [1]"
        const basePrompt = faceAnalysis || `Transform the person in [1] into a powerful Game of Thrones ${targetRole}`;

        const fullPrompt = `${basePrompt}
        
STYLE REQUIREMENTS:
- Game of Thrones aesthetic
- Heavy black metal armor with fur cloak
- On the walls of Dubrovnik (King's Landing) at golden hour sunset
- 4K resolution, crystal clear, no artifacts
- Enhanced contrast on face to prevent video "melting"
- Professional cinematic photography
- Sharp facial features with defined edges`;

        // 5. Build Request Payload (CORRECT REST FORMAT)
        console.log('Calling Imagen 3 REST API...');
        const endpoint = `https://${IMAGEN_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${IMAGEN_CONFIG.location}/publishers/google/models/${IMAGEN_CONFIG.model}:predict`;

        const requestBody = {
            instances: [{
                prompt: fullPrompt,
                referenceImages: [{
                    referenceId: 1,
                    referenceType: "SUBJECT", // Plain string, not enum
                    image: {
                        bytesBase64Encoded: imageBase64
                    }
                }]
            }],
            parameters: {
                sampleCount: IMAGEN_CONFIG.numberOfImages,
                aspectRatio: IMAGEN_CONFIG.aspectRatio,
                personGeneration: "allow" // Critical
                // Removed safetySetting to rely on project defaults and avoid 400s
            }
        };

        // Debug Log Payload (without massive base64)
        const debugBody = JSON.parse(JSON.stringify(requestBody));
        debugBody.instances[0].referenceImages[0].image.bytesBase64Encoded = '...truncated...';
        console.log('Request Payload:', JSON.stringify(debugBody, null, 2));

        const imagenResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!imagenResponse.ok) {
            const errorText = await imagenResponse.text();
            console.error('Vertex AI API error:', imagenResponse.status, errorText);
            return { statusCode: 500, body: JSON.stringify({ error: 'Vertex API Error', details: errorText }) };
        }

        const result = await imagenResponse.json();
        const generatedImageBase64 = result.predictions?.[0]?.bytesBase64Encoded;

        if (!generatedImageBase64) {
            console.error('No image in response:', JSON.stringify(result));
            return { statusCode: 500, body: JSON.stringify({ error: 'No image generated' }) };
        }

        // 6. Upload to Bunny CDN
        console.log('Image generated! Uploading to Bunny...');
        const imageBufferOutput = Buffer.from(generatedImageBase64, 'base64');
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${outputFilename}`;

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'image/png'
            },
            body: imageBufferOutput
        });

        if (!uploadResponse.ok) {
            console.error('Bunny upload failed:', uploadResponse.status);
            return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed' }) };
        }

        const cdnUrl = `https://${process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net'}/${outputFilename}`;
        console.log('✅ SUCCESS! Image at:', cdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                imageUrl: cdnUrl,
                model: IMAGEN_CONFIG.model
            })
        };

    } catch (error) {
        console.error('Function error:', error.message);
        console.error('Stack:', error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
