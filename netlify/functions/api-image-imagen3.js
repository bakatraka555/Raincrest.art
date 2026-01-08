/**
 * api-image-imagen3.js
 * 
 * Google Gemini 2.0 Flash for TEXT-TO-IMAGE generation.
 * Model: gemini-2.0-flash-exp-image-generation (FREE!)
 * 
 * Parameters:
 * - prompt: Text description of image to generate
 * - aspectRatio: 1:1, 16:9, 9:16, 4:3, 3:4 (default: 9:16)
 * - numberOfImages: 1 (model generates 1 at a time)
 */

const fetch = require('node-fetch');

// Using Gemini 2.0 Flash for image generation (FREE and available!)
const IMAGEN_MODEL = 'gemini-2.0-flash-exp-image-generation';

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

        console.log('=== api-image-imagen3 (Gemini 2.0 Flash) START ===');
        console.log('Prompt:', prompt?.substring(0, 100));
        console.log('Aspect Ratio:', aspectRatio);

        // Validation
        if (!prompt || prompt.trim().length < 3) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Prompt is required (min 3 characters)' })
            };
        }

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }) };
        }

        // Build Gemini 2.0 Flash request for image generation
        const requestBody = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                    aspectRatio: aspectRatio
                }
            }
        };

        // Call Gemini 2.0 Flash Image Generation API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

        console.log('Calling Gemini 2.0 Flash Image Gen API...');
        console.log('This is FREE! 🆓');

        const imagenResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseText = await imagenResponse.text();
        console.log('Gemini status:', imagenResponse.status);

        if (!imagenResponse.ok) {
            console.error('Gemini error:', responseText.substring(0, 500));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Gemini API error', details: responseText.substring(0, 300) })
            };
        }

        const geminiResult = JSON.parse(responseText);

        // Extract generated image from Gemini format (candidates[].content.parts[].inlineData)
        let generatedImageBase64 = null;
        let generatedMimeType = 'image/png';

        if (geminiResult.candidates?.[0]?.content?.parts) {
            for (const part of geminiResult.candidates[0].content.parts) {
                if (part.inlineData) {
                    generatedImageBase64 = part.inlineData.data;
                    generatedMimeType = part.inlineData.mimeType || 'image/png';
                    break;
                }
            }
        }

        if (!generatedImageBase64) {
            console.error('No image in Gemini response');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'No image generated' }) };
        }

        // Upload to BunnyCDN
        const ext = generatedMimeType.includes('jpeg') ? 'jpg' : 'png';
        const filename = `playground/txt2img-${Date.now()}.${ext}`;
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
        const imageBuffer = Buffer.from(generatedImageBase64, 'base64');

        console.log('Uploading image:', filename, imageBuffer.length, 'bytes');

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': generatedMimeType
            },
            body: imageBuffer
        });

        if (!uploadResponse.ok && uploadResponse.status !== 201) {
            console.error('Bunny upload failed:', uploadResponse.status);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'CDN upload failed' }) };
        }

        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${filename}`;
        console.log('✅ SUCCESS! Image at:', cdnUrl);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                images: [cdnUrl],
                imageUrl: cdnUrl,
                model: IMAGEN_MODEL,
                cost: 'FREE',
                settings: { aspectRatio }
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
