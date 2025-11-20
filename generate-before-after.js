// Generate Before/After Images for Landing Page
// Run: node generate-before-after.js

import Replicate from 'replicate';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${filepath}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

async function generateBeforeAfter() {
  console.log('🎨 Generating BEFORE/AFTER images for landing page...\n');

  try {
    // ============================================
    // BEFORE Image - Casual Portrait
    // ============================================
    console.log('📸 Generating BEFORE image (casual portrait)...');
    
    const beforePrompt = `professional portrait photo of a young man in his late 20s, casual modern clothing, dark blue t-shirt, natural friendly expression, slight smile, plain light gray studio background, soft studio lighting, natural skin texture, contemporary short hairstyle, relaxed confident pose, looking directly at camera, photorealistic, high quality photography, sharp focus, shallow depth of field, 85mm lens, 8k, professional headshot`;

    const beforeNegative = `crown, medieval, costume, fantasy, armor, royal clothing, dramatic lighting, artistic filter, painted, anime, cartoon, low quality, blurry, distorted, bad anatomy, glasses, sunglasses, hat, multiple people`;

    const beforeOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: beforePrompt,
          aspect_ratio: "2:3",
          output_format: "jpg",
          output_quality: 90,
          safety_tolerance: 2,
        }
      }
    );

    console.log('✅ BEFORE image generated!');
    console.log('URL:', beforeOutput);

    // Download BEFORE image
    await downloadImage(beforeOutput, 'before.jpg');

    // Wait a bit between requests
    console.log('\n⏳ Waiting 3 seconds before next generation...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // ============================================
    // AFTER Image - King in Dubrovnik
    // ============================================
    console.log('👑 Generating AFTER image (King in Dubrovnik)...');

    const afterPrompt = `epic cinematic portrait of a medieval king in his late 20s, Game of Thrones style, wearing ornate golden crown with intricate Celtic patterns, luxurious royal red and gold clothing with detailed embroidery, dark fur collar, regal commanding presence, standing on ancient Dubrovnik city walls, massive weathered stone fortifications, Adriatic Sea with blue water in background, orange terracotta rooftops of old town visible below, dramatic golden hour sunset lighting, warm orange and gold tones, cinematic atmosphere, professional photography, ultra detailed face and clothing, 8k resolution, sharp focus on subject, shallow depth of field, bokeh background, 85mm portrait lens, heroic noble posture, confident expression with slight determination, weathered stone architecture texture, medieval fantasy realism meets Game of Thrones cinematography`;

    const afterNegative = `modern clothing, contemporary, casual, t-shirt, jeans, glasses, sunglasses, smile, happy expression, anime, cartoon, painted, artistic, low quality, blurry, distorted, bad anatomy, deformed, ugly, amateur photo, cell phone photo, tourist, backpack, multiple people, crowd`;

    const afterOutput = await replicate.run(
      "black-forest-labs/flux-1.1-pro",
      {
        input: {
          prompt: afterPrompt,
          aspect_ratio: "2:3",
          output_format: "jpg",
          output_quality: 95,
          safety_tolerance: 2,
        }
      }
    );

    console.log('✅ AFTER image generated!');
    console.log('URL:', afterOutput);

    // Download AFTER image
    await downloadImage(afterOutput, 'after.jpg');

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SUCCESS! Both images generated!');
    console.log('='.repeat(50));
    console.log('\n📁 Files saved:');
    console.log('  - before.jpg (casual portrait)');
    console.log('  - after.jpg (King in Dubrovnik)');
    console.log('\n💰 Cost estimate: ~$0.08 (2 images × $0.04)');
    console.log('\n🚀 Next steps:');
    console.log('  1. Check the images (before.jpg, after.jpg)');
    console.log('  2. If satisfied, update index.html:');
    console.log('     - Replace comparison slider image URLs');
    console.log('  3. Commit and push to GitHub');
    console.log('\n');

    // Save URLs to file
    const urlsData = {
      before: beforeOutput,
      after: afterOutput,
      generated: new Date().toISOString(),
    };

    fs.writeFileSync('generated-images.json', JSON.stringify(urlsData, null, 2));
    console.log('💾 URLs saved to: generated-images.json\n');

  } catch (error) {
    console.error('❌ Error generating images:', error);
    process.exit(1);
  }
}

// Run the generation
if (!process.env.REPLICATE_API_TOKEN) {
  console.error('❌ Error: REPLICATE_API_TOKEN not found in environment variables');
  console.error('Please create a .env file with your Replicate API token');
  console.error('Copy env-template.env to .env and fill in your token');
  process.exit(1);
}

generateBeforeAfter();

