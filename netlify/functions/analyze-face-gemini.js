/**
 * Netlify Function: analyze-face-gemini
 * 
 * Uses Gemini 1.5 Pro to analyze tourist photo and generate
 * an optimized prompt for Imagen 3 transformation.
 * 
 * This is the "brain" that creates personalized prompts
 * based on actual facial features.
 */

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    console.log('=== analyze-face-gemini STARTED ===');

    try {
        const body = JSON.parse(event.body || '{}');
        const { imageUrl, templateId, isCouple, gender } = body;

        console.log('Analyzing face for template:', templateId);

        // Validation
        if (!imageUrl) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing imageUrl' }) };
        }

        const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
        if (!GOOGLE_AI_API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
        }

        // Fetch and convert image to base64
        console.log('Fetching image for analysis...');
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        const imageBuffer = await imageResponse.buffer();
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Build the analysis prompt
        const genderText = isCouple ? 'KING and QUEEN' : (gender === 'queen' ? 'QUEEN' : 'KING');

        const analysisSystemPrompt = `You are a professional portrait photographer and digital artist specializing in Game of Thrones style transformations.

TASK: Analyze this tourist photo and create a detailed transformation prompt for Imagen 3 that will:
1. PRESERVE the exact facial features of the person(s)
2. Transform them into ${genderText} on the walls of Dubrovnik
3. Add Game of Thrones aesthetic elements

OUTPUT FORMAT:
Return ONLY the transformation prompt, starting with "Transform the person in [1] into...".
Include specific details about:
- Facial features to preserve (face shape, nose, eyes, etc.)
- Medieval royal attire (heavy armor, crown, fur cloak)
- Dubrovnik/King's Landing setting
- Golden hour lighting
- Sharp focus on face with defined edges`;

        // Call Gemini 1.5 Pro for analysis
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_AI_API_KEY}`;

        const geminiRequest = {
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: imageBase64
                        }
                    },
                    {
                        text: analysisSystemPrompt
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024
            }
        };

        console.log('Calling Gemini 1.5 Pro for face analysis...');
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiRequest)
        });

        const geminiResult = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('Gemini API error:', JSON.stringify(geminiResult));
            return { statusCode: 500, body: JSON.stringify({ error: 'Gemini analysis failed', details: geminiResult }) };
        }

        // Extract the generated prompt
        const analysisText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!analysisText) {
            console.error('No analysis in response');
            return { statusCode: 500, body: JSON.stringify({ error: 'No analysis generated' }) };
        }

        console.log('Face analysis completed!');
        console.log('Generated prompt:', analysisText.substring(0, 200));

        // Track token usage for cost monitoring
        const usageMetadata = geminiResult.usageMetadata || {};
        console.log('Tokens used:', usageMetadata.totalTokenCount || 'unknown');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                success: true,
                faceAnalysis: analysisText,
                tokensUsed: usageMetadata.totalTokenCount
            })
        };

    } catch (error) {
        console.error('Function error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
