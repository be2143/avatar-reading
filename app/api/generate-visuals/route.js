import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to process base64 image to buffer
async function processImageForBuffer(imageBase64) {
  let fullDataUrl = imageBase64;
  if (!imageBase64.startsWith('data:image/')) {
    fullDataUrl = `data:image/png;base64,${imageBase64}`;
  }

  try {
    const parts = fullDataUrl.split(',');
    const base64Data = parts[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const { default: sharp } = await import('sharp');
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    return {
      buffer: processedImageBuffer,
      mimeType: 'image/jpeg',
      extension: 'jpeg',
    };
  } catch (error) {
    console.error("Image processing error:", error);
    return null;
  }
}

// Upload to Cloudinary
async function uploadBufferToCloudinary(buffer, filenameHint) {
  try {
    const base64Image = buffer.toString('base64');
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, {
      folder: 'story_gen_images',
      public_id: `${filenameHint}_${Date.now()}`,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return null;
  }
}

// Generate individual story scene using the new API
async function generateStoryScene(cartoonImageUrl, sceneText, mainCharacterName, sceneId) {
  try {
    console.log(`🎨 [GENERATE-VISUALS] Generating scene ${sceneId}: "${sceneText.substring(0, 50)}..."`);
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stories/generate-scene`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneText: sceneText,
        mainCharacterImage: cartoonImageUrl,
        mainCharacterName: mainCharacterName,
        sceneId: sceneId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`🎨 [GENERATE-VISUALS] Scene ${sceneId} failed:`, errorData);
      return null;
    }

    const data = await response.json();
    console.log(`🎨 [GENERATE-VISUALS] Scene ${sceneId} generated successfully`);
    
    return data.imageUrl;
  } catch (error) {
    console.error(`🎨 [GENERATE-VISUALS] Scene ${sceneId} error:`, error);
    return null;
  }
}

// Entry point - now uses batch generation approach
export async function POST(request) {
  try {
    const { personalizedStoryText, mainCharacterImage, mainCharacterName } = await request.json();

    if (!personalizedStoryText || !mainCharacterImage || !mainCharacterName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    let validatedImageUrl;
    try {
      validatedImageUrl = new URL(mainCharacterImage).toString();
      console.log(`🎨 [GENERATE-VISUALS] Using provided character image: ${validatedImageUrl.substring(0, 50)}...`);
    } catch {
      return NextResponse.json({ error: 'Invalid character image URL' }, { status: 400 });
    }

    // Use the provided image directly as the cartoon base image
    const cartoonCloudUrl = validatedImageUrl;
    console.log(`🎨 [GENERATE-VISUALS] Using character image directly as cartoon base: ${cartoonCloudUrl.substring(0, 50)}...`);

    const scenes = personalizedStoryText
      .split('\n\n')
      .filter((scene) => scene.trim() !== '');

    console.log(`🎨 [GENERATE-VISUALS] Starting batch generation for ${scenes.length} scenes...`);
    
    // Start batch generation
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stories/generate-scenes-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizedStoryText: personalizedStoryText, 
        mainCharacterImage: cartoonCloudUrl,
        mainCharacterName: mainCharacterName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.error && errorData.error.includes('No cartoon image available')) {
        throw new Error(`No cartoon image available for ${mainCharacterName}. Please try again after some time.`);
      }
      throw new Error(errorData.error || 'Failed to start batch generation.');
    }

    const data = await response.json();
    const batchId = data.batchId;
    
    console.log(`🎨 [GENERATE-VISUALS] Started batch generation with ID: ${batchId}`);
    
    // Return batchId and initialCartoonBaseImageUrl to the frontend
    return NextResponse.json({
      initialCartoonBaseImageUrl: cartoonCloudUrl,
      batchId: batchId
    }, { status: 200 });

  } catch (error) {
    console.error("Fatal backend error:", error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
