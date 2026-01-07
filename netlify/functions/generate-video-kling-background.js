/**
 * Netlify Background Function: generate-video-kling-background
 * 
 * Uses Kling v2.6 via Replicate API to generate video from image
 * Background function = up to 15 minutes execution time
 * 
 * COST: ~$0.35-0.70 per 5s video (cheaper than Veo, better face quality)
 * 
 * Replicate model: kwaivgi/kling-v2.6
 */

const fetch = require('node-fetch');
const { getVideoPrompt } = require('./prompts');

// ============================================================================
// CONFIGURATION
// ============================================================================
const KLING_CONFIG = {
    // Replicate model
    model: 'kwaivgi/kling-v2.6',

    // Duration: 5 or 10 seconds
    duration: 5,

    // Aspect ratio: "16:9", "9:16", "1:1"
    aspect_ratio: '9:16',

    // Enable audio generation (adds to cost)
    generate_audio: true
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== generate-video-kling-background STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, prompt, jobId, outputFilename, templateId, isCouple, gender } = body;

        // Get video prompt - either from request or generate from template
        let videoPrompt = prompt;
        if (!videoPrompt && templateId) {
            videoPrompt = getVideoPrompt(templateId, isCouple, gender);
            console.log('Using template video prompt for:', templateId, 'isCouple:', isCouple, 'gender:', gender);
        }

        // Add Raincrest watermark instruction if not already present
        const logoInstruction = 'IMPORTANT: Display "RAINCREST.ART" watermark in elegant golden medieval font in the bottom-right corner throughout the entire video. Semi-transparent but clearly visible.';
        if (videoPrompt && !videoPrompt.includes('RAINCREST')) {
            videoPrompt = `${videoPrompt} ${logoInstruction}`;
        }

        console.log('Job:', jobId);
        console.log('Image URL:', imageUrl?.substring(0, 60));
        console.log('Video Prompt:', videoPrompt?.substring(0, 100));

        // Validation
        if (!imageUrl || !videoPrompt || !jobId || !outputFilename) {
            console.error('Missing parameters');
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!REPLICATE_API_TOKEN || !BUNNY_API_KEY) {
            console.error('Missing API keys');
            return { statusCode: 500, body: JSON.stringify({ error: 'API keys not configured' }) };
        }

        // Start Kling video generation via Replicate
        console.log('Starting Kling v2.6 video generation...');

        const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Prefer': 'wait'
            },
            body: JSON.stringify({
                input: {
                    start_image: imageUrl,
                    prompt: videoPrompt,
                    duration: KLING_CONFIG.duration,
                    aspect_ratio: KLING_CONFIG.aspect_ratio,
                    generate_audio: KLING_CONFIG.generate_audio,
                    negative_prompt: "face morphing, face melting, distorted face, blurry face, different person, ugly, deformed"
                }
            })
        });

        const prediction = await replicateResponse.json();
        console.log('Replicate response status:', replicateResponse.status);
        console.log('Prediction:', JSON.stringify(prediction).substring(0, 500));

        if (!replicateResponse.ok) {
            console.error('Replicate API error:', JSON.stringify(prediction));
            return { statusCode: 500, body: JSON.stringify({ error: 'Replicate API error', details: prediction }) };
        }

        // Get prediction ID for polling
        const predictionId = prediction.id;
        if (!predictionId) {
            console.error('No prediction ID returned:', prediction);
            return { statusCode: 500, body: JSON.stringify({ error: 'No prediction ID', result: prediction }) };
        }
        console.log('Prediction started:', predictionId);

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes max (60 * 10s)
        let videoUrl = null;
        let currentPrediction = prediction;

        while (attempts < maxAttempts) {
            // If already completed, use the response
            if (currentPrediction.status === 'succeeded') {
                videoUrl = currentPrediction.output;
                break;
            }

            if (currentPrediction.status === 'failed' || currentPrediction.status === 'canceled') {
                throw new Error(`Kling prediction ${currentPrediction.status}: ${currentPrediction.error || 'Unknown error'}`);
            }

            await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
            attempts++;

            console.log(`Polling attempt ${attempts}...`);

            const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
                headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
            });
            currentPrediction = await pollResponse.json();

            console.log(`Poll result: status=${currentPrediction.status}`);
        }

        if (!videoUrl) {
            throw new Error('Video generation timed out');
        }

        console.log('Video URL from Kling:', videoUrl);

        // Download video from Replicate
        console.log('Downloading video...');
        const videoResponse = await fetch(videoUrl);

        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.status}`);
        }

        const videoBuffer = await videoResponse.buffer();
        console.log('Video downloaded:', videoBuffer.length, 'bytes');

        // Upload to Bunny CDN
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${outputFilename}`;

        console.log('Uploading to Bunny:', outputFilename);
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'video/mp4'
            },
            body: videoBuffer
        });

        if (!uploadResponse.ok && uploadResponse.status !== 201) {
            console.error('Bunny upload failed:', uploadResponse.status);
            return { statusCode: 500, body: JSON.stringify({ error: 'Upload failed' }) };
        }

        const cdnUrl = `https://${BUNNY_CDN_DOMAIN}/${outputFilename}`;
        console.log('✅ SUCCESS! Video at:', cdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, videoUrl: cdnUrl })
        };

    } catch (error) {
        console.error('Background function error:', error.message);
        console.error('Stack:', error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
