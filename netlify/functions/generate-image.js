/**
 * Netlify Function za generiranje slike preko Replicate API
 * 
 * Prima (NOVI FORMAT - preporučeno):
 * - templateId: ID templatea
 * - image1Url: URL slike na Bunny.net (ili base64 za backward compatibility)
 * - image2Url: URL slike na Bunny.net (opciono, ako nije couple)
 * - isCouple: boolean - da li je 1 slika s parom ili 2 odvojene
 * 
 * Prima (STARI FORMAT - backward compatibility):
 * - templateId: ID templatea
 * - image1: Base64 encoded muško lice (ili couple image)
 * - image2: Base64 encoded žensko lice (opciono, ako nije couple)
 * - isCouple: boolean - da li je 1 slika s parom ili 2 odvojene
 * 
 * Vraća:
 * - predictionId: ID prediction-a za polling
 * - status: status prediction-a
 */

const fetch = require('node-fetch');
const { getPrompt } = require('./prompts');

exports.handler = async (event, context) => {
  // Log svaki poziv funkcije
  console.log('=== generate-image function called ===');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Has body:', !!event.body);
  
  // CORS headers
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
        message: 'This function only accepts POST requests',
        receivedMethod: event.httpMethod,
        expectedMethod: 'POST',
        functionName: 'generate-image',
        path: event.path
      })
    };
  }

  try {
    console.log('Parsing request body...');
    const body = JSON.parse(event.body);
    console.log('Request body parsed. Keys:', Object.keys(body));
    console.log('Has templateId:', !!body.templateId);
    console.log('Has image1Url:', !!body.image1Url);
    console.log('Has image1 (legacy):', !!body.image1);
    console.log('Has image2Url:', !!body.image2Url);
    console.log('Has image2 (legacy):', !!body.image2);
    console.log('isCouple:', body.isCouple);
    
    const { templateId, image1Url, image2Url, image1, image2, isCouple } = body;

    // Provjeri da li imamo novi format (URL-ovi) ili stari format (base64)
    const hasNewFormat = image1Url && image1Url.startsWith('http');
    const hasOldFormat = image1 && (typeof image1 === 'string' && image1.length > 100);

    if (!templateId || (!hasNewFormat && !hasOldFormat)) {
      console.log('Missing required parameters');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters',
          details: 'Need either image1Url (new format) or image1 (base64, legacy format)'
        })
      };
    }
    
    console.log('Format detected:', hasNewFormat ? 'NEW (URLs)' : 'LEGACY (base64)');
    console.log('All parameters present, proceeding...');

    const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!REPLICATE_API_TOKEN) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' })
      };
    }

    // Učitaj model iz environment varijable (može se mijenjati bez promjene koda)
    const REPLICATE_MODEL = process.env.REPLICATE_MODEL || 'google/nano-banana-pro'; // Fallback na pro verziju
    console.log('Using Replicate model:', REPLICATE_MODEL);

    // Učitaj template database za prompt
    const templates = require('../../docs/couples-templates-database.json');
    const template = templates.templates.find(t => t.id === templateId);
    
    if (!template) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Template not found' })
      };
    }

    // Učitaj prompt iz MD filea
    const prompt = getPrompt(template.id, isCouple);
    console.log('Using prompt from MD file for:', template.id, 'isCouple:', isCouple);

    // Helper funkcija za upload na Bunny.net
    const uploadToBunny = async (imageBase64, filename) => {
      const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
      const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
      
      console.log('Bunny.net config check:', { 
        hasApiKey: !!BUNNY_API_KEY, 
        hasStorageZone: !!BUNNY_STORAGE_ZONE,
        storageZone: BUNNY_STORAGE_ZONE ? BUNNY_STORAGE_ZONE.substring(0, 10) + '...' : 'missing',
        apiKeyLength: BUNNY_API_KEY ? BUNNY_API_KEY.length : 0
      });
      
      if (!BUNNY_API_KEY || !BUNNY_STORAGE_ZONE) {
        console.error('Bunny.net config missing:', { 
          hasApiKey: !!BUNNY_API_KEY, 
          hasStorageZone: !!BUNNY_STORAGE_ZONE 
        });
        throw new Error('Bunny.net API not configured - check BUNNY_API_KEY and BUNNY_STORAGE_ZONE environment variables in Netlify Dashboard');
      }

      try {
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const uploadUrl = `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filename}`;
        
        console.log('Uploading to Bunny.net:', uploadUrl.substring(0, 100) + '...');
        console.log('File size:', imageBuffer.length, 'bytes');
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': BUNNY_API_KEY,
            'Content-Type': 'image/jpeg'
          },
          body: imageBuffer
        });

        const responseText = await uploadResponse.text();
        
        if (!uploadResponse.ok) {
          console.error('Bunny.net upload error:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: responseText,
            url: uploadUrl.substring(0, 80) + '...',
            headers: {
              hasAccessKey: !!BUNNY_API_KEY,
              accessKeyLength: BUNNY_API_KEY.length
            }
          });
          
          if (uploadResponse.status === 401) {
            throw new Error('Bunny.net 401 Unauthorized - check BUNNY_API_KEY and BUNNY_STORAGE_ZONE in Netlify Environment Variables. Make sure API key is correct and Storage Zone name matches exactly.');
          }
          
          throw new Error(`Bunny.net upload failed (${uploadResponse.status}): ${responseText}`);
        }

        // Koristi CDN URL (Pull Zone) - Storage Zone nije javno dostupan bez autentifikacije
        // Format: https://{cdn-domain}/{filename}
        // Default CDN domain: examples.b-cdn.net (ako nije postavljen BUNNY_CDN_DOMAIN env var)
        const cdnDomain = process.env.BUNNY_CDN_DOMAIN || 'examples.b-cdn.net';
        const publicUrl = `https://${cdnDomain}/${filename}`;
        console.log('Upload successful, Public URL:', publicUrl);
        return publicUrl;
      } catch (error) {
        console.error('Error in uploadToBunny:', error);
        throw error;
      }
    };

    // 1. Dobij URL-ove slika - novi format ili stari (upload na Bunny.net)
    let finalImage1Url, finalImage2Url;
    
    if (hasNewFormat) {
      // NOVI FORMAT: URL-ovi već postoje, koristi direktno
      console.log('Using new format - URLs already provided');
      finalImage1Url = image1Url;
      finalImage2Url = image2Url || null;
      
      console.log('Image1 URL:', finalImage1Url.substring(0, 80) + '...');
      if (finalImage2Url) {
        console.log('Image2 URL:', finalImage2Url.substring(0, 80) + '...');
      }
      
      // Pričekaj 2 sekunde da CDN propagira
      // Bunny.net CDN može vratiti 403 na HEAD request, ali slika je dostupna za Replicate
      console.log('Waiting 2 seconds for CDN propagation...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      // STARI FORMAT: Upload base64 slika na Bunny.net
      console.log('Using legacy format - uploading base64 images to Bunny.net');
      try {
        const image1Base64 = image1.includes(',') ? image1.split(',')[1] : image1;
        const timestamp = Date.now();
        const userId = `user-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('Uploading image1 to Bunny.net...');
        const image1Filename = `temp/${userId}-image1.jpg`;
        finalImage1Url = await uploadToBunny(image1Base64, image1Filename);
        console.log('Image1 uploaded to Bunny.net:', finalImage1Url);

        if (!isCouple && image2) {
          const image2Base64 = image2.includes(',') ? image2.split(',')[1] : image2;
          console.log('Uploading image2 to Bunny.net...');
          const image2Filename = `temp/${userId}-image2.jpg`;
          finalImage2Url = await uploadToBunny(image2Base64, image2Filename);
          console.log('Image2 uploaded to Bunny.net:', finalImage2Url);
        } else {
          finalImage2Url = null;
        }
      } catch (uploadError) {
        console.error('Error uploading images to Bunny.net:', uploadError);
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

    // Logo URL (već je na Bunny.net)
    const logoUrl = 'https://examples.b-cdn.net/logo.jpg';

    // Provjeri da li su URL-ovi valjani prije slanja Replicate-u
    console.log('🔍 Validating image URLs before sending to Replicate...');
    console.log('Image1 URL:', finalImage1Url);
    console.log('Image2 URL:', finalImage2Url || 'N/A');
    console.log('Logo URL:', logoUrl);
    
    // Provjeri da li su URL-ovi HTTP(S) linkovi
    if (!finalImage1Url || !finalImage1Url.startsWith('http')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid image1 URL',
          details: `Image1 URL must be a valid HTTP(S) URL. Received: ${finalImage1Url}`
        })
      };
    }
    
    if (!isCouple && finalImage2Url && !finalImage2Url.startsWith('http')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid image2 URL',
          details: `Image2 URL must be a valid HTTP(S) URL. Received: ${finalImage2Url}`
        })
      };
    }

    // Pripremi image_input array (kao u tvom uspješnom primjeru)
    const imageInput = [finalImage1Url];
    if (!isCouple && finalImage2Url) {
      imageInput.push(finalImage2Url);
    }
    imageInput.push(logoUrl); // Logo je uvijek zadnji
    
    console.log('✅ Image URLs validated. image_input array:', imageInput);

    // Pozovi Replicate API s URL-ovima (prema službenom primjeru)
    const inputData = {
      prompt: prompt,
      image_input: imageInput  // Array: [couple_image, logo] ili [male_image, female_image, logo]
      // NOTE: google/nano-banana ne podržava 'aspect_ratio', 'output_format', 'resolution', 'safety_filter_level'
    };

    console.log('Calling Replicate API with:', {
      templateId,
      isCouple,
      hasImage2: !!finalImage2Url,
      image1Url: finalImage1Url.substring(0, 50) + '...',
      image2Url: finalImage2Url ? finalImage2Url.substring(0, 50) + '...' : null,
      logoUrl: logoUrl,
      promptLength: prompt.length,
      format: hasNewFormat ? 'NEW' : 'LEGACY'
    });

    console.log('=== FULL INPUT DATA FOR REPLICATE ===');
    console.log('Prompt:', inputData.prompt);
    console.log('Prompt length:', inputData.prompt.length);
    console.log('Image input count:', inputData.image_input.length);
    console.log('Image input URLs:', inputData.image_input);
    console.log('Full inputData object:', JSON.stringify(inputData, null, 2));
    console.log('=== END INPUT DATA ===');

    // Replicate API poziv (bez Prefer: wait - koristimo polling kao u dokumentaciji)
    console.log('Making Replicate API request...');
    const requestBody = {
      input: inputData
    };
    console.log('=== FULL REQUEST BODY TO REPLICATE ===');
    console.log(JSON.stringify(requestBody, null, 2));
    console.log('=== END REQUEST BODY ===');
    
    let replicateResponse;
    try {
      replicateResponse = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
          // NOTE: Ne koristimo 'Prefer: wait' jer Netlify funkcije imaju timeout limit
          // Umjesto toga koristimo polling pattern (check-prediction-status.js)
        },
        body: JSON.stringify(requestBody)
      });
      console.log('Replicate API request completed, status:', replicateResponse.status);
    } catch (fetchError) {
      console.error('Replicate API fetch error:', fetchError);
      console.error('Error details:', fetchError.message, fetchError.stack);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to call Replicate API',
          details: fetchError.message || 'Network error when calling Replicate API',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Provjeri response
    console.log('Replicate response received');
    console.log('Replicate response status:', replicateResponse.status);
    console.log('Replicate response statusText:', replicateResponse.statusText);
    console.log('Replicate response ok:', replicateResponse.ok);
    
    try {
      console.log('Replicate response headers:', Object.fromEntries(replicateResponse.headers.entries()));
    } catch (headerError) {
      console.warn('Could not log headers:', headerError.message);
    }
    
    // Prvo pročitaj kao text da možemo provjeriti da li je prazan
    let replicateResponseText;
    try {
      replicateResponseText = await replicateResponse.text();
      console.log('Replicate response text length:', replicateResponseText ? replicateResponseText.length : 0);
      
      // Provjeri da li je response prazan
      if (!replicateResponseText || replicateResponseText.trim().length === 0) {
        console.error('Empty response from Replicate API');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Empty response from Replicate API',
            details: 'Replicate API returned an empty response. This might be a timeout or server error.',
            status: replicateResponse.status
          })
        };
      }
    } catch (textError) {
      console.error('Failed to read Replicate response text:', textError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to read Replicate API response',
          details: textError.message || 'Could not read response from Replicate API'
        })
      };
    }
    
    // Parse JSON response (201 Created je uspješan odgovor)
    let prediction;
    try {
      // Provjeri da li je valjan JSON
      const trimmedText = replicateResponseText.trim();
      if (!trimmedText.startsWith('{') && !trimmedText.startsWith('[')) {
        console.error('Replicate response is not JSON:', trimmedText.substring(0, 200));
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid response format from Replicate API',
            details: 'Response is not valid JSON. Received: ' + trimmedText.substring(0, 200),
            status: replicateResponse.status
          })
        };
      }
      
      prediction = JSON.parse(trimmedText);
      
      if (!replicateResponse.ok) {
        console.error('Replicate API error:', prediction);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Replicate API error', 
            details: prediction.error || prediction.detail || JSON.stringify(prediction),
            status: replicateResponse.status
          })
        };
      }
      
      console.log('Replicate prediction created:', {
        id: prediction.id,
        status: prediction.status,
        urls: prediction.urls,
        output: prediction.output
      });
    } catch (parseError) {
      console.error('Failed to parse Replicate response:', parseError);
      console.error('Response text (first 500 chars):', replicateResponseText ? replicateResponseText.substring(0, 500) : 'EMPTY');
      console.error('Error details:', parseError.message, parseError.stack);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from Replicate API',
          details: parseError.message || 'Failed to parse JSON response',
          responsePreview: replicateResponseText ? replicateResponseText.substring(0, 200) : 'empty'
        })
      };
    }
    
    // Provjeri da li ima prediction ID
    if (!prediction || !prediction.id) {
      console.error('Invalid prediction response:', prediction);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid prediction response from Replicate',
          details: 'Missing prediction ID'
        })
      };
    }
    
    console.log('Prediction created, ID:', prediction.id, 'Status:', prediction.status);
    
    // Vrati prediction ID odmah - frontend će sam poll-ati status
    // Ovo sprječava Netlify Function timeout (10-26 sekundi limit)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        predictionId: prediction.id,
        status: prediction.status,
        statusUrl: prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`
      })
    };

  } catch (error) {
    console.error('Error in generate-image:', error);
    console.error('Error stack:', error.stack);
    
    // Osiguraj da uvijek vraćamo valjan JSON response
    let errorMessage = 'Internal server error';
    let errorDetails = error.message || 'Unknown error';
    
    // Specifične error poruke
    if (error.message && error.message.includes('timeout')) {
      errorMessage = 'Request timeout - operation took too long';
      errorDetails = 'The request exceeded the maximum time limit. Please try again with smaller images.';
    } else if (error.message && error.message.includes('ECONNREFUSED')) {
      errorMessage = 'Connection error';
      errorDetails = 'Could not connect to external service. Please try again.';
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// createPrompt funkcija je uklonjena - sada koristimo getPrompt iz prompts.js

