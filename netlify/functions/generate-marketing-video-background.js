/**
 * Generate Marketing Video - Background Function
 * 
 * Generates transformation videos for social media platforms
 * Uses Veo 3.1 for video generation
 */

const fetch = require('node-fetch');

const VEO_MODEL = 'veo-3.1-generate-preview';

// Platform-specific prompts
const platformPrompts = {
    instagramReels: {
        aspectRatio: '9:16',
        duration: 8,
        prompt: `8 second vertical transformation video (9:16 aspect ratio) for Instagram Reels:

SCENE 1 (0-2s): Original photo displayed with subtle glow effect. Ethereal particles start appearing.

SCENE 2 (2-5s): Magical transformation begins. Golden energy swirls around the image. Epic whoosh sound.

SCENE 3 (5-8s): Dramatic reveal of the royal portrait. Slow zoom out. Crown sparkles. Majestic atmosphere.

Add golden "RAINCREST.ART" watermark in bottom right corner.
Cinematic, epic, Game of Thrones style. Vertical mobile format.
Dramatic orchestral score.`
    },

    tiktok: {
        aspectRatio: '9:16',
        duration: 8,
        prompt: `8 second viral TikTok transformation video (9:16 vertical):

Quick, punchy, attention-grabbing:

SCENE 1 (0-1s): Flash of original tourist photo. "Wait for it..." vibe.

SCENE 2 (1-4s): DRAMATIC transformation with flash and particles. Screen shake effect. Epic bass drop moment.

SCENE 3 (4-7s): REVEAL the epic royal portrait. Zoom effect. Dragon shadow passes.

SCENE 4 (7-8s): Quick logo flash "RAINCREST.ART"

Energy: High, viral, shareable. Sound design: Epic bass, whoosh, impact.
Vertical 9:16 format.`
    },

    youtubeShorts: {
        aspectRatio: '9:16',
        duration: 8,
        prompt: `8 second YouTube Shorts transformation (9:16 vertical):

Cinematic quality, slightly slower pacing:

SCENE 1 (0-2s): Elegant reveal of original photo in a magical frame.

SCENE 2 (2-5s): Transformation sequence with detailed magical particles. Fire and light elements.

SCENE 3 (5-8s): Majestic reveal of royal portrait. Camera slowly pulls back. Epic grandeur.

"RAINCREST.ART" watermark in corner.
High production value, cinematic, YouTube-worthy quality.`
    },

    facebookVideo: {
        aspectRatio: '1:1',
        duration: 8,
        prompt: `8 second square Facebook video (1:1 aspect ratio):

Split-screen style transformation:

Left side: Original tourist photo
Right side: Empty, then reveals to royal portrait

Animated golden divider line moves from left to right, revealing the transformation progressively.

Text overlay: "From Tourist to Royalty"
End: Logo "RAINCREST.ART" centered

Clean, professional, Facebook-friendly. Square 1:1 format.`
    }
};

exports.handler = async function (event, context) {
    console.log('Marketing video generation started');

    try {
        const body = JSON.parse(event.body || '{}');
        const { beforeImageUrl, afterImageUrl, platform, jobId } = body;

        console.log('Job:', jobId);
        console.log('Platform:', platform);
        console.log('Before Image:', beforeImageUrl?.substring(0, 50));
        console.log('After Image:', afterImageUrl?.substring(0, 50));

        // Validation
        if (!afterImageUrl || !platform || !jobId) {
            console.error('Missing parameters');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing parameters: afterImageUrl, platform, jobId required' })
            };
        }

        const platformConfig = platformPrompts[platform];
        if (!platformConfig) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Unknown platform: ${platform}` })
            };
        }

        const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
        if (!GOOGLE_API_KEY) {
            console.error('Missing GOOGLE_AI_API_KEY');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        // Fetch the after image and convert to base64
        console.log('Fetching after image...');
        const imageResponse = await fetch(afterImageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');

        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const imageMimeType = contentType.split(';')[0];

        console.log(`Image fetched: ${imageBuffer.length} bytes, ${imageMimeType}`);

        // Veo API endpoint
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning?key=${GOOGLE_API_KEY}`;

        // Build the prompt with before/after context
        const fullPrompt = platformConfig.prompt + `

IMPORTANT: The input image shows the AFTER transformation result (royal portrait).
Create a video showing the magical transformation TO this result.
The video should end with this royal portrait clearly visible.`;

        // Request body
        const requestBody = {
            instances: [{
                prompt: fullPrompt,
                image: {
                    bytesBase64Encoded: imageBase64,
                    mimeType: imageMimeType
                }
            }],
            parameters: {
                aspectRatio: platformConfig.aspectRatio,
                sampleCount: 1
            }
        };

        console.log('Calling Veo API...');
        console.log('Aspect Ratio:', platformConfig.aspectRatio);

        const veoResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseText = await veoResponse.text();
        console.log('Veo response status:', veoResponse.status);

        if (!veoResponse.ok) {
            console.error('Veo API error:', responseText);
            throw new Error(`Veo API error: ${veoResponse.status}`);
        }

        const veoResult = JSON.parse(responseText);
        const operationName = veoResult.name;

        if (!operationName) {
            throw new Error('No operation name returned from Veo');
        }

        console.log('Operation started:', operationName);

        // Poll for completion
        const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${GOOGLE_API_KEY}`;
        let videoData = null;
        const maxAttempts = 60; // 5 minutes max

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds

            console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);

            const pollResponse = await fetch(pollUrl);
            const pollResult = await pollResponse.json();

            if (pollResult.done) {
                console.log('Video generation complete!');

                if (pollResult.response?.generatedSamples?.[0]?.video?.uri) {
                    videoData = {
                        uri: pollResult.response.generatedSamples[0].video.uri,
                        mimeType: 'video/mp4'
                    };
                } else if (pollResult.response?.generatedSamples?.[0]?.video?.bytesBase64Encoded) {
                    videoData = {
                        base64: pollResult.response.generatedSamples[0].video.bytesBase64Encoded,
                        mimeType: 'video/mp4'
                    };
                }
                break;
            }

            if (pollResult.error) {
                throw new Error(`Veo error: ${pollResult.error.message}`);
            }
        }

        if (!videoData) {
            throw new Error('Video generation timed out or failed');
        }

        // Upload to Bunny
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        const timestamp = Date.now();
        const videoFilename = `marketing/${platform}_${jobId}_${timestamp}.mp4`;

        let videoBuffer;
        if (videoData.uri) {
            const videoResponse = await fetch(videoData.uri);
            videoBuffer = await videoResponse.buffer();
        } else if (videoData.base64) {
            videoBuffer = Buffer.from(videoData.base64, 'base64');
        }

        console.log(`Uploading video to Bunny: ${videoFilename}`);

        const bunnyUploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${videoFilename}`;
        const bunnyResponse = await fetch(bunnyUploadUrl, {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'video/mp4'
            },
            body: videoBuffer
        });

        if (!bunnyResponse.ok) {
            throw new Error(`Bunny upload failed: ${bunnyResponse.status}`);
        }

        const videoUrl = `https://${BUNNY_CDN_DOMAIN}/${videoFilename}`;
        console.log('Video uploaded:', videoUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                jobId,
                platform,
                videoUrl,
                duration: platformConfig.duration,
                aspectRatio: platformConfig.aspectRatio
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
