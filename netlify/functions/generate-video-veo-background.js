/**
 * Netlify Background Function: generate-video-veo-background
 * 
 * Uses Google Veo 3.1 API to generate video from image
 * Background function = up to 15 minutes execution time
 * 
 * Uses REST API format based on Google documentation
 * Now supports dynamic video prompts from prompts.js
 * 
 * COST CONFIGURATION:
 * - Fast + Audio: $0.15/sec = $1.20 per 8s video
 * - Fast no Audio: $0.10/sec = $0.80 per 8s video  
 * - Standard + Audio: $0.40-0.75/sec = $3.20-$6.00 per 8s video
 */

const fetch = require('node-fetch');
const { getVideoPrompt } = require('./prompts');

// ============================================================================
// CONFIGURATION - Change these to control quality vs cost
// ============================================================================
const VEO_CONFIG = {
    // Model options for GEMINI API:
    //   - 'veo-3.1-generate-preview' (standard ~$6/video)
    //   - 'veo-3.1-fast-generate-preview' (fast ~$1.20/video)
    model: 'veo-3.1-fast-generate-preview',

    // Audio: true = with audio ($0.15/sec), false = no audio ($0.10/sec)
    generateAudio: true,

    // Duration: 5-10 seconds
    durationSeconds: 8,

    // Aspect ratio: "9:16" (vertical), "16:9" (horizontal), "1:1" (square)
    defaultAspectRatio: '9:16'
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== generate-video-veo-background STARTED ===');

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

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY || !BUNNY_API_KEY) {
            console.error('Missing API keys');
            return { statusCode: 500, body: JSON.stringify({ error: 'API keys not configured' }) };
        }

        // Fetch source image
        console.log('Fetching source image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const imageMimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Start Veo video generation using predictLongRunning endpoint
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${VEO_CONFIG.model}:predictLongRunning`;

        // Request body - using instances format with image
        // IMPORTANT: Gemini API supports: aspectRatio, negativePrompt
        const requestBody = {
            instances: [{
                prompt: videoPrompt,
                image: {
                    bytesBase64Encoded: imageBase64,
                    mimeType: imageMimeType
                }
            }],
            parameters: {
                aspectRatio: VEO_CONFIG.defaultAspectRatio
                // Note: Audio is automatically included in Veo 3.1
            }
        };

        console.log('VEO CONFIG:', JSON.stringify(VEO_CONFIG));

        console.log('Starting Veo video generation with predictLongRunning...');
        const veoResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GOOGLE_AI_API_KEY
            },
            body: JSON.stringify(requestBody)
        });

        const veoResult = await veoResponse.json();
        console.log('Veo response status:', veoResponse.status);
        console.log('Veo response:', JSON.stringify(veoResult).substring(0, 500));

        if (!veoResponse.ok) {
            console.error('Veo API error:', JSON.stringify(veoResult));
            return { statusCode: 500, body: JSON.stringify({ error: 'Veo API error', details: veoResult }) };
        }

        // Get operation name for polling
        const operationName = veoResult.name;
        if (!operationName) {
            console.error('No operation name returned:', veoResult);
            return { statusCode: 500, body: JSON.stringify({ error: 'No operation name', result: veoResult }) };
        }
        console.log('Operation started:', operationName);

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes max (60 * 10s)
        let videoUri = null;

        while (attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 10000)); // Wait 10 seconds
            attempts++;

            console.log(`Polling attempt ${attempts}...`);

            const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}`;
            const pollResponse = await fetch(pollUrl, {
                headers: { 'x-goog-api-key': GOOGLE_AI_API_KEY }
            });
            const pollResult = await pollResponse.json();

            console.log(`Poll result:`, JSON.stringify(pollResult).substring(0, 300));

            if (pollResult.done) {
                console.log('Video generation completed!');

                // Try different response formats
                if (pollResult.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                    videoUri = pollResult.response.generateVideoResponse.generatedSamples[0].video.uri;
                } else if (pollResult.response?.generatedVideos?.[0]?.video?.uri) {
                    videoUri = pollResult.response.generatedVideos[0].video.uri;
                } else if (pollResult.error) {
                    throw new Error(`Veo error: ${JSON.stringify(pollResult.error)}`);
                }

                if (videoUri) break;

                console.error('Could not find video URI in response:', JSON.stringify(pollResult));
                throw new Error('Video URI not found in response');
            }
        }

        if (!videoUri) {
            throw new Error('Video generation timed out');
        }

        console.log('Video URI:', videoUri);

        // Download video from Google
        console.log('Downloading video...');
        const videoResponse = await fetch(videoUri, {
            headers: { 'x-goog-api-key': GOOGLE_AI_API_KEY },
            redirect: 'follow'
        });

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
