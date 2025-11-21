// generate-trading-card-hero.js
// Generira trading card stil sliku za hero sekciju

import { writeFile } from "fs/promises";
import Replicate from "replicate";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error('❌ Missing REPLICATE_API_TOKEN');
  process.exit(1);
}

const replicate = new Replicate({ auth: TOKEN });

// ============================================
// TRADING CARD PROMPT (iz docs/prompts-trading-card-style.md)
// ============================================

const TRADING_CARD_PROMPT = `Ultra-photorealistic, cinematic-style illustration depicting a medieval KING dynamically bursting through the frame of a "Raincrest" trading card. He stands confidently on Dubrovnik's ancient City Walls, raising his ornate sword high, wearing regal medieval armor with golden details and a magnificent crown.

The card's weathered stone-carved border is partially shattered, creating dimensional cracks with energy and light, scattering dust and ancient stone fragments. Inside the card (the background) is a depiction of Dubrovnik's iconic Stradun street and a massive dragon breathing fire in the stormy sky above.

The title "Raincrest" and subtitle "Claim Your Throne" remain visible on the remaining cracked parts of the card. The scene is lit with epic, Game of Thrones-style lighting that emphasizes his royal power and the legendary atmosphere of King's Landing in Dubrovnik.

Upper body shot from head to chest, facing camera directly, front view. Sharp focus on face, detailed facial features, professional portrait photography, 85mm portrait lens, shallow depth of field, face in sharp focus, background slightly blurred. Ultra detailed, photorealistic, 8k resolution, horizontal format, 16:9 aspect ratio.`;

async function generateTradingCardHero() {
  console.log('🎴 Generating trading card style hero image...\n');
  console.log('💰 Cost estimate: ~$0.01-0.02 (1 model call)\n');

  try {
    console.log('🎨 Generating trading card image...');
    console.log('⏳ This will take 10-20 seconds...\n');
    
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: TRADING_CARD_PROMPT
      }
    });

    let imageUrl = extractUrl(output);
    
    console.log('✅ Trading card image generated!');
    console.log(`📥 URL: ${imageUrl}\n`);

    // Download and save
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    await writeFile("hero-trading-card.jpg", Buffer.from(buffer));
    console.log('✅ Saved: hero-trading-card.jpg\n');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Trading card hero image generated!');
    console.log('='.repeat(60));
    console.log('\n📁 File saved: hero-trading-card.jpg');
    console.log('💰 Cost: ~$0.01-0.02');
    console.log('\n🚀 Next steps:');
    console.log('  1. Use hero-trading-card.jpg in index.html');
    console.log('  2. Replace video background with this image');
    console.log('  3. Add ad-like styling to hero section\n');

    return imageUrl;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return output[0];
  if (output?.url) return typeof output.url === 'function' ? output.url() : output.url;
  if (output?.output) return Array.isArray(output.output) ? output.output[0] : output.output;
  return output;
}

// Run
generateTradingCardHero()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });

