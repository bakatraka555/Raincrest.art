const fetch = require('node-fetch');
const { getPrompt } = require('./prompts');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender, customPrompt, aspectRatio } = body;

        // 1. Generate Prompt
        // If user provided a custom prompt (from Playground), use it. otherwise generate from ID.
        let prompt;
        if (customPrompt && customPrompt.trim().length > 0) {
            prompt = customPrompt;
            console.log('Using Custom Prompt:', prompt.substring(0, 50) + '...');
        } else {
            prompt = getPrompt(templateId, isCouple, gender);
            console.log('Generated Template Prompt:', prompt.substring(0, 50) + '...');
        }

        // 2. Prepare Input for Replicate (Google Nano Banana Pro)
        // Model ID: google/nano-banana-pro (Equivalent to gemini-3-pro-image-preview)
        const REPLICATE_MODEL = "google/nano-banana-pro";
        const REPLICATE_VERSION = "a02106e23b2c93845b467611j867823f6e897918342s6789"; // Placeholder version, usually usually latest is auto-picked but good to check. 
        // Actually for 'google/nano-banana-pro' we often just use the model string in the URL for the new API standard.
        // The previous code used `v1/models/${REPLICATE_MODEL}/predictions` which is correct.

        const inputData = {
            prompt: prompt,
            image_input: [imageUrl], // Single reference image for now
            negative_prompt: "cartoon, confusing, blurry, watermark, low quality, deformed, ugly, bad anatomy",
            num_inference_steps: 30,
            guidance_scale: 7.5,
            disable_safety_checker: true,
            aspect_ratio: aspectRatio || "9:16" // Default 9:16 for social media (vertical)
        };

        // Add logo if needed, but for raw image test maybe we want clean image? 
        // Let's stick to the prompt's request which might expect it.
        // For now, let's keep it simple: Just the user image.

        // 3. Call Replicate
        const response = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: inputData })
        });

        if (!response.ok) {
            throw new Error(`Replicate API Error: ${response.status} ${await response.text()}`);
        }

        const prediction = await response.json();

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(prediction)
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
