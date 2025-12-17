/**
 * Prompt templates za Love Stories Museum Photo Booth
 * 
 * Svi 13 template-a s podrškom za:
 * - COUPLE IMAGE: 1 slika s oba lica (par zajedno)
 * - SEPARATE IMAGES: 2 odvojene slike (muško + žensko lice)
 * - LOGO: Treća slika u image_input array (transparent PNG s Bunny CDN-a)
 */

// ============================================================================
// TEMPLATE SCENE DEFINITIONS
// Svaki template ima: scene, location, style, specialInstructions
// ============================================================================

const templateScenes = {
  'template-01': {
    name: 'Vintage Romance (1920s)',
    scene: 'Romantic couple in elegant 1920s style clothing, vintage fashion, art deco aesthetic',
    location: 'Vintage setting, 1920s atmosphere, glamorous environment, period-appropriate background',
    style: 'Black and white or sepia tone, art deco style, timeless elegance, glamorous, sophisticated',
    specialInstructions: 'Both people in period-appropriate clothing, natural romantic interaction'
  },
  'template-02': {
    name: 'Medieval Romance (King & Queen)',
    scene: 'King and queen in Dubrovnik, Game of Thrones style, majestic and regal, epic fantasy',
    location: 'Dubrovnik old town, Stradun, medieval architecture in background, Croatian landmarks visible',
    style: 'Epic fantasy, cinematic, dramatic lighting, royal atmosphere, medieval aesthetic',
    specialInstructions: 'Both people in royal medieval attire, majestic poses, Dubrovnik landmarks visible, male person is KING, female person is QUEEN'
  },
  'template-03': {
    name: 'Beach Sunset',
    scene: 'Romantic couple on beach during sunset, warm golden hour lighting, ocean waves',
    location: 'Beautiful beach, ocean waves, sunset sky, romantic beach setting',
    style: 'Warm colors, golden hour, romantic atmosphere, natural lighting, cinematic',
    specialInstructions: 'Both people on beach, romantic interaction, sunset in background'
  },
  'template-04': {
    name: 'City Lights',
    scene: 'Couple in city at night with beautiful bokeh lights, glamorous and sophisticated urban atmosphere',
    location: 'Modern city at night, skyscrapers, neon lights, urban environment with beautiful bokeh effect',
    style: 'Night photography, bokeh lights, glamorous, sophisticated, urban chic, cinematic',
    specialInstructions: 'Both people elegantly dressed, city lights creating romantic bokeh background'
  },
  'template-05': {
    name: 'Garden Wedding',
    scene: 'Romantic wedding ceremony in beautiful garden setting, flowers everywhere, natural light',
    location: 'Lush garden with flowers, wedding arch, romantic outdoor setting (soft bokeh background)',
    style: 'Soft natural lighting, romantic, elegant, wedding photography style, dreamy atmosphere',
    specialInstructions: 'CLOSE-UP SHOT: Focus on upper body - heads, shoulders, and waist (from head to waist). Both people in wedding attire, surrounded by flowers in soft focus background, romantic and elegant. FOCUS: Sharp focus on both faces and upper bodies, background slightly blurred (bokeh effect). Natural interaction between the couple - intimate and romantic. Camera angle: Eye-level or slightly above, emphasizing the couple\'s connection'
  },
  'template-06': {
    name: 'Love Walks Through Time',
    scene: 'CLOSE-UP romantic portrait of couple standing very close together under one umbrella in the rain, faces close to each other, looking into each others eyes with deep romantic connection, man in classic black suit, woman in elegant blue dress, rain falling around them',
    location: 'Blurred ancient cobblestone street background with warm glowing street lamps creating bokeh, rain visibly falling, wet atmosphere, shallow depth of field focusing on the couple',
    style: 'Intimate cinematic portrait, romantic movie poster style, dramatic rain falling around them, warm amber lamplight on faces contrasting with cool blue rain, high contrast, emotional and passionate mood, professional portrait photography',
    specialInstructions: 'CLOSE FRAMING on upper bodies and faces, couple facing each other and looking into each others eyes, foreheads almost touching, rain drops on hair and clothes, umbrella partially visible above them, deeply romantic gaze between them, love and passion visible in their expressions, rain creating dramatic atmosphere around them'
  },
  'template-07': {
    name: 'Chibi 3D',
    scene: 'Cute 3D chibi characters, kawaii style, sweet and romantic, colorful and playful',
    location: 'Colorful fantasy background, cute environment, hearts and sparkles',
    style: '3D render, chibi proportions, kawaii aesthetic, bright colors, cute and adorable',
    specialInstructions: 'Both people as chibi characters with big heads and small bodies, cute expressions, holding hands or hugging'
  },
  'template-08': {
    name: 'Trading Card Style',
    scene: 'Epic romantic trading card design with couple as fantasy lovers, dynamic composition, dramatic and magical',
    location: 'Fantasy background with magical elements, epic scenery, dramatic sky, romantic atmosphere with floating hearts and sparkles, enchanted garden or mystical realm',
    style: 'Premium trading card game art style, dynamic poses, fantasy romantic elements, dramatic lighting with glow effects, detailed illustration, cinematic quality, magical atmosphere',
    specialInstructions: 'ELEGANT TRADING CARD FRAME: Ornate decorative border with intricate patterns, golden or silver metallic frame, elegant corners with ornamental details, premium card design. VISUAL EFFECTS: Soft magical glow around the couple, floating sparkles and hearts in the background, depth and shadows for 3D effect, light rays and magical particles, romantic atmosphere. Both people in fantasy romantic attire, epic and heroic poses but with romantic connection. Card should look like a premium collectible trading card with elegant frame and magical effects'
  },
  'template-09': {
    name: 'Dubrovnik Sunrise',
    scene: 'Romantic couple in Dubrovnik at sunrise, St. Vlaho church in background, warm morning light',
    location: 'Dubrovnik Old Town, St. Vlaho Church, Stradun, ancient stone buildings, pigeons on fly',
    style: 'Travel photography, warm sunrise colors, golden hour, cinematic, professional quality',
    specialInstructions: 'Both people enjoying Dubrovnik sunrise, Croatian landmarks visible, romantic travel moment'
  },
  'template-10': {
    name: 'Volcano Adventure',
    scene: '3D big head caricature style, adventure theme with volcano in background, fun and playful',
    location: 'Volcanic landscape, adventure setting, dramatic volcano with lava, exciting environment',
    style: '3D caricature with exaggerated big heads, fun and playful, adventure movie style, colorful',
    specialInstructions: 'Both people as 3D caricatures with big heads, adventure outfits, exciting poses near volcano'
  },
  'template-11': {
    name: 'Instagram Frame',
    scene: 'Social media style photo with Instagram frame aesthetic, hands 🫶 gesture, modern and trendy',
    location: 'Old town of Dubrovnik street, Trendy backdrop, colorful background, social media aesthetic',
    style: 'Instagram photo style, modern, trendy, colorful, influencer aesthetic, bright and vibrant',
    specialInstructions: 'Both people making hands 🫶 gesture, Instagram-worthy poses, modern and cute'
  },
  'template-12': {
    name: 'Forever Together Box',
    scene: 'Couple as 3D collectible figures inside a display box, premium quality figurines',
    location: 'Inside a collectible display box with "Forever Together" or "Love Stories" branding',
    style: '3D figurine style, collectible toy aesthetic, premium quality, detailed miniature figures',
    specialInstructions: 'Both people as detailed 3D figurines inside a toy/collectible box, cute poses, romantic theme'
  },
  'template-13': {
    name: 'Cinematic Travel',
    scene: 'Professional travel photography of couple in Dubrovnik, cinematic composition, wanderlust',
    location: 'Dubrovnik scenic viewpoint, ancient walls, Adriatic Sea, Croatian coast',
    style: 'Professional travel photography, cinematic, National Geographic style, high quality, dramatic',
    specialInstructions: 'Both people in casual travel outfits, exploring Dubrovnik, candid travel photography style'
  }
};

// ============================================================================
// PROMPT GENERATOR FUNCTION
// Generira prompt za bilo koji template, s podrškom za couple ili separate images
// ============================================================================

function generatePrompt(templateId, isCouple) {
  const template = templateScenes[templateId];
  
  if (!template) {
    console.warn(`Template ${templateId} not found, using template-01 as fallback`);
    return generatePrompt('template-01', isCouple);
  }

  // Bazni prompt header - safely handle undefined name
  const baseHeader = `Ultra-photorealistic, highly cinematic ${template.name || 'romantic couple'} photograph.`;

  // Input image processing section - razlikuje couple vs separate
  let inputProcessing;
  
  if (isCouple) {
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [COUPLE_IMAGE, LOGO_IMAGE]
- COUPLE IMAGE: One photo containing BOTH the MALE and FEMALE person together
- LOGO IMAGE: Love Stories Museum logo (transparent PNG)
- EXTRACT and IDENTIFY both faces from the single couple image
- Use the couple image to recognize both people's facial features`;
  } else {
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [MALE_FACE_IMAGE, FEMALE_FACE_IMAGE, LOGO_IMAGE]
- IMAGE 1: MALE FACE (reference model - use this exact face for the male person)
- IMAGE 2: FEMALE FACE (reference model - use this exact face for the female person)
- LOGO IMAGE: Love Stories Museum logo (transparent PNG)`;
  }

  // Face recognition section - isti za oba slučaja
  const faceRecognition = `FACE RECOGNITION & CONSISTENCY:
- LOAD and ANALYZE the input face image(s)
- IDENTIFY the MALE person - recognize ALL facial features: bone structure, eye shape, nose shape, mouth shape, jawline, distinctive characteristics
- IDENTIFY the FEMALE person - recognize ALL facial features: bone structure, eye shape, nose shape, mouth shape, jawline, distinctive characteristics
- MAINTAIN MAXIMUM RECOGNIZABILITY for both faces - they must be clearly recognizable as the same people from input images
- PRESERVE all distinctive facial features from reference images
- KEEP both faces 100% ACCURATE from their reference images
- DO NOT alter facial structure, bone structure, eye shape, nose shape, mouth shape, or any distinctive features
- CONSISTENT faces - same male person, same female person throughout the entire generated image
- Both people must be CLEARLY RECOGNIZABLE as the people from the input image(s)${isCouple ? '\n- EXTRACT both faces from the single couple image and use them as reference models' : ''}`;

  // Logo integration section
  const logoIntegration = `LOGO INTEGRATION:
- Use the LOGO IMAGE from image_input array
- make it transparent
- PLACE logo in BOTTOM RIGHT CORNER of generated image
- SIZE: 8% of image width
- OPACITY: transparent
- Logo should blend naturally into the scene`;

  // Scene specific section - safely handle undefined values
  const sceneSection = `SCENE: ${template.scene || 'Romantic couple scene'}
LOCATION: ${template.location || 'Beautiful location'}
STYLE: ${template.style || 'Cinematic, professional photography'}`;

  // Composition section
  // Check if template has specific eye contact instructions (e.g., "looking into each others eyes")
  // Safely check specialInstructions - it might be undefined
  const specialInstructions = template.specialInstructions || '';
  const hasSpecificEyeContact = specialInstructions.toLowerCase().includes('looking into') || 
                                 specialInstructions.toLowerCase().includes('looking at each other') ||
                                 specialInstructions.toLowerCase().includes('gaze between');
  
  // Eye contact instruction - default to camera unless template specifies otherwise
  const eyeContactInstruction = hasSpecificEyeContact 
    ? '' // Template has specific eye contact instruction, don't override
    : '- EYE CONTACT: Both people looking directly at the camera with engaging eye contact, professional portrait style, confident and warm expressions';
  
  const composition = `COMPOSITION:
- Both people should be clearly visible in the scene
${specialInstructions ? `- ${specialInstructions}` : ''}
${eyeContactInstruction}
- Natural interaction between the couple
- Professional photography quality
- High resolution, sharp details
- Balanced composition with both faces clearly visible
- Romantic and emotional connection between the couple
- Camera angle: Eye-level or slightly above, engaging and professional portrait perspective`;

  // Kombinira sve sekcije
  return `${baseHeader}

${inputProcessing}

${faceRecognition}

${logoIntegration}

${sceneSection}

${composition}`;
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

function getPrompt(templateId, isCouple) {
  return generatePrompt(templateId, isCouple);
}

// Export za Netlify Functions
module.exports = { getPrompt, templateScenes };
