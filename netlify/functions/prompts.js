/**
 * Prompt templates za Raincrest Art Photo Booth
 * 
 * 8 template-a s podrškom za:
 * - COUPLE IMAGE: 1 slika s oba lica (par zajedno)
 * - SEPARATE IMAGES: King ili Queen solo
 * - LOGO: Raincrest Art logo (transparent PNG)
 * - VIDEO: Veo video prompts za svaki template
 */

// ============================================================================
// RAINCREST ART TEMPLATES
// ============================================================================

const templateScenes = {
  'template-01': {
    name: 'Raincrest Trading Card (King & Queen)',
    thumbnail: '/images/templates/template-01-placeholder.jpg',
    scene: 'Ultra-photorealistic, cinematic-style illustration depicting medieval royalty dynamically bursting through the CENTERED frame of a "Raincrest" trading card. The trading card frame should be CENTERED in the image with the royal couple positioned DIRECTLY IN FRONT of the card, breaking through its center.',
    location: 'The trading card frame is CENTERED horizontally and vertically in the image. The stone-carved border surrounds the couple symmetrically. The border is partially shattered with dimensional cracks, energy and light, scattering dust and ancient stone fragments. Inside the card (background) is MEDIEVAL Dubrovnik - Stradun street in the MEDIEVAL ERA with wooden merchant carts, torches, medieval banners, NO MODERN ELEMENTS (no cars, no modern boats, no tourists). A massive dragon breathing fire FORWARD into the stormy sky. The title "Raincrest" and subtitle "Claim Your Throne" are visible at the TOP of the card frame.',
    style: 'Epic, Game of Thrones-style lighting emphasizing royal power. Portrait format 4:5 aspect ratio. Ultra detailed, photorealistic, 8k resolution.',
    specialInstructions: 'CENTERED COMPOSITION: Trading card frame fills the entire image as a decorative border. The couple stands IN THE CENTER of the frame, bursting through it. Symmetrical composition. Upper body shot from head to chest, facing camera directly. Sharp focus on faces, professional portrait photography, 85mm lens, shallow depth of field.',
    hasGenderVariants: true,
    kingPrompt: 'The KING wears magnificent golden crown with jewels, regal medieval armor with red velvet cape, golden embroidery. Powerful stance, sword raised high. Majestic and commanding presence.',
    queenPrompt: 'The QUEEN wears elegant silver tiara with sapphires, flowing royal gown in deep crimson with golden thread embroidery. Graceful yet powerful pose. Regal beauty and authority.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Slow dramatic push-in on the KING as he raises his sword. Red cape billows in wind. Ancient stone card frame crackles with energy. Deep orchestral music swells. The king speaks powerfully: "Raincrest remembers." Camera reveals medieval Dubrovnik behind him. Dragon breathes fire skyward. 8 seconds.',
    queenVideoPrompt: 'Slow elegant dolly toward QUEEN on ornate throne. Silver tiara catches golden light. Hair flows gracefully in breeze. Ethereal choir music rises. She speaks regally: "A queen bows to no one." Trading card frame shimmers with magical light. Medieval city visible through window. 8 seconds.',
    coupleVideoPrompt: 'Epic camera orbit around KING and QUEEN standing together. Their capes billow dramatically. Trading card frame shatters around them. Orchestral crescendo builds. King speaks: "Together..." Queen continues: "...we are unstoppable." Dragon roars. Fire and light illuminate the couple. Medieval Dubrovnik glows below. 10 seconds.'
  },

  'template-02': {
    name: 'Raincrest Dragon Rider',
    thumbnail: '/images/templates/template-02-placeholder.jpg',
    scene: 'Ultra-photorealistic fantasy portrait of a dragon rider soaring above MEDIEVAL Dubrovnik on the back of a massive dragon. Epic clouds, fire elements, dramatic sky.',
    location: 'High above the ancient walled city of Dubrovnik IN THE MEDIEVAL ERA. Below: wooden sailing ships, medieval galleons, NO MODERN BOATS OR YACHTS. City walls with medieval banners, torch-lit towers. Adriatic Sea with period-accurate vessels. Massive dragon with detailed scales, wings spread wide. CRITICAL: Dragon breathes fire FORWARD towards the camera, flames shooting AHEAD of the dragon, NOT towards the rider.',
    style: 'Epic fantasy, cinematic, dramatic lighting with sunset/sunrise colors. Ultra detailed dragon scales and rider armor. 8k resolution.',
    specialInstructions: 'Full body shot on dragon back. Rider in fantasy armor/robes suitable for dragon riding. Confident, powerful pose. Wind-swept hair and clothes. DRAGON FIRE DIRECTION: Fire shoots FORWARD from dragon mouth towards camera, creating dramatic effect. Rider is BEHIND the fire, safe from flames.',
    hasGenderVariants: true,
    kingPrompt: 'Dragon KING in black and red armor with dragon motifs, riding a massive fire-breathing dragon. Dragon breathes fire FORWARD (away from rider). Commanding presence, warrior stance.',
    queenPrompt: 'Dragon QUEEN in flowing silver and blue robes with dragon scale details, riding a majestic dragon. Dragon breathes fire FORWARD (away from rider). Ethereal beauty combined with fierce power.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Sweeping aerial shot following DRAGON KING soaring above medieval Dubrovnik. Massive dragon wings beat powerfully. Wind whips through armor. Dragon breathes fire forward into clouds. Epic drums and brass. He shouts commandingly: "Fire and fury!" Camera pulls back revealing the ancient walled city. Sunset colors paint the scene. 10 seconds.',
    queenVideoPrompt: 'Graceful tracking shot of DRAGON QUEEN riding through golden clouds. Silver-blue robes flow like water. Dragon glides majestically. Ethereal strings and choir. She speaks with fierce elegance: "I am the storm they feared." Dragon roars. Camera sweeps down toward glowing Dubrovnik at dusk. 10 seconds.',
    coupleVideoPrompt: 'Epic wide shot of KING and QUEEN riding together on massive dragon. Camera spirals around them as dragon soars. Both capes flowing together. Powerful orchestral score. Queen shouts: "Together!" King responds: "Always!" Dragon breathes twin streams of fire. Medieval Dubrovnik glitters far below. Sunset sky burns orange and purple. 12 seconds.'
  },

  'template-03': {
    name: 'Dragon Rider Caricature (Medieval Dubrovnik)',
    thumbnail: '/images/templates/template-03-placeholder.jpg',
    scene: '3D caricature illustration of a romantic couple riding together on a massive flying dragon, dark fantasy style. Exaggerated BIG HEADS with small bodies (bobblehead proportions). Fun, playful caricature art style but with epic fantasy theme. Both waving at camera with excited expressions.',
    location: 'Bird\'s eye view of MEDIEVAL Dubrovnik old town from above. RECOGNIZABLE: City walls, terracotta rooftops, Old Port with WOODEN SAILING SHIPS and medieval galleons (NO MODERN BOATS OR YACHTS), Lokrum island, Adriatic Sea. DARK TRANSFORMATION: Stormy dramatic sky with dark swirling clouds, twilight/dusk lighting, moody ominous atmosphere, medieval fantasy vibes, mist around the city walls, burning torches on walls.',
    style: '3D caricature with fantasy epic quality. Dynamic flying pose with sense of motion and adventure. Dramatic camera angle from slightly below. Dark dramatic sky (deep blues, purples, greys). Dragon in dark tones with fiery orange accents. Couple in rich reds and golds. Dubrovnik in warm terracotta against cool shadows.',
    specialInstructions: 'CARICATURE BOBBLEHEAD STYLE: Big heads, small bodies, fun expressions. THE DRAGON: Massive, detailed dragon with dark black/grey scales, glowing orange/red eyes, wings spread wide in flight, FIRE BREATHING FORWARD (away from riders, towards camera), detailed scales and spines. Both people sitting together on dragon back, waving happily. Riders are SAFE behind the dragon head.',
    hasGenderVariants: true,
    kingPrompt: 'KING caricature: Medieval armor, red cape flowing in wind, golden crown, excited waving expression, adventurous smile.',
    queenPrompt: 'QUEEN caricature: Royal gown in deep crimson, silver tiara, hair flowing dramatically in wind, waving happily, joyful expression.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Fun 3D animated shot of caricature KING bouncing on dragon back. Big head bobbles comically. Crown nearly falls off. He waves excitedly at camera. Playful orchestral music. Dragon does a barrel roll. He laughs and shouts: "This is amazing!" Cartoon-style Dubrovnik zooms by below. Bright, colorful, energetic mood. 8 seconds.',
    queenVideoPrompt: 'Playful 3D shot of caricature QUEEN riding dragon with joy. Big expressive eyes gleam. Tiara sparkles. Hair flows dramatically oversized. She waves both hands happily. Whimsical music. Dragon winks at camera. She giggles: "I was born to fly!" Colorful medieval city below. Fun adventure energy. 8 seconds.',
    coupleVideoPrompt: 'Dynamic 3D sequence with caricature COUPLE bouncing on dragon together. Both waving excitedly with big smiles. Their bobbleheads bump into each other and they laugh. Playful adventure music. Dragon does a spin. Both yell together: "Best day ever!" Cheerful, colorful energy. Cartoon Dubrovnik sparkles below. 10 seconds.'
  },

  'template-04': {
    name: 'Royal Coronation',
    thumbnail: '/images/templates/template-04-placeholder.jpg',
    scene: 'Ultra-photorealistic coronation ceremony in ancient stone throne room. Majestic iron throne made of swords. Dramatic lighting from tall gothic windows. Royal banners hanging from walls.',
    location: 'Grand throne room in medieval fortress overlooking Dubrovnik. Stone walls, iron chandeliers with candles, red velvet carpet leading to throne. Gothic arched windows showing Mediterranean walled city at sunset. Medieval guards in armor line the walls.',
    style: 'Epic medieval fantasy, dramatic chiaroscuro lighting. Golden hour light streaming through windows. Ultra detailed, cinematic, 8k resolution.',
    specialInstructions: 'Upper body to full body shot. Subject seated on or standing before iron throne. Crown being placed or already on head. Powerful, regal pose. Sharp focus on face and crown. Professional photography quality.',
    hasGenderVariants: true,
    coupleOnly: false,
    kingPrompt: 'The KING sits on iron sword throne, magnificent golden crown on head. Heavy fur-lined cape, dark leather armor with gold accents. One hand grips throne arm, other holds scepter. Stern, commanding expression. Ultimate power and authority.',
    queenPrompt: 'The QUEEN sits elegantly on iron throne, delicate silver crown with jewels. Deep red velvet gown with golden embroidery, fur collar. Regal posture, hands on throne arms. Expression of calm power and wisdom.',
    couplePrompt: 'KING and QUEEN sit on twin iron thrones side by side. King in gold crown and armor, Queen in silver tiara and crimson gown. Both face forward with commanding presence. Their hands touch between thrones. Unity in power.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Slow dramatic push-in on KING seated on iron throne. Candlelight flickers on his golden crown. He grips the throne arm and leans forward. Deep orchestral bass. He speaks with authority: "A king needs no army. Only will." Camera reveals massive throne room. Torches blaze. 8 seconds.',
    queenVideoPrompt: 'Elegant dolly shot toward QUEEN on her throne. Silver crown catches candlelight. She rises slowly with grace. Ethereal strings swell. She speaks coolly: "I was not born to kneel." Her gown flows as she takes a step forward. Medieval city glows through gothic window. 8 seconds.',
    coupleVideoPrompt: 'Sweeping crane shot in throne room as KING and QUEEN rise from twin thrones together. Their hands join between them. Orchestral crescendo. King: "Together..." Queen: "...we rule." They take one step forward in unison. Torches blaze brighter. Epic power radiates. 10 seconds.'
  },

  'template-05': {
    name: 'Fortress Watch',
    thumbnail: '/images/templates/template-05-placeholder.jpg',
    scene: 'Ultra-photorealistic night scene on ancient fortress battlements. Lone warrior standing guard under starlit sky. Torches flickering along stone walls. Dramatic moonlit atmosphere.',
    location: 'Top of Dubrovnik city walls at night. Stone battlements, crenellations, guard towers with burning torches. Mediterranean sea shimmers under moonlight. Medieval city sleeps below with scattered torch lights. Stars visible in clear night sky.',
    style: 'Cinematic night photography, dramatic moonlight and torchlight. Cool blue shadows with warm orange torch accents. Mysterious atmosphere. 8k resolution.',
    specialInstructions: 'Full body or upper body shot. Subject in armor/warrior attire looking out over city or toward camera. Torch light illuminating one side of face. Wind effect on hair/cape. Vigilant, protective stance.',
    hasGenderVariants: true,
    coupleOnly: false,
    kingPrompt: 'Night watchman KING in dark steel armor, wolf-fur cloak. Long sword drawn, resting point on stone. Stern vigilant expression. Moonlight catches armor edges. Guardian of the realm.',
    queenPrompt: 'Warrior QUEEN in sleek leather and steel armor. Hooded cloak, bow in hand. Sharp watchful eyes scan horizon. Deadly elegance. Protector in darkness.',
    couplePrompt: 'KING and QUEEN stand together on battlements. He in heavy armor with sword, she in leather with bow. Back to back, watching different directions. United guardians. Moonlight silhouettes them.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Atmospheric night shot on fortress walls. KING in armor turns slowly toward camera. Torch flames dance behind him. Wind moves his fur cloak. Deep cello music. He speaks gravely: "The night is dark, but I remain." Moonlight catches his sword. Medieval city sleeps below. 8 seconds.',
    queenVideoPrompt: 'Moody tracking shot along battlements. Warrior QUEEN emerges from shadow into torchlight. She draws arrow. Ethereal dark music. Whispered firmly: "They will not pass while I stand." Her eyes scan the darkness. Fog rolls across the city below. 8 seconds.',
    coupleVideoPrompt: 'Epic wide shot of KING and QUEEN back-to-back on fortress walls. Camera orbits slowly. Torches flicker around them. Tense orchestral strings. King: "Whatever comes..." Queen: "...we face together." Wind howls. Moonlit city stretches behind them. 10 seconds.'
  },

  'template-06': {
    name: 'Sacred Vows',
    thumbnail: '/images/templates/template-06-placeholder.jpg',
    scene: 'Ultra-photorealistic medieval wedding ceremony under candlelit stone arch. Two people exchanging sacred vows. Rose petals scattered. Intimate and romantic atmosphere.',
    location: 'Ancient stone chapel in Dubrovnik fortress. Carved stone arch with ancient symbols. Hundreds of candles illuminate the scene. Rose petals on stone floor. Gothic windows showing stars. Medieval tapestries on walls.',
    style: 'Romantic fantasy, warm candlelight, soft focus background. Golden and amber tones. Intimate composition. 8k resolution.',
    specialInstructions: 'Medium shot of couple facing each other. Hands joined. Candles all around. Soft, emotional expressions. Professional wedding photography quality. Romantic but with medieval fantasy elements.',
    hasGenderVariants: true,
    coupleOnly: true, // This template is couples only
    kingPrompt: null, // Not available for solo
    queenPrompt: null, // Not available for solo
    couplePrompt: 'BRIDE and GROOM hold hands under ancient stone arch. She in flowing white-gold medieval wedding gown with delicate crown of flowers. He in formal dark velvet doublet with silver clasps. Both gazing at each other with love. Candlelight creates halo around them.',
    // VIDEO PROMPTS
    kingVideoPrompt: null,
    queenVideoPrompt: null,
    coupleVideoPrompt: 'Intimate close-up of two hands joining together. Camera slowly pulls back to reveal COUPLE exchanging vows in candlelit stone chamber. Soft choir music rises. Groom speaks softly: "From this day, until my last day." Candle flames flicker, casting dancing shadows. Rose petals drift through the air. Warm golden lighting. Tender atmosphere. 8 seconds.'
  },

  'template-07': {
    name: 'Dragon Masters',
    thumbnail: '/images/templates/template-07-placeholder.jpg',
    scene: 'Ultra-photorealistic epic scene of dragon rider with their bonded dragon. Person stands beside massive dragon, both facing forward. Dawn sky, dramatic clouds, ancient fortress visible.',
    location: 'Clifftop overlooking medieval Dubrovnik at dawn. Ancient stone ruins nearby. Massive dragon with detailed scales rests beside the rider. Mediterranean sea stretches to horizon. First light of sunrise paints everything gold.',
    style: 'Epic fantasy, golden hour lighting. Detailed dragon textures. Cinematic wide composition. Powerful bond between human and dragon. 8k resolution.',
    specialInstructions: 'Full body shot of person standing next to dragon. Dragon head at similar height, showing size and bond. Confident mutual pose. Both looking toward camera or horizon. Epic scale.',
    hasGenderVariants: true,
    coupleOnly: false,
    kingPrompt: 'Dragon MASTER in battle-worn armor with dragon scale pauldrons. Hand rests on dragon\'s massive snout. Mutual respect between warrior and beast. Dragon has dark scales with red underbelly. Ready for war.',
    queenPrompt: 'Dragon MISTRESS in flowing robes with dragon motifs. Gentle hand on dragon\'s neck. Beautiful silver-blue dragon with iridescent scales. Deep bond. Ethereal power.',
    couplePrompt: 'KING and QUEEN stand with their bonded dragon between them. Dragon\'s great head turns between its two masters. All three face forward. Family of fire and blood. Unbreakable bond.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Epic dawn shot of DRAGON MASTER standing beside massive dragon on clifftop. Camera rises as dragon lifts its head. Wings begin to spread. Powerful drums build. He commands: "Fire and blood. I am the storm." Dragon roars to the sky. Medieval city glows in morning light below. 10 seconds.',
    queenVideoPrompt: 'Ethereal golden hour shot of DRAGON MISTRESS with her silver dragon. She strokes dragon\'s neck gently. Dragon turns to face camera. Majestic strings swell. She speaks proudly: "We answer to no one." Dragon spreads iridescent wings. Light catches scales. Magical atmosphere. 10 seconds.',
    coupleVideoPrompt: 'Wide epic shot of COUPLE standing with massive dragon between them. Camera pushes in as all three face forward. Dragon roars. Both riders raise fists. Orchestral crescendo. King: "Together!" Queen: "Unbreakable!" Dragon breathes fire skyward. Dawn breaks over Dubrovnik. 12 seconds.'
  },

  'template-08': {
    name: 'Storm Rulers',
    thumbnail: '/images/templates/template-08-placeholder.jpg',
    scene: 'Ultra-photorealistic dramatic portrait of royalty standing before an epic storm. Lightning illuminates the scene. Ancient walled city behind them. Powerful, defiant stance.',
    location: 'Clifftop or high wall overlooking medieval Dubrovnik. Massive storm clouds gathering. Lightning strikes illuminate the ancient city. Dramatic wind. Rain beginning to fall. Turbulent sea.',
    style: 'Epic dramatic, high contrast lighting from lightning. Dark moody atmosphere. Rain and wind effects. Cinematic storm photography. 8k resolution.',
    specialInstructions: 'Full body or upper body shot. Subject facing camera with defiant expression. Storm behind them. Lightning providing dramatic backlighting. Cape/clothing blowing in wind. Ultimate power stance.',
    hasGenderVariants: true,
    coupleOnly: false,
    kingPrompt: 'Storm KING in dark armor, crown of iron and gold. Heavy cloak whipping in wind. Sword raised toward storm clouds. Face lit by lightning. Defying the elements. Unstoppable ruler.',
    queenPrompt: 'Storm QUEEN in dark flowing gown. Silver crown gleams in lightning flashes. Arms spread wide, welcoming the storm. Hair wild in wind. She IS the storm. Untameable power.',
    couplePrompt: 'KING and QUEEN stand together facing the storm. He with sword raised, she with arms spread. Lightning strikes behind them. United front against chaos. Together they ARE the storm.',
    // VIDEO PROMPTS
    kingVideoPrompt: 'Dramatic shot of STORM KING on clifftop. Wind tears at his cloak. Lightning flashes behind him. Camera pushes in as he raises sword. Thunder crashes. He roars: "Let them come!" Another lightning strike illuminates his defiant face. Rain begins. Epic brass and drums. 8 seconds.',
    queenVideoPrompt: 'Intense shot of STORM QUEEN facing camera. Her gown flows violently in wind. Lightning illuminates her silver crown. She spreads her arms wide. Thunder rolls. She shouts: "I am the storm they fear!" Lightning strikes behind her. Powerful orchestral surge. Electrifying energy. 8 seconds.',
    coupleVideoPrompt: 'Epic wide shot of KING and QUEEN standing together before massive storm. Lightning strikes reveal them. Both take a step forward. King raises sword. Queen spreads arms. Thunder crashes. Together they shout: "We do not bow!" Multiple lightning strikes. Rain falls. Triumphant orchestra. 10 seconds.'
  }
};

// ============================================================================
// MAIN EXPORT FUNCTION
// gender parameter: 'king', 'queen', 'couple', or null (auto-detect based on isCouple)
// ============================================================================

function getPrompt(templateId, isCouple, gender = null) {
  return generatePrompt(templateId, isCouple, gender);
}

/**
 * Get video prompt for Veo video generation
 * @param {string} templateId - The template ID
 * @param {boolean} isCouple - Whether this is a couple image
 * @param {string} gender - 'king', 'queen', or null
 * @returns {string} Video prompt for Veo
 */
function getVideoPrompt(templateId, isCouple, gender = null) {
  const template = templateScenes[templateId];

  let basePrompt;
  if (!template) {
    console.warn(`Template ${templateId} not found for video prompt`);
    basePrompt = 'Cinematic slow motion video of the generated image coming to life. Subtle movements, dramatic lighting. Epic orchestral music. 8 seconds.';
  } else if (isCouple) {
    basePrompt = template.coupleVideoPrompt || 'Epic cinematic video of the royal couple. Dramatic movement and lighting. Orchestral music. 10 seconds.';
  } else if (gender === 'queen') {
    basePrompt = template.queenVideoPrompt || 'Elegant cinematic video of the queen. Graceful movement. Ethereal music. 8 seconds.';
  } else {
    basePrompt = template.kingVideoPrompt || 'Powerful cinematic video of the king. Dramatic movement. Epic music. 8 seconds.';
  }

  // Return base prompt without modifications
  return basePrompt;
}

// Extended generatePrompt to handle gender variants
function generatePromptExtended(templateId, isCouple, gender) {
  const template = templateScenes[templateId];

  if (!template) {
    console.warn(`Template ${templateId} not found, using template-01 as fallback`);
    return generatePrompt('template-01', isCouple, gender);
  }

  // Check if template is couple-only
  if (template.coupleOnly && !isCouple) {
    console.warn(`Template ${templateId} is couples only, using template-01 as fallback`);
    return generatePrompt('template-01', false, gender);
  }

  // Bazni prompt header
  const baseHeader = `Ultra-photorealistic, highly cinematic ${template.name || 'romantic couple'} photograph.`;

  // Gender-specific scene enhancement
  let genderEnhancement = '';
  if (template.hasGenderVariants) {
    if (isCouple && template.couplePrompt) {
      genderEnhancement = `\n\nGENDER-SPECIFIC APPEARANCE:\n${template.couplePrompt}`;
    } else if (gender === 'king' || (!isCouple && gender !== 'queen')) {
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

/**
 * Get list of available templates with metadata
 * @returns {Array} Array of template objects with id, name, thumbnail, coupleOnly
 */
function getTemplateList() {
  return Object.entries(templateScenes).map(([id, template]) => ({
    id,
    name: template.name,
    thumbnail: template.thumbnail,
    coupleOnly: template.coupleOnly || false
  }));
}

// Export za Netlify Functions
module.exports = { getPrompt, getVideoPrompt, getTemplateList, templateScenes };
