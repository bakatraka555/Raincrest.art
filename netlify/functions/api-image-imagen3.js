/**
 * api-image-imagen3.js
 * 
 * Google Imagen 3 API for TEXT-TO-IMAGE generation.
 * Model: imagen-3.0-generate-002
 * 
 * COST: $0.03 per image (NOT FREE!)
 * 
 * Parameters:
 * - prompt: Text description of image to generate
 * - aspectRatio: 1:1, 16:9, 9:16, 4:3, 3:4 (default: 9:16)
 * - numberOfImages: 1-4 (default: 1)
 */

const fetch = require('node-fetch');

const IMAGEN_MODEL = 'imagen-3.0-generate-002';

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

        console.log('=== api-image-imagen3 START ===');
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

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }) };
        }

        // Build Imagen 3 request
        const requestBody = {
            instances: [{ prompt: prompt }],
            parameters: {
                sampleCount: Math.min(Math.max(parseInt(numberOfImages) || 1, 1), 4),
                aspectRatio: aspectRatio
            }
        };

        // Call Imagen 3 API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${GOOGLE_AI_API_KEY}`;

        console.log('Calling Imagen 3 API...');
        console.log('Cost estimate: $' + (0.03 * requestBody.parameters.sampleCount).toFixed(2));

        const imagenResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

        // Extract generated images
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
            console.error('No images generated');
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'No images generated' }) };
        }

        console.log('✅ SUCCESS! Generated', generatedImages.length, 'images');

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                images: generatedImages,
                imageUrl: generatedImages[0], // First image for compatibility
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
