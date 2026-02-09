import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';

// Prevent build-time evaluation (sharp requires runtime)
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadDataUrlToCloudinary(dataUrl, filenameHint) {
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'story_gen_images',
      public_id: `${filenameHint}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 1024, crop: 'limit' },
        { fetch_format: 'jpg', quality: 'auto:good' },
      ],
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
}

// Generate individual story scene
async function generateStoryScene(cartoonImageUrl, sceneText, mainCharacterName) {
  const promptText = (
    `Create a colorful, friendly children's story scene illustration for the scene: '${sceneText}'. ` +
    `The main character, ${mainCharacterName || 'a child'}, should be featured and match the cartoon style of the provided reference image. ` +
    `DO NOT include any text or captions in the image. ` +
    `Use a consistent composition and style. The image should be in a square format (1024x1024) with the main character prominently featured. However, avoid having the main character simply standing still: ensure they are engaged in some kind of activity or interacting with other characters according to the scene description.`
  );

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: promptText },
            { type: 'input_image', image_url: cartoonImageUrl },
          ],
        },
      ],
      tools: [{ type: 'image_generation' }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === 'image_generation_call'
    );

    if (imageGenerationOutput?.result) {
      // Ensure we pass a proper data URL to Cloudinary
      const dataUrl = imageGenerationOutput.result.startsWith('data:image/')
        ? imageGenerationOutput.result
        : `data:image/png;base64,${imageGenerationOutput.result}`;

      const publicUrl = await uploadDataUrlToCloudinary(dataUrl, `scene_${Date.now()}`);
      if (!publicUrl) return null;
      return publicUrl;
    }

    return null;
  } catch (error) {
    console.error('🎨 [GENERATE-SCENE] Error generating story scene:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { sceneText, mainCharacterImage, mainCharacterName } = await request.json();

    if (!sceneText || !mainCharacterImage || !mainCharacterName) {
      return NextResponse.json({ 
        error: 'Missing required fields: sceneText, mainCharacterImage, and mainCharacterName are required.' 
      }, { status: 400 });
    }

    const imageUrl = await generateStoryScene(mainCharacterImage, sceneText, mainCharacterName);
    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate scene image.' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/stories/generate-scene:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate scene' }, { status: 500 });
  }
} 