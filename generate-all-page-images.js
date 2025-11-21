// generate-all-page-images.js
// Generira sve slike za stranicu: gallery + scene lokacije

import { writeFile } from "fs/promises";
import Replicate from "replicate";

const TOKEN = process.env.REPLICATE_API_TOKEN;
if (!TOKEN) {
  console.error('❌ Missing REPLICATE_API_TOKEN');
  process.exit(1);
}

const replicate = new Replicate({ auth: TOKEN });

// ============================================
// GALLERY SLIKE - Transformacije (4 slike)
// ============================================

const GALLERY_PROMPTS = [
  {
    name: "gallery-1-city-walls-king",
    prompt: `Ultra-photorealistic portrait of a medieval KING, upper body shot from head to chest, facing camera directly. Royal red and gold embroidered robes, realistic golden crown, strong jawline, serious regal expression. Standing on Dubrovnik's ancient City Walls, weathered limestone fortifications, orange terracotta rooftops below, Adriatic Sea in distance. Dramatic golden hour sunset lighting, Game of Thrones style, professional photography, ultra detailed, photorealistic, 8k resolution, sharp focus on face.`
  },
  {
    name: "gallery-2-stradun-queen",
    prompt: `Ultra-photorealistic portrait of a medieval QUEEN, upper body shot from head to chest, facing camera directly. Regal gown with golden embroidery, magnificent crown adorned with jewels, elegant posture, confident expression. Standing on Dubrovnik's iconic Stradun street, marble pavement, ancient stone buildings, dramatic lighting. Game of Thrones style, professional photography, ultra detailed, photorealistic, 8k resolution, sharp focus on face.`
  },
  {
    name: "gallery-3-lovrijenac-king",
    prompt: `Ultra-photorealistic portrait of a medieval KING, upper body shot from head to chest, facing camera directly. Regal medieval armor with golden details, crown, strong commanding presence, serious expression. Standing at Lovrijenac Fortress in Dubrovnik, ancient stone fortress walls, dramatic cliffs, Adriatic Sea below. Epic cinematic lighting, Game of Thrones style, professional photography, ultra detailed, photorealistic, 8k resolution, sharp focus on face.`
  },
  {
    name: "gallery-4-harbor-queen",
    prompt: `Ultra-photorealistic portrait of a medieval QUEEN, upper body shot from head to chest, facing camera directly. Elegant royal gown, golden crown with jewels, graceful posture, confident expression. Standing at Dubrovnik Harbor, ancient stone harbor walls, boats in background, Adriatic Sea, dramatic sunset lighting. Game of Thrones style, professional photography, ultra detailed, photorealistic, 8k resolution, sharp focus on face.`
  }
];

// ============================================
// SCENE SLIKE - Lokacije (5 slika)
// ============================================

const SCENE_PROMPTS = [
  {
    name: "scene-stradun",
    prompt: `Dubrovnik's iconic Stradun street, main thoroughfare, marble pavement, ancient stone buildings on both sides, medieval architecture, Game of Thrones King's Landing style, dramatic lighting, cinematic, photorealistic, wide angle view, horizontal format.`
  },
  {
    name: "scene-city-walls",
    prompt: `Dubrovnik's ancient City Walls, weathered limestone fortifications, panoramic view, orange terracotta rooftops of old town below, Adriatic Sea in distance, dramatic sky, Game of Thrones style, cinematic, photorealistic, wide angle view, horizontal format.`
  },
  {
    name: "scene-pile-gate",
    prompt: `Dubrovnik's Pile Gate entrance, massive stone gate, medieval architecture, ancient stone walls, dramatic entrance to old town, Game of Thrones King's Landing style, dramatic lighting, cinematic, photorealistic, wide angle view, horizontal format.`
  },
  {
    name: "scene-lovrijenac",
    prompt: `Lovrijenac Fortress in Dubrovnik, ancient stone fortress on cliff, dramatic location, stone walls, Adriatic Sea below, Game of Thrones Red Keep style, epic cinematic lighting, photorealistic, wide angle view, horizontal format.`
  },
  {
    name: "scene-harbor",
    prompt: `Dubrovnik Harbor, ancient stone harbor walls, boats, Adriatic Sea, medieval architecture, Game of Thrones style, dramatic sunset lighting, cinematic, photorealistic, wide angle view, horizontal format.`
  }
];

async function extractUrl(output) {
  // If it's a Promise, wait for it
  if (output && typeof output.then === 'function') {
    output = await output;
  }
  
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) return output[0];
  if (output?.url) {
    const url = typeof output.url === 'function' ? output.url() : output.url;
    return typeof url === 'string' ? url : await extractUrl(url);
  }
  if (output?.output) {
    const out = Array.isArray(output.output) ? output.output[0] : output.output;
    return typeof out === 'string' ? out : await extractUrl(out);
  }
  return output;
}

async function downloadAndSave(url, filename) {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    await writeFile(filename, Buffer.from(buffer));
    console.log(`✅ Saved: ${filename}`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${filename}:`, error.message);
    return false;
  }
}

async function generateGalleryImages() {
  console.log('\n🎨 Generating Gallery Images (4 transformations)...\n');
  
  for (let i = 0; i < GALLERY_PROMPTS.length; i++) {
    const item = GALLERY_PROMPTS[i];
    console.log(`\n[${i + 1}/4] Generating ${item.name}...`);
    console.log('⏳ This will take 10-20 seconds...');
    
    try {
      let output = await replicate.run("google/nano-banana", {
        input: {
          prompt: item.prompt
        }
      });

      // Handle output - wait if promise
      while (output && typeof output.then === 'function') {
        output = await output;
      }
      
      // Extract URL
      let imageUrl;
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output)) {
        imageUrl = output[0];
      } else if (output?.url) {
        imageUrl = typeof output.url === 'function' ? await output.url() : output.url;
      } else if (output?.output) {
        imageUrl = Array.isArray(output.output) ? output.output[0] : output.output;
      } else {
        imageUrl = output;
      }
      
      // Wait if still promise
      while (imageUrl && typeof imageUrl.then === 'function') {
        imageUrl = await imageUrl;
      }
      
      console.log(`✅ Generated! URL: ${imageUrl}`);
      
      const filename = `${item.name}.jpg`;
      await downloadAndSave(imageUrl, filename);
      
      // Wait between requests
      if (i < GALLERY_PROMPTS.length - 1) {
        console.log('⏳ Waiting 3 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Error generating ${item.name}:`, error.message);
    }
  }
}

async function generateSceneImages() {
  console.log('\n🏰 Generating Scene Images (5 locations)...\n');
  
  for (let i = 0; i < SCENE_PROMPTS.length; i++) {
    const item = SCENE_PROMPTS[i];
    console.log(`\n[${i + 1}/5] Generating ${item.name}...`);
    console.log('⏳ This will take 10-20 seconds...');
    
    try {
      let output = await replicate.run("google/nano-banana", {
        input: {
          prompt: item.prompt
        }
      });

      // Handle output - wait if promise
      while (output && typeof output.then === 'function') {
        output = await output;
      }
      
      // Extract URL
      let imageUrl;
      if (typeof output === 'string') {
        imageUrl = output;
      } else if (Array.isArray(output)) {
        imageUrl = output[0];
      } else if (output?.url) {
        imageUrl = typeof output.url === 'function' ? await output.url() : output.url;
      } else if (output?.output) {
        imageUrl = Array.isArray(output.output) ? output.output[0] : output.output;
      } else {
        imageUrl = output;
      }
      
      // Wait if still promise
      while (imageUrl && typeof imageUrl.then === 'function') {
        imageUrl = await imageUrl;
      }
      
      console.log(`✅ Generated! URL: ${imageUrl}`);
      
      const filename = `${item.name}.jpg`;
      await downloadAndSave(imageUrl, filename);
      
      // Wait between requests
      if (i < SCENE_PROMPTS.length - 1) {
        console.log('⏳ Waiting 3 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`❌ Error generating ${item.name}:`, error.message);
    }
  }
}

async function generateAllImages() {
  console.log('🎴 Generating All Page Images');
  console.log('='.repeat(60));
  console.log('💰 Cost estimate: ~$0.09 (9 model calls)');
  console.log('='.repeat(60));
  
  try {
    // Generate Gallery Images
    await generateGalleryImages();
    
    // Wait a bit between sections
    console.log('\n⏳ Waiting 5 seconds before generating scene images...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Generate Scene Images
    await generateSceneImages();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS! All images generated!');
    console.log('='.repeat(60));
    console.log('\n📁 Gallery Images (4):');
    GALLERY_PROMPTS.forEach(item => {
      console.log(`  ✅ ${item.name}.jpg`);
    });
    console.log('\n📁 Scene Images (5):');
    SCENE_PROMPTS.forEach(item => {
      console.log(`  ✅ ${item.name}.jpg`);
    });
    console.log('\n💰 Total Cost: ~$0.09');
    console.log('\n🚀 Next steps:');
    console.log('  1. Update index.html with new image paths');
    console.log('  2. Test the page');
    console.log('  3. Commit and push to GitHub\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run
generateAllImages()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  });

