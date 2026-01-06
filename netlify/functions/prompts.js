/**
 * Prompt templates za Raincrest Art Photo Booth
 * 
 * 3 template-a s podrškom za:
 * - COUPLE IMAGE: 1 slika s oba lica (par zajedno)
 * - SEPARATE IMAGES: King ili Queen solo
 * - LOGO: Raincrest Art logo (transparent PNG)
 */

// ============================================================================
// RAINCREST ART TEMPLATES
// ============================================================================

const templateScenes = {
  'template-01': {
    name: 'Raincrest Trading Card (King & Queen)',
    scene: 'Ultra-photorealistic, cinematic-style illustration depicting medieval royalty dynamically bursting through the CENTERED frame of a "Raincrest" trading card. The trading card frame should be CENTERED in the image with the royal couple positioned DIRECTLY IN FRONT of the card, breaking through its center.',
    location: 'The trading card frame is CENTERED horizontally and vertically in the image. The stone-carved border surrounds the couple symmetrically. The border is partially shattered with dimensional cracks, energy and light, scattering dust and ancient stone fragments. Inside the card (background) is Dubrovnik\'s iconic Stradun street with a massive dragon breathing fire in the stormy sky. The title "Raincrest" and subtitle "Claim Your Throne" are visible at the TOP of the card frame.',
    style: 'Epic, Game of Thrones-style lighting emphasizing royal power. Portrait format 4:5 aspect ratio. Ultra detailed, photorealistic, 8k resolution.',
    specialInstructions: 'CENTERED COMPOSITION: Trading card frame fills the entire image as a decorative border. The couple stands IN THE CENTER of the frame, bursting through it. Symmetrical composition. Upper body shot from head to chest, facing camera directly. Sharp focus on faces, professional portrait photography, 85mm lens, shallow depth of field.',
    hasGenderVariants: true,
    kingPrompt: 'The KING wears magnificent golden crown with jewels, regal medieval armor with red velvet cape, golden embroidery. Powerful stance, sword raised high. Majestic and commanding presence.',
    queenPrompt: 'The QUEEN wears elegant silver tiara with sapphires, flowing royal gown in deep crimson with golden thread embroidery. Graceful yet powerful pose. Regal beauty and authority.'
  },

  'template-02': {
    name: 'Raincrest Dragon Rider',
    scene: 'Ultra-photorealistic fantasy portrait of a dragon rider soaring above Dubrovnik on the back of a massive dragon. Epic clouds, fire elements, dramatic sky.',
    location: 'High above the ancient walled city of Dubrovnik, Adriatic Sea visible below. Massive dragon with detailed scales, wings spread wide. Fire and smoke elements.',
    style: 'Epic fantasy, cinematic, dramatic lighting with sunset/sunrise colors. Ultra detailed dragon scales and rider armor. 8k resolution.',
    specialInstructions: 'Full body shot on dragon back. Rider in fantasy armor/robes suitable for dragon riding. Confident, powerful pose. Wind-swept hair and clothes.',
    hasGenderVariants: true,
    kingPrompt: 'Dragon KING in black and red armor with dragon motifs, riding a massive fire-breathing dragon. Commanding presence, warrior stance.',
    queenPrompt: 'Dragon QUEEN in flowing silver and blue robes with dragon scale details, riding a majestic dragon. Ethereal beauty combined with fierce power.'
  },

  'template-03': {
    name: 'Dragon Rider Caricature (GoT Dubrovnik)',
    scene: '3D caricature illustration of a romantic couple riding together on a massive flying dragon, Game of Thrones dark fantasy style. Exaggerated BIG HEADS with small bodies (bobblehead proportions). Fun, playful caricature art style but with epic fantasy theme. Both waving at camera with excited expressions.',
    location: 'Bird\'s eye view of Dubrovnik old town from above. RECOGNIZABLE: City walls, terracotta rooftops, Old Port, Lokrum island, Adriatic Sea. DARK TRANSFORMATION: Stormy dramatic sky with dark swirling clouds, twilight/dusk lighting, moody ominous atmosphere, medieval fantasy King\'s Landing vibes, mist around the city walls.',
    style: '3D caricature with fantasy epic quality. Dynamic flying pose with sense of motion and adventure. Dramatic camera angle from slightly below. Dark dramatic sky (deep blues, purples, greys). Dragon in dark tones with fiery orange accents. Couple in rich reds and golds. Dubrovnik in warm terracotta against cool shadows.',
    specialInstructions: 'CARICATURE BOBBLEHEAD STYLE: Big heads, small bodies, fun expressions. THE DRAGON: Massive, detailed dragon with dark black/grey scales, glowing orange/red eyes, wings spread wide in flight, fire-breathing or smoke trailing, detailed scales and spines. Both people sitting together on dragon back, waving happily.',
    hasGenderVariants: true,
    kingPrompt: 'KING caricature: Medieval armor, red cape flowing in wind, golden crown, excited waving expression, adventurous smile.',
    queenPrompt: 'QUEEN caricature: Royal gown in deep crimson, silver tiara, hair flowing dramatically in wind, waving happily, joyful expression.'
  }
};

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
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:\n${template.kingPrompt || 'Male character in powerful, commanding pose.'}`;
    } else if (gender === 'queen') {
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:\n${template.queenPrompt || 'Female character in elegant, regal pose.'}`;
    } else if (isCouple) {
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
    inputProcessing = `CRITICAL: INPUT IMAGE PROCESSING
- image_input array contains: [MALE_FACE_IMAGE, LOGO_IMAGE]
- IMAGE 1: MALE FACE (reference model - use this exact face for the KING)
- LOGO IMAGE: Raincrest Art logo (transparent PNG)
- This is a SINGLE PERSON portrait - transform into a KING`;
  }

  // Face recognition section - ENHANCED for identity preservation
  let faceRecognition;
  if (isCouple) {
    faceRecognition = `CRITICAL FACE IDENTITY PRESERVATION:
⚠️ THE FACES MUST BE PIXEL-PERFECT COPIES FROM THE INPUT IMAGE ⚠️

- EXTRACT both faces from the input couple image with EXACT precision
- DO NOT generate new faces - USE THE EXACT FACES from the input photo
- PRESERVE 100%: exact eye shape, eye color, eyebrow shape, nose shape, nose size, lip shape, lip thickness, jaw shape, chin shape, cheekbone structure, forehead shape, skin tone, skin texture, facial hair, wrinkles, moles, freckles
- The KING's face = EXACT copy of the male face from input
- The QUEEN's face = EXACT copy of the female face from input
- Face angles should match or be naturally rotated while preserving all features
- NO artistic interpretation of faces - faces are SACRED and UNCHANGED
- Only transform: clothing, background, lighting on body (NOT face lighting)
- FACE SIMILARITY SCORE MUST BE 100%`;
  } else {
    const roleType = gender === 'queen' ? 'QUEEN' : 'KING';
    faceRecognition = `CRITICAL FACE IDENTITY PRESERVATION:
⚠️ THE FACE MUST BE A PIXEL-PERFECT COPY FROM THE INPUT IMAGE ⚠️

- DO NOT generate a new face - USE THE EXACT FACE from the input photo
- PRESERVE 100%: exact eye shape, eye color, eyebrow shape, nose shape, nose size, lip shape, lip thickness, jaw shape, chin shape, cheekbone structure, forehead shape, skin tone, skin texture, facial hair, wrinkles, moles, freckles
- The ${roleType}'s face = EXACT copy of the face from input image
- NO artistic interpretation of the face - the face is SACRED and UNCHANGED
- Only transform: clothing, crown/tiara, background, body pose
- Lighting on face should match original photo lighting
- FACE SIMILARITY SCORE MUST BE 100%
- The person MUST be immediately recognizable by their family and friends`;
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
  const template = templateScenes[templateId];
  if (template && template.hasGenderVariants) {
    return generatePromptExtended(templateId, isCouple, gender);
  }
  // Fallback (all current templates have gender variants)
  return generatePromptExtended(templateId, isCouple, gender);
}

// Export za Netlify Functions
module.exports = { getPrompt, templateScenes };
