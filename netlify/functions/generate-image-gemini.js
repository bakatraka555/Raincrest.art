/**
 * Netlify Function: generate-image-gemini
 * 
 * Koristi Google Gemini 3 Pro Image API (Nano Banana Pro) za generaciju slika
 * Image-to-Image: Prima sliku korisnika + prompt, vraća novu sliku
 * 
 * Model: gemini-3-pro-image-preview
 * 
 * Input:
 * - imageUrl: URL slike na Bunny CDN
 * - image2Url: (opcionalno) druga slika
 * - templateId: ID templatea
 * - isCouple: boolean
 * 
 * Environment Variables potrebne:
 * - GOOGLE_AI_API_KEY: API key iz https://aistudio.google.com/apikey
 */

const fetch = require('node-fetch');
const { getPrompt, templateScenes } = require('./prompts');

// Model name za Gemini 3 Pro Image (Nano Banana Pro)
const GEMINI_MODEL = 'gemini-3-pro-image-preview';

exports.handler = async (event, context) => {
    console.log('=== generate-image-gemini function called ===');
    console.log('HTTP Method:', event.httpMethod);

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
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
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, image2Url, templateId, isCouple, gender } = body;

        console.log('Request:', {
            hasImageUrl: !!imageUrl,
            hasImage2Url: !!image2Url,
            templateId,
            isCouple,
            gender
        });

        // Validation
        if (!imageUrl || !templateId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Missing required parameters',
                    required: ['imageUrl', 'templateId']
                })
            };
        }

        // Check API key
        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        if (!GOOGLE_AI_API_KEY) {
            console.error('GOOGLE_AI_API_KEY not configured');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'GOOGLE_AI_API_KEY not configured',
                    hint: 'Add GOOGLE_AI_API_KEY in Netlify Dashboard → Site settings → Environment variables'
                })
            };
        }

        // Check template
        if (!templateScenes[templateId]) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Template not found',
                    availableTemplates: Object.keys(templateScenes)
                })
            };
        }

        // Generate prompt with gender parameter
        const isCoupleBool = !!isCouple;
        const prompt = getPrompt(templateId, isCoupleBool, gender);
        console.log('Prompt length:', prompt.length);
        console.log('Gender:', gender);
        console.log('Prompt preview (first 300 chars):', prompt.substring(0, 300));

        // Fetch image(s) and convert to base64
        console.log('Fetching image from URL:', imageUrl.substring(0, 80) + '...');

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        console.log('Image fetched:', {
            size: imageBuffer.length,
            mimeType: imageMimeType
        });

        // Build parts array for Gemini API
        const parts = [
            {
                text: prompt
            },
            {
                inline_data: {
                    mime_type: imageMimeType,
                    data: imageBase64
                }
            }
        ];

        // Add second image if provided
        if (!isCoupleBool && image2Url) {
            console.log('Fetching second image...');
            const image2Response = await fetch(image2Url);
            if (image2Response.ok) {
                const image2Buffer = await image2Response.buffer();
                const image2Base64 = image2Buffer.toString('base64');
                const image2MimeType = image2Response.headers.get('content-type') || 'image/jpeg';

                parts.push({
                    inline_data: {
                        mime_type: image2MimeType,
                        data: image2Base64
                    }
                });
                console.log('Second image added');
            }
        }

        // Gemini API request
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

        // Request body for image generation
        // Note: For Gemini 3 Pro Image, we just need contents with the prompt and image
        const requestBody = {
            contents: [
                {
                    parts: parts
                }
            ]
        };

        console.log('Calling Gemini API...');
        console.log('API URL:', apiUrl.replace(GOOGLE_AI_API_KEY, 'HIDDEN'));

        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await geminiResponse.text();
        console.log('Gemini response status:', geminiResponse.status);

        if (!geminiResponse.ok) {
            console.error('Gemini API error:', responseText);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Gemini API error',
                    status: geminiResponse.status,
                    details: responseText.substring(0, 500)
                })
            };
        }

        // Parse response
        let geminiResult;
        try {
            geminiResult = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse Gemini response:', e);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'Failed to parse Gemini response',
                    details: responseText.substring(0, 200)
                })
            };
        }

        console.log('Gemini result structure:', Object.keys(geminiResult));

        // Extract generated image
        let generatedImageBase64 = null;
        let generatedMimeType = 'image/jpeg';

        if (geminiResult.candidates && geminiResult.candidates[0]) {
            const candidate = geminiResult.candidates[0];

            if (candidate.content && candidate.content.parts) {
                for (const part of candidate.content.parts) {
                    // API returns camelCase: inlineData (not snake_case: inline_data)
                    if (part.inlineData) {
                        generatedImageBase64 = part.inlineData.data;
                        generatedMimeType = part.inlineData.mimeType || 'image/jpeg';
                        console.log('Found generated image in response');
                        break;
                    }
                }
            }
        }

        if (!generatedImageBase64) {
            console.error('No image in Gemini response:', JSON.stringify(geminiResult).substring(0, 500));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: 'No image generated',
                    details: 'Gemini API did not return an image',
                    response: JSON.stringify(geminiResult).substring(0, 300)
                })
            };
        }

        // Upload generated image to Bunny.net
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!BUNNY_API_KEY) {
            // Return base64 data URL if Bunny not configured
            console.log('Bunny not configured, returning base64');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: `data:${generatedMimeType};base64,${generatedImageBase64}`,
                    source: 'gemini-base64'
                })
            };
        }

        // Upload to Bunny.net
        const timestamp = Date.now();
        const filename = `generated/gemini-${timestamp}.jpg`;
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;

        console.log('Uploading to Bunny.net:', filename);

        const imageBufferGenerated = Buffer.from(generatedImageBase64, 'base64');
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': generatedMimeType
            },
            body: imageBufferGenerated
        });

        if (!uploadResponse.ok && uploadResponse.status !== 201) {
            console.error('Bunny upload failed:', uploadResponse.status);
            // Fallback to base64
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    imageUrl: `data:${generatedMimeType};base64,${generatedImageBase64}`,
                    source: 'gemini-base64-fallback'
                })
            };
        }

        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${filename}`;
        console.log('✅ Image uploaded to CDN:', cdnUrl);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                imageUrl: cdnUrl,
                source: 'gemini'
            })
        };

    } catch (error) {
        console.error('Error in generate-image-gemini:', error);
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
