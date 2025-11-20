// Generate Before/After Hero Images for Landing Page
// Run: node generate-hero-images.js

const Replicate = require('replicate');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Use existing token from workflow
const TOKEN = process.env.REPLICATE_API_TOKEN;

if (!TOKEN) {
  console.error('❌ Missing REPLICATE_API_TOKEN environment variable.');
  console.error('   Please add your Replicate API token to the environment or .env file.');
  console.error('   Example: set REPLICATE_API_TOKEN=your_token_here');
  process.exit(1);
}

const replicate = new Replicate({ auth: TOKEN });

// Download image from URL
function downloadImage(url, filepath) {
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

function extractUrl(result) {
  if (!result) return null;
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) return result[0];
  if (typeof result === 'object') {
    if (typeof result.url === 'function') return result.url();
    if (typeof result.url === 'string') return result.url;
    if (result.output) return extractUrl(result.output);
    if (result.image) return result.image;
    if (Array.isArray(result.data)) return result.data[0];
  }
  return null;
}

async function generateHeroImages() {
  console.log('🎨 Generating BEFORE/AFTER hero images with face consistency...\n');
  console.log('💰 Cost estimate: ~$0.15 (4 model calls)\n');

  const links = {
    before: '',
    beforeUpload: '',
    medievalBase: '',
    faceSwapped: '',
    after: ''
  };

  try {
    // ============================================
    // BEFORE Image - Advertising portrait
    // ============================================
    console.log('📸 Step 1/4: Generating BEFORE image (advertising portrait)...');
    const beforeOutput = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "award-winning advertising photo of a handsome young man in his late 20s, medium shot from chest up, wearing a fitted dark navy crew neck t-shirt, confident friendly expression, clean shave, modern hairstyle, studio photography with soft gradient background, perfect even lighting, neutral gray tones, photorealistic, ultra sharp focus, 85mm lens, commercial campaign look, high-end fashion brand, subtle vignette, cinematic color grading",
          negative_prompt: "crown, medieval, costume, armor, fantasy clothing, jewelry, hat, glasses, sunglasses, anime, cartoon, painting, low quality, distorted face, extra limbs, multiple people",
          width: 768,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 8,
          num_inference_steps: 60
        }
      }
    );

    links.before = beforeOutput[0] || beforeOutput;
    console.log('✅ BEFORE image generated!');
    console.log(`📥 URL: ${links.before}\n`);
    await downloadImage(links.before, 'before.jpg');

    // Use the same hosted URL for face swap
    links.beforeUpload = links.before;

    // ============================================
    // Medieval Base without specific face
    // ============================================
    console.log('🏰 Step 2/4: Generating medieval base (without personal face)...');
    const medieval = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "cinematic portrait of a medieval king standing on Dubrovnik city walls, ornate golden crown, royal red and gold robes, fur collar, dramatic sunset lighting, Adriatic Sea and terracotta rooftops in background, detailed armor texture, epic fantasy realism, high quality photography, 8k resolution, sharp focus on costume and setting, shallow depth of field, Game of Thrones aesthetic, serious regal pose, confident posture, strong jawline",
          negative_prompt: "modern clothing, casual, smiling, glasses, sunglasses, distorted face, blurry, low quality, anime, cartoon",
          width: 768,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      }
    );

    links.medievalBase = medieval[0] || medieval;
    console.log('✅ Medieval base generated!');
    console.log(`📥 URL: ${links.medievalBase}\n`);

    // ============================================
    // Face Swap
    // ============================================
    console.log('🔄 Step 3/4: Applying face swap (before → medieval king)...');
    const faceSwapRaw = await replicate.run(
      "codeplugtech/face-swap:278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34",
      {
        input: {
          swap_image: links.beforeUpload,
          input_image: links.medievalBase
        }
      }
    );

    links.faceSwapped = extractUrl(faceSwapRaw);

    if (!links.faceSwapped) {
      throw new Error('Face swap did not return a valid image URL.');
    }

    console.log('✅ Face swap complete!');
    console.log(`📥 URL: ${links.faceSwapped}\n`);

    // ============================================
    // CodeFormer Enhancement
    // ============================================
    console.log('✨ Step 4/4: Enhancing final image with CodeFormer...');
    const restoredRaw = await replicate.run(
      "sczhou/codeformer:cc4956dd26fa5a7185d5660cc9100fab1b8070a1d1654a8bb5eb6d443b020bb2",
      {
        input: {
          image: links.faceSwapped,
          upscale: 2,
          face_upsample: true,
          background_enhance: true,
          codeformer_fidelity: 0.1
        }
      }
    );

    links.after = extractUrl(restoredRaw);

    if (!links.after) {
      throw new Error('CodeFormer did not return a valid image URL.');
    }
    console.log('✅ Final AFTER image ready!');
    console.log(`📥 URL: ${links.after}\n`);
    await downloadImage(links.after, 'after.jpg');

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Both hero images generated!');
    console.log('='.repeat(60));
    
    console.log('\n📁 Files saved:');
    console.log('  ✅ before.jpg (advertising portrait)');
    console.log('  ✅ after.jpg (King in Dubrovnik with same face)');
    
    console.log('\n📋 Image URLs:');
    console.log('\nBEFORE (portrait):');
    console.log(links.before);
    console.log('\nMEDIEVAL BASE (no face swap):');
    console.log(links.medievalBase);
    console.log('\nFACE SWAP RESULT:');
    console.log(links.faceSwapped);
    console.log('\nAFTER (final hero image):');
    console.log(links.after);
    
    console.log('\n💰 Cost: ~$0.15 (4 model calls)');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Check the images (before.jpg, after.jpg)');
    console.log('  2. Update index.html comparison slider:');
    console.log('     - Find: class="before-image"');
    console.log('     - Replace src with: before.jpg');
    console.log('     - Find: class="after-image"');
    console.log('     - Replace src with: after.jpg');
    console.log('  3. git add before.jpg after.jpg index.html');
    console.log('  4. git commit -m "Add real before/after hero images"');
    console.log('  5. git push origin main');
    console.log('\n');

    // Save URLs to file
    const urlsData = {
      before: links.before,
      medievalBase: links.medievalBase,
      faceSwapped: links.faceSwapped,
      after: links.after,
      generated: new Date().toISOString(),
      cost: '$0.15 (estimated)'
    };

    fs.writeFileSync('hero-images.json', JSON.stringify(urlsData, null, 2));
    console.log('💾 URLs saved to: hero-images.json\n');

    // Save to links.txt format (compatible with existing workflow)
    const linksContent = `HERO IMAGES FOR LANDING PAGE
Generated: ${new Date().toLocaleString()}

BEFORE (Advertising Portrait):
${links.before}

MEDIEVAL BASE:
${links.medievalBase}

FACE SWAP RESULT:
${links.faceSwapped}

AFTER (King in Dubrovnik):
${links.after}

Cost: ~$0.15
`;
    fs.writeFileSync('hero-links.txt', linksContent);
    console.log('💾 Links saved to: hero-links.txt\n');

    return links;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the generation
generateHeroImages()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });

