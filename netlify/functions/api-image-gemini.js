/**
 * api-image-gemini.js
 * 
 * Direct Google Gemini API wrapper for image generation.
 * Uses FREE gemini-3-pro-image-preview model.
 * 
 * Parameters:
 * - prompt: Text prompt for image generation
 * - imageUrl: Reference image URL (for face/style reference)
 * - aspectRatio: 1:1, 4:3, 16:9, 9:16, 4:5 (default: 9:16)
 * - resolution: 1K, 2K, 4K (default: 2K)
 * - outputFormat: png, jpeg, webp (default: png)
 * - safetyFilterLevel: block_none, block_only_high, block_medium_and_above (default: block_only_high)
 */

const fetch = require('node-fetch');

const GEMINI_MODEL = 'gemini-3-pro-image-preview';

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
            imageUrl,
            aspectRatio = '9:16',
            resolution = '2K',
            outputFormat = 'png',
            safetyFilterLevel = 'block_only_high'
        } = body;

        console.log('=== api-image-gemini START ===');
        console.log('Prompt length:', prompt?.length);
        console.log('Image URL:', imageUrl?.substring(0, 60));
        console.log('Aspect Ratio:', aspectRatio);
        console.log('Resolution:', resolution);
        console.log('Format:', outputFormat);
        console.log('Safety:', safetyFilterLevel);

        // Validation
        if (!prompt || !imageUrl) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required parameters: prompt and imageUrl' })
            };
        }

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'GOOGLE_AI_API_KEY not configured' }) };
        }

        // Fetch reference image
        console.log('Fetching reference image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Build Gemini request
        const parts = [
            { text: prompt },
            { inline_data: { mime_type: imageMimeType, data: imageBase64 } }
        ];

        // Safety settings based on level
        const safetySettings = [];
        if (safetyFilterLevel === 'block_none') {
            // Most permissive
            safetySettings.push(
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            );
        } else if (safetyFilterLevel === 'block_medium_and_above') {
            // Most restrictive
            safetySettings.push(
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            );
        }
        // Default (block_only_high) uses API defaults

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                    aspectRatio: aspectRatio,
                    imageSize: resolution
                    // Note: outputFormat is NOT supported by Gemini API - image format is determined by response
                }
            }
        };

        // Add safety settings if specified
        if (safetySettings.length > 0) {
            requestBody.safetySettings = safetySettings;
        }

        // Call Gemini API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

        console.log('Calling Gemini API...');
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseText = await geminiResponse.text();
        console.log('Gemini status:', geminiResponse.status);

        if (!geminiResponse.ok) {
            console.error('Gemini error:', responseText.substring(0, 500));
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Gemini API error', details: responseText.substring(0, 200) })
            };
        }

        const geminiResult = JSON.parse(responseText);

        // Extract generated image
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
        const filename = `playground/gemini-${Date.now()}.${outputFormat}`;
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
        const generatedBuffer = Buffer.from(generatedImageBase64, 'base64');

        console.log('Uploading to Bunny:', filename, generatedBuffer.length, 'bytes');
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': generatedMimeType
            },
            body: generatedBuffer
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
                imageUrl: cdnUrl,
                model: GEMINI_MODEL,
                settings: { aspectRatio, resolution, outputFormat, safetyFilterLevel }
            })
        };

    } catch (error) {
        console.error('api-image-gemini error:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
