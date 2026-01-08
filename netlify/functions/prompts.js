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
    scene: 'A high-fidelity cinematographic shot of a medieval King and Queen breaking through the fourth wall of a magical trading card.',
    location: 'Dubrovnik Old Town, reimagined in a dark fantasy medieval era. No modern elements.',
    style: 'Game of Thrones aesthetic, 8k resolution, dramatic volumetric lighting.',
    specialInstructions: 'Ensure the "Raincrest" text at the top of the card is legible and metallic. The characters should look powerful and realistic, not cartoonish. The dragon in the background should be breathing fire towards the viewer.',
    hasGenderVariants: true,
    kingPrompt: 'A powerful King in golden armor with a heavy velvet cape.',
    queenPrompt: 'A regal Queen in a crimson gown with silver embroidery.'
  },

  'template-02': {
    name: 'Raincrest Dragon Rider',
    scene: 'An epic wide shot of a dragon rider flying over medieval Dubrovnik at sunset.',
    location: 'Aerial view of Dubrovnik walls and the Adriatic sea. Historical wooden ships in the harbor.',
    style: ' Cinematic fantasy realism, golden hour lighting, hyper-detailed dragon scales.',
    specialInstructions: 'The dragon must be breathing fire FORWARD. The rider sits securely on the dragon\'s back. IMPORTANT: The fire should NOT obscure the rider\'s face. The rider looks confident and heroic.',
    hasGenderVariants: true,
    kingPrompt: 'A male warrior king commanding the dragon.',
    queenPrompt: 'A female dragon queen guiding the beast.'
  },

  'template-03': {
    name: 'Dragon Rider Caricature (Bobblehead)',
    scene: 'A playful 3D-rendered caricature of a couple riding a cute but epic dragon.',
    location: 'Stylized miniature version of Dubrovnik.',
    style: 'Pixar-style animation, vibrant colors, exaggerated head proportions (bobblehead).',
    specialInstructions: 'Characters have large heads and small bodies. Expressions should be joyful and excited. The dragon looks friendly but impressive. Bright, warm lighting.',
    hasGenderVariants: true,
    kingPrompt: 'Male character with a comically large crown and small sword.',
    queenPrompt: 'Female character with a large tiara and flowing animated hair.'
  },
  'template-09': {
    name: 'Iron Throne Ruler (King/Queen)',
    scene: 'The character sitting powerfully on the Iron Throne in the Great Hall of the Red Keep.',
    location: 'King\'s Landing, inside the Throne Room, swords, torches, massive columns.',
    style: 'Game of Thrones cinematic, dark moody lighting, royal, intimidating, high contrast.',
    specialInstructions: 'Sitting on the Iron Throne. Wearing royal armor/crown. Looking powerful and slightly dangerous. Lighting shafts from high windows.',
    hasGenderVariants: true,
    kingPrompt: 'A ruthless King sitting on the Iron Throne, wearing black and gold armor.',
    queenPrompt: 'A formidable Queen sitting on the Iron Throne, wearing a structured armored gown.'
  },
  'template-10': {
    name: 'Night Watch Commander (The Wall)',
    scene: 'Standing atop the massive Ice Wall looking out into the dark North.',
    location: 'The Wall, Castle Black, snow, ice, dark forest in distance, blue cold atmosphere.',
    style: 'Cinematic fantasy, cold palette (blues and whites), gritty realism, snow particles.',
    specialInstructions: 'Wearing heavy black fur cloak (Night Watch style). Snow falling. Grim and determined expression. Holding a sword or lantern.',
    hasGenderVariants: true,
    kingPrompt: 'Lord Commander of the Night Watch, grizzled and tough.',
    queenPrompt: 'Female Warrior of the Night Watch, fierce and resilient.'
  },
  'template-11': {
    name: 'White Walker General (Ice King/Queen)',
    scene: 'Transformed into a White Walker general leading an army of the dead.',
    location: 'Beyond the Wall, blizzard, icy wasteland, glowing blue magic eyes.',
    style: 'Dark fantasy horror, cold blue tones, glowing eyes, crystalline ice armor.',
    specialInstructions: 'Skin is pale/icy texture. Eyes glowing bright blue. Wearing armor made of ice. Aura of cold mist. Intimidating and supernatural.',
    hasGenderVariants: true,
    kingPrompt: 'The Night King style commander, holding an ice spear.',
    queenPrompt: 'The Night Queen, terrifyingly beautiful usage of ice magic.'
  },
  'template-12': {
    name: 'Dothraki Warlord (Open Field)',
    scene: 'Riding a horse in the open grass sea, shouting a battle cry.',
    location: 'The Dothraki Sea, open plains, golden grass, blue sky, fire pit in background.',
    style: 'Epic adventure, warm earth tones, dusty, savage beauty, dynamic motion.',
    specialInstructions: 'Wearing leather tribal gear and war paint. Muscular and wild appearance. Riding a horse (or standing next to one).',
    hasGenderVariants: true,
    kingPrompt: 'Khal, powerful warrior leader, shirtless with leather harness, holding arakh.',
    queenPrompt: 'Khaleesi, fierce warrior queen, leather outfit, wind in hair.'
  },
  'template-13': {
    name: 'Mother/Father of Dragons (Targaryen)',
    scene: 'Standing majestically with three small baby dragons climbing on shoulders/arms.',
    location: 'Dragonstone throne room or volcanic cliffs, dramatic coastline.',
    style: 'High fantasy, Targaryen red and black, mystical, regal.',
    specialInstructions: 'Platinum blonde hair (optional/silver wig style). Wearing Targaryen colors (black/red). Three small dragons interacting (one on shoulder, one in hand).',
    hasGenderVariants: true,
    kingPrompt: 'Targaryen Prince, silver hair, regal black armor, commanding dragons.',
    queenPrompt: 'Daenerys style Dragon Queen, silver hair, elegant dress with scales.'
  },
  'template-14': {
    name: 'Westeros Trading Card (Sellsword)',
    scene: 'An ultra-photorealistic, gritty cinematic dark fantasy illustration in the style of Game of Thrones, depicting a hardened adventurer/sellsword dynamically bursting through the frame of an ancient trading card.',
    location: 'Dubrovnik doubling as King\'s Landing, Red Keep in background.',
    style: 'Ultra-photorealistic, gritty cinematic dark fantasy, dramatic golden-hour lighting.',
    specialInstructions: 'Bursting through stone border. Debris flying. Action pose. Background is King\'s Landing (Dubrovnik).',
    hasGenderVariants: true,
    kingPrompt: 'Male Sellsword warrior, gritty, battle-worn.',
    queenPrompt: 'Female Sellsword adventurer, nimble and fierce.'
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
