/**
 * Netlify Background Function: generate-image-gemini-background
 * 
 * Background functions run for up to 15 minutes!
 * Returns 202 immediately, continues processing in background.
 * 
 * Frontend should poll the CDN URL until image appears.
 */

const fetch = require('node-fetch');
const { getPrompt, templateScenes } = require('./prompts');

const GEMINI_MODEL = 'gemini-3-pro-image-preview';

exports.handler = async (event, context) => {
    console.log('=== generate-image-gemini-background STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, image2Url, templateId, isCouple, gender, jobId, outputFilename } = body;

        console.log('Job:', jobId);
        console.log('Template:', templateId);
        console.log('Image URL:', imageUrl?.substring(0, 60));

        // Validation
        if (!imageUrl || !templateId || !jobId || !outputFilename) {
            console.error('Missing parameters');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY || !BUNNY_API_KEY) {
            console.error('Missing API keys');
            return { statusCode: 500, body: JSON.stringify({ error: 'API keys not configured' }) };
        }

        // Generate prompt
        const isCoupleBool = !!isCouple;
        const prompt = getPrompt(templateId, isCoupleBool, gender);
        console.log('Prompt length:', prompt.length);

        // Fetch image
        console.log('Fetching image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Build parts
        const parts = [
            { text: prompt },
            { inline_data: { mime_type: imageMimeType, data: imageBase64 } }
        ];

        // Add second image if provided
        if (!isCoupleBool && image2Url) {
            const image2Response = await fetch(image2Url);
            if (image2Response.ok) {
                const image2Buffer = await image2Response.buffer();
                parts.push({
                    inline_data: {
                        mime_type: image2Response.headers.get('content-type') || 'image/jpeg',
                        data: image2Buffer.toString('base64')
                    }
                });
            }
        }

        // Add logo
        const LOGO_URL = 'https://raincrest-cdn.b-cdn.net/raincrest_logo.png';
        try {
            const logoResponse = await fetch(LOGO_URL);
            if (logoResponse.ok) {
                const logoBuffer = await logoResponse.buffer();
                parts.push({
                    inline_data: {
                        mime_type: 'image/png',
                        data: logoBuffer.toString('base64')
                    }
                });
                console.log('Logo added');
            }
        } catch (e) {
            console.warn('Logo fetch failed:', e.message);
        }

        // Call Gemini API
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                responseModalities: ["IMAGE"],
                imageConfig: {
                    aspectRatio: "4:5",
                    imageSize: "2K"
                }
            }
        };

        console.log('Calling Gemini API...');
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const responseText = await geminiResponse.text();
        console.log('Gemini response status:', geminiResponse.status);

        if (!geminiResponse.ok) {
            console.error('Gemini API error:', responseText.substring(0, 500));
            return { statusCode: 500, body: JSON.stringify({ error: 'Gemini API error' }) };
        }

        const geminiResult = JSON.parse(responseText);

        // Extract image
        let generatedImageBase64 = null;
        let generatedMimeType = 'image/jpeg';

        if (geminiResult.candidates?.[0]?.content?.parts) {
            for (const part of geminiResult.candidates[0].content.parts) {
                if (part.inlineData) {
                    generatedImageBase64 = part.inlineData.data;
                    generatedMimeType = part.inlineData.mimeType || 'image/jpeg';
                    break;
                }
            }
        }

        if (!generatedImageBase64) {
            console.error('No image in response');
            return { statusCode: 500, body: JSON.stringify({ error: 'No image generated' }) };
        }

        // Upload to Bunny
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${outputFilename}`;
        const imageBufferGenerated = Buffer.from(generatedImageBase64, 'base64');

        console.log('Uploading to Bunny:', outputFilename);
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
            return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed' }) };
        }

        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${outputFilename}`;
        console.log('✅ SUCCESS! Image at:', cdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, imageUrl: cdnUrl })
        };

    } catch (error) {
        console.error('Background function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
