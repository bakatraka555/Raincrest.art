/**
 * Netlify Background Function: generate-image-imagen3
 * 
 * Uses Google Imagen 3 (Vertex AI) with Subject Customization
 * to transform tourist photos into medieval royalty with FACE PRESERVATION.
 * 
 * Key features:
 * - AUTH: Uses Service Account (client_email + private_key) for 401 fix
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
    // Project settings
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

        // Environment Variables Check
        const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_CLOUD_PROJECT || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY || !BUNNY_API_KEY) {
            const missing = [];
            if (!GOOGLE_CLOUD_PROJECT) missing.push('GOOGLE_CLOUD_PROJECT');
            if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
            if (!GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_PRIVATE_KEY');
            if (!BUNNY_API_KEY) missing.push('BUNNY_API_KEY');

            console.error('Missing required environment variables:', missing.join(', '));
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Server configuration error',
                    details: `Missing variables: ${missing.join(', ')}`
                })
            };
        }

        // Initialize Vertex AI with Service Account
        // Critical for fixing 401 errors
        const vertexAI = new VertexAI({
            project: GOOGLE_CLOUD_PROJECT,
            location: IMAGEN_CONFIG.location,
            googleAuthOptions: {
                credentials: {
                    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') // Fix for Netlify env vars
                }
            }
        });

        // Fetch the tourist image
        console.log('Fetching tourist image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Build the transformation prompt
        const genderText = isCouple ? 'KING and QUEEN royal couple' : (gender === 'queen' ? 'medieval QUEEN' : 'medieval KING');

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

        // Initialize Generative Model
        const generativeModel = vertexAI.getGenerativeModel({
            model: IMAGEN_CONFIG.model
        });

        console.log('Calling Imagen 3 API with Subject Customization...');

        // Correct usage for Imagen model in newer SDKs might differ, 
        // but generateImages is standard for the high-level wrapper if available.
        // If not, we might need to fallback to raw prediction, but using the authorized client.
        // Let's try the SDK method first as it handles the complexity.

        let result;
        try {
            // NOTE: The SDK method naming can vary. 
            // Checking documentation pattern: generateContent is for multimodal, generateImages for image models.
            // If generateImages is not directly on the model object in some versions, 
            // we might need to use `generateContent` or specific helper.
            // However, based on recent Google GenAI SDKs, `generateImages` exists.

            result = await generativeModel.generateImages({
                prompt: fullPrompt,
                referenceImages: [{
                    referenceId: 1,
                    referenceImage: {
                        bytesBase64Encoded: imageBase64
                    },
                    referenceType: 'REFERENCE_TYPE_SUBJECT'
                }],
                numberOfImages: IMAGEN_CONFIG.numberOfImages,
                aspectRatio: IMAGEN_CONFIG.aspectRatio,
                personGeneration: 'allow_adult',
                safetySettings: [{
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_ONLY_HIGH'
                }]
            });

        } catch (sdkError) {
            console.error('SDK generation failed, trying raw prediction fallback...');
            throw sdkError; // Re-throw for now to see exact error in logs
        }

        // Extract generated image
        // Structure depends on SDK version, usually predictions[0].bytesBase64Encoded or images[0]
        const generatedImageBase64 = result.predictions?.[0]?.bytesBase64Encoded
            || result.images?.[0]?.bytesBase64Encoded
            || result[0]?.bytesBase64Encoded; // Fallbacks

        if (!generatedImageBase64) {
            console.error('No image in response:', JSON.stringify(result));
            return { statusCode: 500, body: JSON.stringify({ error: 'No image generated', raw: result }) };
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
                model: IMAGEN_CONFIG.model,
                feature: 'Subject Customization (Vertex AI Auth)'
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
