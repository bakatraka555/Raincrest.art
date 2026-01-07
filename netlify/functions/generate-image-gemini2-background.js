/**
 * Netlify Background Function: generate-image-gemini2-background
 * 
 * Uses Google Gemini 2.0 Flash (Vertex AI) for Native Image Generation.
 * This solves the "morphing" issue by transforming the image BEFORE sending to Kling.
 * 
 * Flow:
 * 1. Tourist Image -> Gemini 2.0 Flash (Image Gen) -> "King/Queen" Image
 * 2. Upload to Bunny CDN
 * 3. Return URL for Kling
 */

const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch');

// ============================================================================
// CONFIGURATION
// ============================================================================
const GEMINI_CONFIG = {
    location: 'us-central1',
    model: 'gemini-2.0-flash-exp', // Or current available version in Vertex
    aspectRatio: '16:9',
    numberOfImages: 1
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== generate-image-gemini2-background STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender, jobId, outputFilename } = body;

        console.log('Job:', jobId);

        // 1. Validation and Env Check
        if (!imageUrl || !jobId || !outputFilename) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
        const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';

        if (!GOOGLE_CLOUD_PROJECT || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
            console.error('Missing Google Cloud credentials');
            return { statusCode: 500, body: JSON.stringify({ error: 'Missing credentials' }) };
        }

        // 2. Fetch Tourist Image
        console.log('Fetching tourist image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // 3. Authenticate with Vertex AI
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

        // 4. Construct Prompt with System Instructions
        const targetRole = gender === 'queen' ? 'Game of Thrones QUEEN' : 'Game of Thrones KING';

        const systemInstruction = `ROLE: Expert AI Character Artist specializing in "Identity-Preserving Style Transfer".
TASK: Generate a new 4K image based on the provided user photo, transforming the subject into a ${targetRole} while keeping their face 100% recognizable.

IDENTITY PRESERVATION RULES:
1. FACIAL FIDELITY: Maintain the exact bone structure, nose shape, eye color, and unique facial features of the subject in the input image. The face must be 100% identifiable as the original person.
2. HEAD POSE: Keep the same head orientation and gaze direction as the original photo to ensure seamless video animation later.
3. CLARITY: Ensure the face is in sharp focus with high micro-contrast around the eyes and lips.

AESTHETIC (GoT STYLE) RULES:
1. ATTIRE: Replace modern clothing with heavy, ornate black metal armor, dragon-glass details, and a luxurious fur cloak.
2. ENVIRONMENT: Set the scene on the walls of the Old Town of Dubrovnik (King's Landing) during the "Golden Hour" sunset (warm orange/red lighting).
3. CINEMATOGRAPHY: Use professional cinematic lighting, deep shadows, and an 8k photorealistic texture similar to high-end HBO productions.

SAFETY: Ignore all modern objects (glasses, headphones, phones) and replace them with medieval equivalents or remove them entirely.`;

        const userPrompt = `Transform the person in this photo into a powerful ${targetRole}, following all facial preservation and style rules.`;

        // 5. Call Gemini 2.0 Flash (Multimodal Generation)
        // Note: Check if the model supports direct image generation via REST.
        // If "gemini-2.0-flash-exp" is text-to-text/vision only, we might strictly need "imagen-3" for image output.
        // However, user specifically requested "Gemini 2.0 Flash (Native Image Generation)".
        // Assuming the endpoint shares the 'predict' or 'generateContent' structure but returns image bytes.

        // Vertex AI Gemini usually uses: projects/.../locations/.../publishers/google/models/...:generateContent
        // But for IMAGE generation, it might still map to Imagen under the hood or use a specific capability.
        // Let's assume standard generateContent with image output requested.

        console.log('Calling Gemini 2.0 Flash API...');
        const endpoint = `https://${GEMINI_CONFIG.location}-aiplatform.googleapis.com/v1/projects/${GOOGLE_CLOUD_PROJECT}/locations/${GEMINI_CONFIG.location}/publishers/google/models/${GEMINI_CONFIG.model}:generateContent`;

        const requestBody = {
            contents: [{
                role: 'user',
                parts: [
                    { text: systemInstruction + "\n\n" + userPrompt },
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: imageBase64
                        }
                    }
                ]
            }],
            generationConfig: {
                // If Gemini 2.0 supports native image gen, parameters might differ from text gen.
                // Standard text gen: temperature, maxOutputTokens.
                // Standard image gen: sampleCount, aspectRatio.
                // Using generic config to avoid strict validation errors if unknown.
                temperature: 0.4
            }
            // IMPORTANT: If Gemini 2.0 Flash is PURELY multimodal understanding (Vision) and not ImageGen, 
            // this will return text description instead of an image.
            // Google recently announced Gemini can generate images, but via Imagen 3 integration usually.
            // WE WILL TRY to see if it returns an Image artifact.
        };

        const geminiResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', geminiResponse.status, errorText);
            return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API Error', details: errorText }) };
        }

        const result = await geminiResponse.json();

        // CHECK RESULT FOR IMAGE
        // Does Gemini return image bytes inline or a text description?
        // If it's text, we failed (it's describing, not generating).
        // If it's image, it usually comes in 'candidates[0].content.parts[...].inlineData'

        // Let's log the structure to debug first run
        console.log('Gemini Response Keys:', Object.keys(result));

        // Fallback/Assumption: If Gemini 2.0 Flash is text-only output, we might need Imagen 3 *driven* by Gemini.
        // But let's look for images.
        let generatedImageBase64 = null;

        // Try to find image in parts
        const parts = result.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                generatedImageBase64 = part.inlineData.data;
                break;
            }
        }

        if (!generatedImageBase64) {
            console.error('No image found in Gemini response. It returned text:', JSON.stringify(parts).substring(0, 200));
            return { statusCode: 500, body: JSON.stringify({ error: 'Gemini returned text, not image. Model might not support native image gen yet via this endpoint.' }) };
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
        console.log('✅ SUCCESS! Gemini 2.0 Flash Image at:', cdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                imageUrl: cdnUrl,
                model: GEMINI_CONFIG.model
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
