/**
 * TEST: Google AI Studio verzija (direktan API)
 * Endpoint: /.netlify/functions/generate-image-google
 * 
 * Ovo je testna verzija koja koristi Google AI Studio API direktno.
 * Jeftinije i pouzdanije od Replicate, ali novi kod.
 * 
 * Environment varijable potrebne:
 * - GOOGLE_AI_API_KEY: API key iz https://aistudio.google.com/apikey
 * - BUNNY_API_KEY: Za upload slika (već postojeća)
 * - BUNNY_STORAGE_ZONE: Storage zona (već postojeća)
 * 
 * Cijena: ~$0.001 per slika (besplatno do 1500/dan)
 * vs Replicate: $0.039 per slika
 */

const fetch = require('node-fetch');
const { getPrompt, templateScenes } = require('./prompts');

exports.handler = async (event, context) => {
  console.log('=== generate-image-google (TEST - Google AI Studio) function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('OPTIONS request - returning CORS headers');
    return { 
      statusCode: 200, 
      headers, 
      body: '' 
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    console.log('Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed',
        receivedMethod: event.httpMethod,
        expectedMethod: 'POST'
      })
    };
  }

  try {
    console.log('Parsing request body...');
    const body = JSON.parse(event.body);
    console.log('Request body parsed. Keys:', Object.keys(body));
    
    const { templateId, image1Url, image2Url, image1, image2, isCouple } = body;

    // Provjeri da li imamo novi format (URL-ovi) ili stari format (base64)
    const hasNewFormat = image1Url && image1Url.startsWith('http');
    const hasOldFormat = image1 && (typeof image1 === 'string' && image1.length > 100);

    console.log('Format detected:', hasNewFormat ? 'NEW (URLs)' : hasOldFormat ? 'LEGACY (base64)' : 'UNKNOWN');

    // Google AI API Key
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    if (!GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'GOOGLE_AI_API_KEY not configured',
          hint: 'Add GOOGLE_AI_API_KEY in Netlify Dashboard → Site settings → Environment variables',
          getKeyAt: 'https://aistudio.google.com/apikey'
        })
      };
    }

    if (!templateId || (!hasNewFormat && !hasOldFormat)) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'Need templateId and either image1Url (URLs) or image1 (base64)'
        })
      };
    }

    // Provjeri template
    if (!templateScenes[templateId]) {
      console.log('Template not found:', templateId);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Template not found',
          availableTemplates: Object.keys(templateScenes)
        })
      };
    }

    // Učitaj prompt
    const prompt = getPrompt(templateId, isCouple);
    console.log('Using prompt for:', templateId, 'isCouple:', isCouple);
    console.log('Prompt length:', prompt.length);

    // Helper funkcija za upload na Bunny.net (ako koristimo stari format)
    const uploadToBunny = async (imageBase64, filename) => {
      const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
      const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
      
      if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
        throw new Error('Bunny.net not configured - check BUNNY_API_KEY and BUNNY_STORAGE_ZONE');
      }

      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
      
      console.log('Uploading to Bunny.net:', uploadUrl.substring(0, 100) + '...');
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'image/jpeg'
        },
        body: imageBuffer
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Bunny.net upload error:', uploadResponse.status, errorText);
        throw new Error(`Bunny.net upload failed (${uploadResponse.status}): ${errorText}`);
      }

      const cdnDomain = process.env.BUNNY_CDN_DOMAIN || 'examples.b-cdn.net';
      const publicUrl = `https://${cdnDomain}/${filename}`;
      console.log('Upload successful, Public URL:', publicUrl);
      return publicUrl;
    };

    // 1. Dobij URL-ove slika
    let finalImage1Url, finalImage2Url;
    
    if (hasNewFormat) {
      // NOVI FORMAT: URL-ovi već postoje
      console.log('Using new format - URLs already provided');
      finalImage1Url = image1Url;
      finalImage2Url = image2Url || null;
      
      // Pričekaj 2 sekunde za CDN propagaciju
      console.log('Waiting 2 seconds for CDN propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // STARI FORMAT: Upload base64 na Bunny.net
      console.log('Using legacy format - uploading base64 images to Bunny.net');
      try {
        const image1Base64 = image1.includes(',') ? image1.split(',')[1] : image1;
        const timestamp = Date.now();
        const userId = `user-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        
        const image1Filename = `temp/${userId}-image1.jpg`;
        finalImage1Url = await uploadToBunny(image1Base64, image1Filename);
        console.log('Image1 uploaded:', finalImage1Url);

        if (!isCouple && image2) {
          const image2Base64 = image2.includes(',') ? image2.split(',')[1] : image2;
          const image2Filename = `temp/${userId}-image2.jpg`;
          finalImage2Url = await uploadToBunny(image2Base64, image2Filename);
          console.log('Image2 uploaded:', finalImage2Url);
        } else {
          finalImage2Url = null;
        }
      } catch (uploadError) {
        console.error('Error uploading to Bunny.net:', uploadError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to upload images to Bunny.net',
            details: uploadError.message
          })
        };
      }
    }

    // 2. Pripremi slike za Google AI (trebaju biti base64)
    const imageUrls = [finalImage1Url];
    if (!isCouple && finalImage2Url) {
      imageUrls.push(finalImage2Url);
    }
    
    // Dodaj logo
    const logoUrl = 'https://examples.b-cdn.net/logo.jpg';
    imageUrls.push(logoUrl);

    console.log('Fetching images to convert to base64 for Google AI...');
    console.log('Images to fetch:', imageUrls.length);
    
    // Google AI zahtijeva base64 format inline_data
    const imageParts = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      try {
        console.log(`Fetching image ${i + 1}/${imageUrls.length}:`, imageUrl.substring(0, 60) + '...');
        const imageResponse = await fetch(imageUrl);
        
        if (!imageResponse.ok) {
          console.error('Failed to fetch image:', imageUrl, 'Status:', imageResponse.status);
          throw new Error(`Failed to fetch image (${imageResponse.status}): ${imageUrl}`);
        }
        
        const imageBuffer = await imageResponse.buffer();
        const base64Image = imageBuffer.toString('base64');
        
        imageParts.push({
          inline_data: {
            mime_type: "image/jpeg",
            data: base64Image
          }
        });
        
        console.log(`✅ Image ${i + 1} converted:`, Math.round(base64Image.length / 1024), 'KB (base64)');
      } catch (err) {
        console.error('Error fetching/converting image:', imageUrl, err);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to fetch and convert image',
            imageUrl: imageUrl,
            details: err.message
          })
        };
      }
    }

    console.log('All images converted to base64, total:', imageParts.length);

    // 3. Google AI API endpoint
    // Koristi gemini-3-pro-image-preview (Nano Banana Pro) za image generation
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;

    // 4. Pripremi request za Google AI
    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          ...imageParts
        ]
      }],
      generationConfig: {
        response_modalities: ["IMAGE"],
        temperature: 0.9,
        image_config: {
          aspect_ratio: "1:1"  // 1:1 za selfie format, number_of_images je 1 po defaultu
        }
      }
    };

    console.log('=== CALLING GOOGLE AI API ===');
    console.log('Model: gemini-3-pro-image-preview (Nano Banana Pro)');
    console.log('Prompt length:', prompt.length);
    console.log('Images count:', imageParts.length);
    console.log('Request parts:', requestBody.contents[0].parts.length);
    
    const googleResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await googleResponse.text();
    console.log('Google AI response status:', googleResponse.status);
    console.log('Google AI response length:', responseText.length);

    if (!googleResponse.ok) {
      console.error('Google AI error response:', responseText.substring(0, 500));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Google AI API error',
          status: googleResponse.status,
          details: responseText.substring(0, 500),
          hint: googleResponse.status === 400 
            ? 'Check if API key is valid and model name is correct'
            : googleResponse.status === 429
            ? 'Rate limit exceeded - try again later or upgrade quota'
            : 'Check Google AI Studio dashboard for more details'
        })
      };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Google AI response:', parseError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from Google AI',
          details: 'Failed to parse JSON response',
          preview: responseText.substring(0, 200)
        })
      };
    }

    console.log('Response parsed successfully');
    console.log('Full response structure:', JSON.stringify(result).substring(0, 1000));

    // 5. Pronađi generiranu sliku - provjeri različite moguće strukture
    const candidate = result.candidates?.[0];
    if (!candidate) {
      console.error('No candidates in response');
      console.log('Full result:', JSON.stringify(result, null, 2).substring(0, 1000));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No candidates in response',
          result: JSON.stringify(result).substring(0, 500)
        })
      };
    }

    console.log('Candidate found:', JSON.stringify(candidate).substring(0, 500));
    console.log('Candidate content:', candidate.content);
    console.log('Candidate parts:', candidate.content?.parts);

    // Provjeri različite moguće strukture
    let imagePart = null;
    let generatedImageBase64 = null;

    // Opcija 1: parts array - provjeri i inlineData (camelCase) i inline_data (snake_case)
    if (candidate.content?.parts) {
      // Provjeri camelCase format (inlineData) - što Google API vraća
      imagePart = candidate.content.parts.find(part => part.inlineData || part.inline_data);
      
      if (imagePart) {
        // Provjeri oba formata
        if (imagePart.inlineData) {
          console.log('Found image in parts[].inlineData (camelCase)');
          generatedImageBase64 = imagePart.inlineData.data;
        } else if (imagePart.inline_data) {
          console.log('Found image in parts[].inline_data (snake_case)');
          generatedImageBase64 = imagePart.inline_data.data;
        }
      }
    }

    // Opcija 2: direktno u candidate (fallback) - provjeri oba formata
    if (!generatedImageBase64) {
      if (candidate.inlineData) {
        console.log('Found image in candidate.inlineData (camelCase)');
        generatedImageBase64 = candidate.inlineData.data;
      } else if (candidate.inline_data) {
        console.log('Found image in candidate.inline_data (snake_case)');
        generatedImageBase64 = candidate.inline_data.data;
      }
    }

    // Opcija 3: Provjeri format i konvertuj ako treba
    if (generatedImageBase64) {
      console.log('Image data found, type:', typeof generatedImageBase64);
      console.log('Image data length:', generatedImageBase64.length || 'N/A');
      console.log('Image data preview:', typeof generatedImageBase64 === 'string' 
        ? generatedImageBase64.substring(0, 50) + '...' 
        : 'Not a string');

      // Ako je Buffer, konvertuj u base64 string
      if (Buffer.isBuffer(generatedImageBase64)) {
        console.log('Data is Buffer, converting to base64 string');
        generatedImageBase64 = generatedImageBase64.toString('base64');
      } 
      // Ako je Uint8Array ili ArrayBuffer, konvertuj u Buffer pa u base64
      else if (generatedImageBase64 instanceof Uint8Array) {
        console.log('Data is Uint8Array, converting to base64 string');
        generatedImageBase64 = Buffer.from(generatedImageBase64).toString('base64');
      }
      else if (generatedImageBase64 instanceof ArrayBuffer) {
        console.log('Data is ArrayBuffer, converting to base64 string');
        generatedImageBase64 = Buffer.from(generatedImageBase64).toString('base64');
      }
      // Ako je string, provjeri da li je već base64
      else if (typeof generatedImageBase64 === 'string') {
        // Ako već počinje sa /9j/ (JPEG magic bytes u base64), već je base64
        if (generatedImageBase64.startsWith('/9j/') || generatedImageBase64.startsWith('iVBORw0KG')) {
          console.log('✅ Data is already base64 string (starts with /9j/ or iVBORw0KG) - using directly!');
          // Već je base64, nema potrebe za konverziju - koristi direktno!
        } else {
          console.log('Data is string but format unclear, assuming it is base64');
        }
      }
      else {
        console.log('Unknown data type, attempting to convert to string');
        generatedImageBase64 = String(generatedImageBase64);
      }
    }

    if (!generatedImageBase64) {
      console.error('❌ No image data found in any expected location');
      
      // Detaljno logiranje strukture za debugging
      if (candidate.content?.parts) {
        console.log('Parts array structure:');
        candidate.content.parts.forEach((part, index) => {
          console.log(`Part ${index}:`, Object.keys(part));
          if (part.inlineData) {
            console.log(`  Part ${index} has inlineData (camelCase):`, typeof part.inlineData.data, part.inlineData.data?.substring(0, 50));
          }
          if (part.inline_data) {
            console.log(`  Part ${index} has inline_data (snake_case):`, typeof part.inline_data.data, part.inline_data.data?.substring(0, 50));
          }
        });
      }
      
      console.log('Full candidate structure:', JSON.stringify(candidate, null, 2).substring(0, 2000));
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'No image generated',
          details: 'Response has candidate but no image data found in expected format',
          candidate: JSON.stringify(candidate).substring(0, 1000),
          hint: 'Check Netlify Function logs for detailed structure analysis'
        })
      };
    }

    console.log('=== ✅ SUCCESS ===');
    console.log('Image generated via Google AI Studio!');
    console.log('Image size:', Math.round(generatedImageBase64.length / 1024), 'KB (base64)');
    console.log('Template:', templateId);
    console.log('Provider: Google AI Studio (direct)');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        image: `data:image/jpeg;base64,${generatedImageBase64}`,
        model: 'gemini-3-pro-image-preview',
        provider: 'Google AI Studio (direct - Nano Banana Pro)',
        templateId: templateId,
        isCouple: isCouple,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('=== ERROR in generate-image-google ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        stack: error.stack?.substring(0, 500),
        timestamp: new Date().toISOString()
      })
    };
  }
};

