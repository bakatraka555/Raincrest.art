/**
 * Netlify Background Function: generate-image-nano-kling-background
 * 
 * FACE-FIRST HIGH-FIDELITY PIPELINE
 * 
 * Step 1: Face Detection (Gemini 1.5 Pro Vision)
 * Step 2: Smart Crop (Sharp) with 20% margin
 * Step 3: Style Transfer (Nano Banana Pro on Replicate)
 * Step 4: Animation (Kling 2.6 on Replicate)
 * 
 * This solves the "melting face" issue by:
 * - Cropping face from ORIGINAL high-res image
 * - Sending ONLY the high-quality face to Nano Banana
 * - Kling receives already-transformed image (no mid-video morphing)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch');
const sharp = require('sharp');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
    // Nano Banana Pro on Replicate
    nanoBananaModel: 'fofr/nano-banana:latest',

    // Kling 2.6 on Replicate
    klingModel: 'kwaivgi/kling-v2.6',
    klingDuration: 5,
    klingAspectRatio: '9:16',

    // Face crop margin (percentage to add around detected face)
    faceMargin: 0.20
};
// ============================================================================

exports.handler = async (event, context) => {
    console.log('=== FACE-FIRST PIPELINE STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender, jobId, outputFilename } = body;

        console.log('Job:', jobId);
        console.log('Template:', templateId);
        console.log('Gender:', gender);

        // Validation
        if (!imageUrl || !jobId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing parameters' }) };
        }

        // Environment variables
        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
        const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
        const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'raincrest-art';
        const BUNNY_CDN_DOMAIN = process.env.BUNNY_CDN_DOMAIN || 'raincrest-cdn.b-cdn.net';

        if (!GOOGLE_AI_API_KEY || !REPLICATE_API_TOKEN || !BUNNY_API_KEY) {
            console.error('Missing API keys');
            return { statusCode: 500, body: JSON.stringify({ error: 'API keys not configured' }) };
        }

        // =====================================================================
        // STEP 1: Fetch Original Image
        // =====================================================================
        console.log('STEP 1: Fetching original image...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        console.log('Image fetched:', imageBuffer.length, 'bytes');

        // Get image dimensions
        const metadata = await sharp(imageBuffer).metadata();
        console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

        // =====================================================================
        // STEP 2: Face Detection with Gemini 1.5 Pro
        // =====================================================================
        console.log('STEP 2: Detecting face with Gemini 1.5 Pro...');
        const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        const facePrompt = `Analyze this image and find the main human face.
Return ONLY a JSON object with the face bounding box coordinates as pixel values.
Format: {"ymin": number, "xmin": number, "ymax": number, "xmax": number}
These should be the pixel coordinates of the face region.
Return ONLY the JSON, no other text or explanation.`;

        const imageBase64 = imageBuffer.toString('base64');
        const geminiResult = await model.generateContent([
            facePrompt,
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageBase64
                }
            }
        ]);

        const responseText = geminiResult.response.text().trim();
        console.log('Gemini response:', responseText);

        // Parse face coordinates
        let faceBox;
        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                faceBox = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseError) {
            console.warn('Failed to parse face coordinates, using center crop fallback');
            // Fallback: center crop (assuming face is in upper-middle)
            faceBox = {
                ymin: Math.round(metadata.height * 0.05),
                xmin: Math.round(metadata.width * 0.2),
                ymax: Math.round(metadata.height * 0.7),
                xmax: Math.round(metadata.width * 0.8)
            };
        }

        console.log('Face box (pixels):', faceBox);

        // =====================================================================
        // STEP 3: Smart Crop with Sharp (+20% margin)
        // =====================================================================
        console.log('STEP 3: Cropping face with 20% margin...');

        // Calculate dimensions with margin
        const faceWidth = faceBox.xmax - faceBox.xmin;
        const faceHeight = faceBox.ymax - faceBox.ymin;
        const marginX = Math.round(faceWidth * CONFIG.faceMargin);
        const marginY = Math.round(faceHeight * CONFIG.faceMargin);

        // Apply margin (ensure within bounds)
        const cropX = Math.max(0, faceBox.xmin - marginX);
        const cropY = Math.max(0, faceBox.ymin - marginY);
        const cropWidth = Math.min(faceWidth + marginX * 2, metadata.width - cropX);
        const cropHeight = Math.min(faceHeight + marginY * 2, metadata.height - cropY);

        console.log(`Crop region: x=${cropX}, y=${cropY}, w=${cropWidth}, h=${cropHeight}`);

        const croppedBuffer = await sharp(imageBuffer)
            .extract({
                left: cropX,
                top: cropY,
                width: cropWidth,
                height: cropHeight
            })
            .jpeg({ quality: 95 })
            .toBuffer();

        console.log('Face cropped:', croppedBuffer.length, 'bytes');

        // Upload cropped face to Bunny (needed for Replicate)
        const faceFilename = `faces/face-${jobId}.jpg`;
        const faceUploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${faceFilename}`;

        await fetch(faceUploadUrl, {
            method: 'PUT',
            headers: { 'AccessKey': BUNNY_API_KEY, 'Content-Type': 'image/jpeg' },
            body: croppedBuffer
        });

        const faceCdnUrl = `https://${BUNNY_CDN_DOMAIN}/${faceFilename}`;
        console.log('Face uploaded to:', faceCdnUrl);

        // =====================================================================
        // STEP 4: Style Transfer with Nano Banana Pro
        // =====================================================================
        console.log('STEP 4: Transforming with Nano Banana Pro...');

        const targetRole = gender === 'queen' ? 'Game of Thrones Queen' : 'Game of Thrones King';
        const nanoBananaPrompt = `Transform this person into a powerful ${targetRole}. Heavy black metal armor, fur cloak, Dubrovnik walls background, golden hour sunset lighting, 4K, cinematic HBO quality, photorealistic. PRESERVE THE FACE IDENTITY 100%.`;

        // Start Nano Banana prediction
        const nanoResponse = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: 'faba1d95b0a1c6c3586cd9cd5e4ccebca1bbf7c9a12e5e33e0bde4f1d13fd902', // Nano Banana Pro
                input: {
                    image: faceCdnUrl,
                    prompt: nanoBananaPrompt,
                    negative_prompt: 'ugly, deformed, blurry, different person, wrong face, distorted features',
                    guidance_scale: 7.5,
                    num_inference_steps: 50
                }
            })
        });

        const nanoPrediction = await nanoResponse.json();
        console.log('Nano Banana started:', nanoPrediction.id);

        // Poll for Nano Banana completion
        let nanoOutput = null;
        for (let i = 0; i < 60; i++) { // Max 2 minutes
            await new Promise(r => setTimeout(r, 2000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${nanoPrediction.id}`, {
                headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
            });
            const status = await statusResponse.json();

            if (status.status === 'succeeded') {
                nanoOutput = status.output;
                break;
            } else if (status.status === 'failed') {
                throw new Error('Nano Banana failed: ' + status.error);
            }
        }

        if (!nanoOutput) {
            throw new Error('Nano Banana timed out');
        }

        const transformedImageUrl = Array.isArray(nanoOutput) ? nanoOutput[0] : nanoOutput;
        console.log('Transformed image:', transformedImageUrl);

        // Download and re-upload to Bunny (for Kling)
        const transformedResponse = await fetch(transformedImageUrl);
        const transformedBuffer = Buffer.from(await transformedResponse.arrayBuffer());

        const transformedFilename = `generated/transformed-${jobId}.jpg`;
        const transformedUploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${transformedFilename}`;

        await fetch(transformedUploadUrl, {
            method: 'PUT',
            headers: { 'AccessKey': BUNNY_API_KEY, 'Content-Type': 'image/jpeg' },
            body: transformedBuffer
        });

        const transformedCdnUrl = `https://${BUNNY_CDN_DOMAIN}/${transformedFilename}`;
        console.log('Transformed uploaded to:', transformedCdnUrl);

        // =====================================================================
        // STEP 5: Animation with Kling 2.6
        // =====================================================================
        console.log('STEP 5: Animating with Kling 2.6...');

        const klingPrompt = `Subtle cinematic animation. Gentle hair movement in breeze. Slight chest breathing. Eyes shift naturally. Majestic royal presence. Remain still and regal. No drastic movements.`;

        const klingResponse = await fetch(
            `https://api.replicate.com/v1/models/${CONFIG.klingModel}/predictions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    input: {
                        start_image: transformedCdnUrl,
                        prompt: klingPrompt,
                        duration: CONFIG.klingDuration,
                        aspect_ratio: CONFIG.klingAspectRatio,
                        mode: 'professional',
                        negative_prompt: 'face morphing, face melting, distorted face, different person'
                    }
                })
            }
        );

        const klingPrediction = await klingResponse.json();
        console.log('Kling started:', klingPrediction.id);

        // Poll for Kling completion
        let videoUrl = null;
        for (let i = 0; i < 180; i++) { // Max 6 minutes
            await new Promise(r => setTimeout(r, 2000));

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${klingPrediction.id}`, {
                headers: { 'Authorization': `Bearer ${REPLICATE_API_TOKEN}` }
            });
            const status = await statusResponse.json();

            if (status.status === 'succeeded') {
                videoUrl = status.output;
                break;
            } else if (status.status === 'failed') {
                throw new Error('Kling failed: ' + status.error);
            }

            if (i % 15 === 0) console.log(`Kling rendering... (${i * 2}s)`);
        }

        if (!videoUrl) {
            throw new Error('Kling timed out');
        }

        console.log('Video generated:', videoUrl);

        // Download and upload video to Bunny
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        const videoFilename = outputFilename || `videos/facefirst-${jobId}.mp4`;
        const videoUploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${videoFilename}`;

        await fetch(videoUploadUrl, {
            method: 'PUT',
            headers: { 'AccessKey': BUNNY_API_KEY, 'Content-Type': 'video/mp4' },
            body: videoBuffer
        });

        const videoCdnUrl = `https://${BUNNY_CDN_DOMAIN}/${videoFilename}`;
        console.log('✅ FACE-FIRST PIPELINE COMPLETE!');
        console.log('Video at:', videoCdnUrl);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                videoUrl: videoCdnUrl,
                transformedImageUrl: transformedCdnUrl,
                faceUrl: faceCdnUrl
            })
        };

    } catch (error) {
        console.error('Pipeline error:', error.message);
        console.error('Stack:', error.stack);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
