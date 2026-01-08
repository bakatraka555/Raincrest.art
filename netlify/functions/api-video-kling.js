const fetch = require('node-fetch');

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
        const { imageUrl, prompt } = body;

        if (!imageUrl) throw new Error('Missing imageUrl');
        if (!prompt) throw new Error('Missing prompt');

        // KLING Model on Replicate
        // NOTE: Replace this with the specific version/model ID if different
        const REPLICATE_MODEL = "kling-ai/kling-v1";
        // const REPLICATE_VERSION = "..."; // Optional if using latest

        const inputData = {
            image: imageUrl,
            prompt: prompt,
            duration: 5,
            cfg_scale: 0.5
        };

        console.log('Starting Kling generation...', inputData);

        const response = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ input: inputData })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Replicate API Error: ${response.status} ${errText}`);
        }

        const prediction = await response.json();
        console.log('Kling prediction started:', prediction.id);

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
