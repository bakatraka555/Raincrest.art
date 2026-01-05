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

        // Add second image if provided (for separate King/Queen photos)
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

        // Add Raincrest logo watermark
        const LOGO_URL = 'https://raincrest-cdn.b-cdn.net/raincrest_logo.png';
        console.log('Fetching logo from:', LOGO_URL);
        try {
            const logoResponse = await fetch(LOGO_URL);
            if (logoResponse.ok) {
                const logoBuffer = await logoResponse.buffer();
                const logoBase64 = logoBuffer.toString('base64');
                const logoMimeType = logoResponse.headers.get('content-type') || 'image/png';

                parts.push({
                    inline_data: {
                        mime_type: logoMimeType,
                        data: logoBase64
                    }
                });
                console.log('Logo added:', { size: logoBuffer.length, mimeType: logoMimeType });
            } else {
                console.warn('Failed to fetch logo:', logoResponse.status);
            }
        } catch (logoError) {
            console.warn('Error fetching logo:', logoError.message);
        }

        // Generate job ID and Bunny URL
        const jobId = `gemini-${Date.now()}`;
        const bunnyFilename = `generated/${jobId}.jpg`;
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';
        const bunnyUrl = `https://${BUNNY_CDN_DOMAIN}/${bunnyFilename}`;

        console.log('Created job:', { jobId, bunnyUrl });

        // Prepare imageParts for worker (convert parts to worker format)
        const imageParts = parts.filter(p => p.inline_data).map(p => ({
            inline_data: {
                mime_type: p.inline_data.mime_type,
                data: p.inline_data.data
            }
        }));

        // Get worker URL (same Netlify site)
        const host = event.headers.host || 'raincrest-art.netlify.app';
        const workerUrl = `https://${host}/.netlify/functions/generate-image-google-worker`;

        console.log('🚀 Starting async worker:', workerUrl);
        console.log('📦 Job details:', {
            jobId,
            promptLength: prompt.length,
            imagePartsCount: imageParts.length,
            bunnyUrl
        });

        // Fire-and-forget: Start worker in background
        // Must wait briefly to ensure the request is actually sent before function terminates
        const workerPromise = fetch(workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId,
                prompt,
                imageParts,
                bunnyUrl,
                bunnyFilename,
                templateId,
                isCouple: isCoupleBool
            })
        });

        // Wait 500ms to ensure the request is initiated
        await Promise.race([
            workerPromise.then(response => {
                console.log('✅ Worker request sent, status:', response.status);
            }).catch(err => {
                console.error('⚠️ Worker request error:', err.message);
            }),
            new Promise(resolve => setTimeout(resolve, 500))
        ]);

        // Return immediately with job ID (like Replicate pattern!)
        console.log('✅ Returning job ID (async pattern)');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                jobId: jobId,
                imageUrl: bunnyUrl,
                status: 'processing',
                provider: 'Gemini 3 Pro (async worker)',
                templateId: templateId,
                isCouple: isCoupleBool,
                message: 'Generation started. Poll imageUrl for result.',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('=== ERROR in generate-image-gemini ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                details: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
