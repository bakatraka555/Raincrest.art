/**
 * Netlify Background Function: generate-image-imagen3
 * 
 * Uses Google Imagen 3 (Vertex AI) with Subject Customization
 * to transform tourist photos into medieval royalty with FACE PRESERVATION.
 * 
 * Key features:
 * - Subject Customization: Uses tourist photo as reference [1]
 * - Face Preservation: Maintains exact facial features
 * - High Resolution: 4K quality output
 * - Covered by $1,000 Google Cloud credits
 */

const { VertexAI } = require('@google-cloud/vertexai');
const fetch = require('node-fetch');

// ============================================================================
// CONFIGURATION
// ============================================================================
const IMAGEN_CONFIG = {
    // Project settings - these should be in env vars
    project: process.env.GOOGLE_CLOUD_PROJECT || 'raincrest-art',
    location: 'us-central1',

    // Model for Subject Customization
    model: 'imagen-3.0-capability-001',

    // Output settings
    aspectRatio: '9:16', // Vertical for mobile
    numberOfImages: 1
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== generate-image-imagen3 STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender, jobId, outputFilename, faceAnalysis } = body;

        console.log('Job:', jobId);
        console.log('Template:', templateId);
        console.log('Image URL:', imageUrl?.substring(0, 60));

        // Validation
        if (!imageUrl || !jobId || !outputFilename) {
            console.error('Missing parameters');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';
        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

        if (!BUNNY_API_KEY || !GOOGLE_AI_API_KEY) {
            console.error('Missing API keys');
            return { statusCode: 500, body: JSON.stringify({ error: 'API keys not configured' }) };
        }

        // Fetch the tourist image
        console.log('Fetching tourist image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Build the transformation prompt
        const genderText = isCouple ? 'KING and QUEEN couple' : (gender === 'queen' ? 'medieval QUEEN' : 'medieval KING');

        // Use face analysis if provided, otherwise use default prompt
        const basePrompt = faceAnalysis || `Transform the person in [1] into a powerful ${genderText}`;

        const fullPrompt = `${basePrompt}
        
STYLE REQUIREMENTS:
- Game of Thrones aesthetic
- Heavy black metal armor with fur cloak
- On the walls of Dubrovnik (King's Landing) at golden hour sunset
- 4K resolution, crystal clear, no artifacts
- Enhanced contrast on face to prevent video "melting"
- Professional cinematic photography
- Sharp facial features with defined edges
- Dramatic medieval fantasy lighting`;

        console.log('Prompt:', fullPrompt.substring(0, 200));

        // Call Imagen 3 API with Subject Customization
        // Using REST API format for Vertex AI
        const apiUrl = `https://${IMAGEN_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${IMAGEN_CONFIG.project}/locations/${IMAGEN_CONFIG.location}/publishers/google/models/${IMAGEN_CONFIG.model}:predict`;

        const requestBody = {
            instances: [{
                prompt: fullPrompt,
                referenceImages: [{
                    referenceId: 1,
                    referenceImage: {
                        bytesBase64Encoded: imageBase64
                    },
                    referenceType: 'REFERENCE_TYPE_SUBJECT'
                }]
            }],
            parameters: {
                sampleCount: IMAGEN_CONFIG.numberOfImages,
                aspectRatio: IMAGEN_CONFIG.aspectRatio,
                personGeneration: 'allow_adult',
                safetySetting: 'block_few'
            }
        };

        console.log('Calling Imagen 3 API with Subject Customization...');

        const imagenResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GOOGLE_AI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const imagenResult = await imagenResponse.json();
        console.log('Imagen response status:', imagenResponse.status);

        if (!imagenResponse.ok) {
            console.error('Imagen API error:', JSON.stringify(imagenResult));
            return { statusCode: 500, body: JSON.stringify({ error: 'Imagen API error', details: imagenResult }) };
        }

        // Extract generated image
        const generatedImageBase64 = imagenResult.predictions?.[0]?.bytesBase64Encoded;
        if (!generatedImageBase64) {
            console.error('No image in response:', JSON.stringify(imagenResult));
            return { statusCode: 500, body: JSON.stringify({ error: 'No image generated' }) };
        }

        console.log('Image generated successfully!');

        // Upload to Bunny CDN
        const imageBufferOutput = Buffer.from(generatedImageBase64, 'base64');
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${outputFilename}`;

        console.log('Uploading to Bunny:', outputFilename);
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'image/png'
            },
            body: imageBufferOutput
        });

        if (!uploadResponse.ok && uploadResponse.status !== 201) {
            console.error('Bunny upload failed:', uploadResponse.status);
            return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed' }) };
        }

        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${outputFilename}`;
        console.log('✅ SUCCESS! Image at:', cdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                imageUrl: cdnUrl,
                model: 'imagen-3.0-capability-001',
                feature: 'Subject Customization'
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
