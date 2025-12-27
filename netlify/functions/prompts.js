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
  },
  'template-14': {
    name: 'Westeros Trading Card (Sellsword)',
    scene: 'An ultra-photorealistic, gritty cinematic dark fantasy illustration in the style of Game of Thrones, depicting a hardened female adventurer/sellsword (evoking Lara Croft\'s agility but clad in weathered Westerosi leather armor, chainmail, and furs) dynamically bursting through the frame of an ancient, stone-carved "Legends of the Seven Kingdoms" trading card. She is caught mid-leap from a high battlement, wielding a Valyrian steel sword and perhaps holding a grappling hook with a thick rope. The massive limestone border of the card, carved with dragon and lion motifs, shatters violently. Instead of muzzle flashes, magical fissures glow with faint wildfire green energy and spatial distortions, creating a dimensional rupture. Debris scatters outward: fragments of sun-baked stone walls, broken terracotta roof tiles specific to Dubrovnik, bent arrows, and scattered Gold Dragon coins with Lannister sigils. Flying debris and dust emphasize the powerful moment of breaking through the flat surface of the card.',
    location: 'Inside the card (the background) is a sprawling, detailed depiction of the walled city of Dubrovnik doubling as King\'s Landing, with the Red Keep looming over Blackwater Bay, filled with medieval ships. The title "CITY OF KINGS" and the character designation "Westeros Mercenary" (accompanied by a stylized iron throne or dragon icon) remain visible on remaining cracked, parchment-like parts of the card frame.',
    style: 'Ultra-photorealistic, gritty cinematic dark fantasy, Game of Thrones aesthetic, dramatic moody golden-hour sunset light filtering through heavy clouds, emphasizing textures of stone, steel, and the perilous drop below',
    specialInstructions: 'The person/people transformed into hardened Westerosi adventurer/sellsword bursting through ancient trading card frame. Dynamic action pose mid-leap from battlement. Trading card aesthetic with shattered stone border, magical fissures, and debris. Dubrovnik as King\'s Landing in background. Dramatic golden-hour lighting with heavy clouds. Ultra-photorealistic detail on armor, weapons, and stone textures.'
  },

  // ============================================================================
  // RAINCREST ART - NEW TEMPLATES
  // ============================================================================

  'template-15': {
    name: 'Raincrest Trading Card (King & Queen)',
    // Scene will be dynamically built based on isCouple and gender
    scene: 'Ultra-photorealistic, cinematic-style illustration depicting medieval royalty dynamically bursting through the CENTERED frame of a "Raincrest" trading card. The trading card frame should be CENTERED in the image with the royal couple positioned DIRECTLY IN FRONT of the card, breaking through its center.',
    location: 'The trading card frame is CENTERED horizontally and vertically in the image. The stone-carved border surrounds the couple symmetrically. The border is partially shattered with dimensional cracks, energy and light, scattering dust and ancient stone fragments. Inside the card (background) is Dubrovnik\'s iconic Stradun street with a massive dragon breathing fire in the stormy sky. The title "Raincrest" and subtitle "Claim Your Throne" are visible at the TOP of the card frame.',
    style: 'Epic, Game of Thrones-style lighting emphasizing royal power. Portrait format 4:5 aspect ratio. Ultra detailed, photorealistic, 8k resolution.',
    specialInstructions: 'CENTERED COMPOSITION: Trading card frame fills the entire image as a decorative border. The couple stands IN THE CENTER of the frame, bursting through it. Symmetrical composition. Upper body shot from head to chest, facing camera directly. Sharp focus on faces, professional portrait photography, 85mm lens, shallow depth of field.',
    // Special flags for gender-aware prompts
    hasGenderVariants: true,
    kingPrompt: 'The KING wears magnificent golden crown with jewels, regal medieval armor with red velvet cape, golden embroidery. Powerful stance, sword raised high. Majestic and commanding presence.',
    queenPrompt: 'The QUEEN wears elegant silver tiara with sapphires, flowing royal gown in deep crimson with golden thread embroidery. Graceful yet powerful pose. Regal beauty and authority.'
  },

  'template-16': {
    name: 'Raincrest Dragon Rider',
    scene: 'Ultra-photorealistic fantasy portrait of a dragon rider soaring above Dubrovnik on the back of a massive dragon. Epic clouds, fire elements, dramatic sky.',
    location: 'High above the ancient walled city of Dubrovnik, Adriatic Sea visible below. Massive dragon with detailed scales, wings spread wide. Fire and smoke elements.',
    style: 'Epic fantasy, cinematic, dramatic lighting with sunset/sunrise colors. Ultra detailed dragon scales and rider armor. 8k resolution.',
    specialInstructions: 'Full body shot on dragon back. Rider in fantasy armor/robes suitable for dragon riding. Confident, powerful pose. Wind-swept hair and clothes.',
    hasGenderVariants: true,
    kingPrompt: 'Dragon KING in black and red armor with dragon motifs, riding a massive fire-breathing dragon. Commanding presence, warrior stance.',
    queenPrompt: 'Dragon QUEEN in flowing silver and blue robes with dragon scale details, riding a majestic dragon. Ethereal beauty combined with fierce power.'
  }
};

// ============================================================================
// PROMPT GENERATOR FUNCTION (BASE - for templates WITHOUT gender variants)
// Generira prompt za bilo koji template, s podrškom za couple ili separate images
// ============================================================================

function generatePromptBase(templateId, isCouple) {
  const template = templateScenes[templateId];

  if (!template) {
    console.warn(`Template ${templateId} not found, using template-01 as fallback`);
    return generatePromptBase('template-01', isCouple);
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
// gender parameter: 'king', 'queen', 'couple', or null (auto-detect based on isCouple)
// ============================================================================

function getPrompt(templateId, isCouple, gender = null) {
  return generatePrompt(templateId, isCouple, gender);
}

// Extended generatePrompt to handle gender variants
function generatePromptExtended(templateId, isCouple, gender) {
  const template = templateScenes[templateId];

  if (!template) {
    console.warn(`Template ${templateId} not found, using template-01 as fallback`);
    return generatePrompt('template-01', isCouple, gender);
  }

  // Bazni prompt header
  const baseHeader = `Ultra-photorealistic, highly cinematic ${template.name || 'romantic couple'} photograph.`;

  // Gender-specific scene enhancement
  let genderEnhancement = '';
  if (template.hasGenderVariants) {
    if (gender === 'king' || (!isCouple && gender !== 'queen')) {
      // Single male photo or explicitly king
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:\n${template.kingPrompt || 'Male character in powerful, commanding pose.'}`;
    } else if (gender === 'queen') {
      // Single female photo or explicitly queen
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:\n${template.queenPrompt || 'Female character in elegant, regal pose.'}`;
    } else if (isCouple) {
      // Couple - include both
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:
FOR THE MALE PERSON (KING): ${template.kingPrompt || 'Powerful, commanding royal presence.'}
FOR THE FEMALE PERSON (QUEEN): ${template.queenPrompt || 'Elegant, regal royal beauty.'}`;
    }
  }

  // Input image processing section
  let inputProcessing;

  if (isCouple) {
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [COUPLE_IMAGE, LOGO_IMAGE]
- COUPLE IMAGE: One photo containing BOTH the MALE and FEMALE person together
- LOGO IMAGE: Raincrest Art logo (transparent PNG)
- EXTRACT and IDENTIFY both faces from the single couple image
- Use the couple image to recognize both people's facial features`;
  } else if (gender === 'queen') {
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [FEMALE_FACE_IMAGE, LOGO_IMAGE]
- IMAGE 1: FEMALE FACE (reference model - use this exact face for the QUEEN)
- LOGO IMAGE: Raincrest Art logo (transparent PNG)
- This is a SINGLE PERSON portrait - transform into a QUEEN`;
  } else {
    // Default to king for single male photo
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [MALE_FACE_IMAGE, LOGO_IMAGE]
- IMAGE 1: MALE FACE (reference model - use this exact face for the KING)
- LOGO IMAGE: Raincrest Art logo (transparent PNG)
- This is a SINGLE PERSON portrait - transform into a KING`;
  }

  // Face recognition section
  let faceRecognition;
  if (isCouple) {
    faceRecognition = `FACE RECOGNITION & CONSISTENCY:
- LOAD and ANALYZE the input face image(s)
- IDENTIFY the MALE person (KING) - recognize ALL facial features
- IDENTIFY the FEMALE person (QUEEN) - recognize ALL facial features
- MAINTAIN MAXIMUM RECOGNIZABILITY for both faces
- PRESERVE all distinctive facial features from reference images
- Both people must be CLEARLY RECOGNIZABLE as the people from the input image
- EXTRACT both faces from the single couple image and use them as reference models`;
  } else {
    const roleType = gender === 'queen' ? 'QUEEN' : 'KING';
    faceRecognition = `FACE RECOGNITION & CONSISTENCY:
- LOAD and ANALYZE the input face image
- Transform this person into a ${roleType}
- MAINTAIN MAXIMUM RECOGNIZABILITY - they must be clearly recognizable
- PRESERVE all distinctive facial features: bone structure, eye shape, nose shape, mouth shape, jawline
- DO NOT alter core facial features - only add royal attire/setting
- The ${roleType} must be 100% RECOGNIZABLE as the person from the input image`;
  }

  // Logo integration section
  const logoIntegration = `LOGO INTEGRATION:
- Use the LOGO IMAGE from image_input array
- make it transparent
- PLACE logo in BOTTOM RIGHT CORNER of generated image
- SIZE: 8% of image width
- OPACITY: transparent
- Logo should blend naturally into the scene`;

  // Scene specific section
  const sceneSection = `SCENE: ${template.scene || 'Medieval royalty scene'}
LOCATION: ${template.location || 'Dubrovnik ancient walled city'}
STYLE: ${template.style || 'Cinematic, epic fantasy, professional photography'}`;

  // Composition section
  const specialInstructions = template.specialInstructions || '';

  let composition;
  if (isCouple) {
    composition = `COMPOSITION:
- Both KING and QUEEN should be clearly visible in the scene
${specialInstructions ? `- ${specialInstructions}` : ''}
- Romantic and powerful royal connection between the couple
- Professional photography quality, 8k resolution
- Balanced composition with both faces clearly visible`;
  } else {
    composition = `COMPOSITION:
- Single person portrait in royal medieval style
${specialInstructions ? `- ${specialInstructions}` : ''}
- Professional photography quality, 8k resolution
- Sharp focus on face, dramatic royal atmosphere`;
  }

  // Kombinira sve sekcije
  return `${baseHeader}
${genderEnhancement}

${inputProcessing}

${faceRecognition}

${logoIntegration}

${sceneSection}

${composition}`;
}

// Main generatePrompt function - routes to appropriate implementation
function generatePrompt(templateId, isCouple, gender = null) {
  // For templates with gender variants, use extended version
  const template = templateScenes[templateId];
  if (template && template.hasGenderVariants) {
    return generatePromptExtended(templateId, isCouple, gender);
  }
  // For regular templates (no gender variants), use base implementation
  return generatePromptBase(templateId, isCouple);
}

// Export za Netlify Functions
module.exports = { getPrompt, templateScenes };

