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

async function generateHeroImages() {
  console.log('🎨 Generating BEFORE/AFTER hero images for landing page...\n');
  console.log('💰 Cost estimate: ~$0.08 (2 images × $0.04)\n');

  const links = {
    before: '',
    after: ''
  };

  try {
    // ============================================
    // BEFORE Image - Casual Portrait
    // ============================================
    console.log('📸 Step 1/2: Generating BEFORE image (casual portrait)...');
    console.log('⏳ This will take 30-60 seconds...\n');
    
    const beforeOutput = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "professional portrait photo of a young man in his late 20s, casual modern clothing, dark navy blue t-shirt, natural friendly expression, slight smile, plain light gray studio background, soft studio lighting, natural skin texture, contemporary short hairstyle, neat groomed appearance, relaxed confident pose, looking directly at camera, photorealistic, high quality photography, sharp focus, shallow depth of field, 85mm portrait lens, 8k, professional headshot, natural colors",
          
          negative_prompt: "crown, medieval, costume, fantasy, armor, royal clothing, dramatic lighting, artistic filter, painted, anime, cartoon, low quality, blurry, distorted, bad anatomy, glasses, sunglasses, hat, cap, accessories, multiple people, celebrity",
          
          num_outputs: 1,
          width: 768,
          height: 1024,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      }
    );

    links.before = beforeOutput[0] || beforeOutput;
    console.log('✅ BEFORE image generated!');
    console.log(`📥 URL: ${links.before}\n`);

    // Download BEFORE image
    await downloadImage(links.before, 'before.jpg');

    // Wait between requests
    console.log('\n⏳ Waiting 2 seconds before next generation...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ============================================
    // AFTER Image - King in Dubrovnik
    // ============================================
    console.log('👑 Step 2/2: Generating AFTER image (King in Dubrovnik)...');
    console.log('⏳ This will take 30-60 seconds...\n');

    const afterOutput = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: "epic cinematic portrait of a medieval king in his late 20s, Game of Thrones style, wearing ornate golden crown with intricate details, luxurious royal red and gold clothing with detailed embroidery, dark fur collar cape, regal commanding presence, standing on ancient Dubrovnik city walls, massive weathered stone fortifications, Adriatic Sea with deep blue water in background, orange terracotta rooftops of old town visible below, dramatic golden hour sunset lighting, warm orange and gold tones, epic cinematic atmosphere, professional photography, ultra detailed face and royal clothing, 8k resolution, sharp focus on subject, shallow depth of field, bokeh background, 85mm portrait lens, heroic noble posture, confident determined expression, weathered stone architecture texture, medieval fantasy realism, Game of Thrones cinematography style",
          
          negative_prompt: "modern clothing, contemporary, casual, t-shirt, jeans, glasses, sunglasses, smile, happy expression, anime, cartoon, painted, artistic, low quality, blurry, distorted, bad anatomy, deformed, ugly, amateur photo, cell phone photo, tourist, backpack, multiple people, crowd, long flowing hair",
          
          num_outputs: 1,
          width: 768,
          height: 1024,
          guidance_scale: 8,
          num_inference_steps: 50
        }
      }
    );

    links.after = afterOutput[0] || afterOutput;
    console.log('✅ AFTER image generated!');
    console.log(`📥 URL: ${links.after}\n`);

    // Download AFTER image
    await downloadImage(links.after, 'after.jpg');

    // ============================================
    // Summary
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! Both hero images generated!');
    console.log('='.repeat(60));
    
    console.log('\n📁 Files saved:');
    console.log('  ✅ before.jpg (casual portrait)');
    console.log('  ✅ after.jpg (King in Dubrovnik)');
    
    console.log('\n📋 Image URLs:');
    console.log('\nBEFORE:');
    console.log(links.before);
    console.log('\nAFTER:');
    console.log(links.after);
    
    console.log('\n💰 Cost: ~$0.08 (2 images × $0.04)');
    
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
      after: links.after,
      generated: new Date().toISOString(),
      cost: '$0.08 (estimated)'
    };

    fs.writeFileSync('hero-images.json', JSON.stringify(urlsData, null, 2));
    console.log('💾 URLs saved to: hero-images.json\n');

    // Save to links.txt format (compatible with existing workflow)
    const linksContent = `HERO IMAGES FOR LANDING PAGE
Generated: ${new Date().toLocaleString()}

BEFORE (Casual Portrait):
${links.before}

AFTER (King in Dubrovnik):
${links.after}

Cost: ~$0.08
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

