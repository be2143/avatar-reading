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

function ensureDataUrl(imageBase64OrUrl) {
  if (imageBase64OrUrl.startsWith('data:image/')) return imageBase64OrUrl;
  return `data:image/png;base64,${imageBase64OrUrl}`;
}

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
    console.error('Error uploading image to Cloudinary:', error);
    return null;
  }
}

async function generateCartoonBaseImage(characterImageUrl, mainCharacterName) {
  const promptText = (
    `Create a full-body, simple, cute, and consistent cartoon illustration of an 8-year-old character named ${mainCharacterName || 'a child'} based on the provided reference image. ` +
    `The style should be like a friendly children's storybook illustration. ` +
    `The character should be standing, facing forward, on a plain white background, showing their full appearance clearly.`
  );

  try {
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: promptText },
            { type: 'input_image', image_url: characterImageUrl },
          ],
        },
      ],
      tools: [{ type: 'image_generation' }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === 'image_generation_call'
    );

    if (imageGenerationOutput?.result) {
      return ensureDataUrl(imageGenerationOutput.result);
    }
    return null;
  } catch (error) {
    console.error('Error generating cartoon base image:', error);
    return null;
  }
}

async function generateStoryScene(cartoonBaseImageUrl, sceneDescription, mainCharacterName, sceneId) {
  try {
    const promptText = (
      `Create a colorful, friendly children's story scene illustration for the scene: '${sceneDescription}'. ` +
      `The main character, ${mainCharacterName || 'a child'}, should be featured and match the cartoon style of the provided reference image. ` +
      `DO NOT include any text or captions in the image. ` +
      `Use a consistent composition and style. The image should be in a square format (1024x1024) with the main character prominently featured. However, avoid having the main character simply standing still: ensure they are engaged in some kind of activity or interacting with other characters according to the scene description.`
    );

    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: promptText },
            { type: 'input_image', image_url: cartoonBaseImageUrl },
          ],
        },
      ],
      tools: [{ type: 'image_generation' }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === 'image_generation_call'
    );

    if (!imageGenerationOutput?.result) return null;

    const dataUrl = ensureDataUrl(imageGenerationOutput.result);
    const uploadedUrl = await uploadDataUrlToCloudinary(dataUrl, `personalized_scene_${sceneId}`);
    return uploadedUrl;
  } catch (error) {
    console.error(`🎨 [PERSONALIZE-VISUALS] Scene ${sceneId} error:`, error);
    return null;
  }
}

export async function POST(request) {
  let cartoonBaseCloudinaryUrl = null;

  try {
    const { personalizedStoryText, mainCharacterImage, mainCharacterName } = await request.json();

    if (!personalizedStoryText || !mainCharacterImage || !mainCharacterName) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Use the provided image as base reference
    let validatedImageUrl;
    try {
      validatedImageUrl = new URL(mainCharacterImage).toString();
    } catch {
      return NextResponse.json({ error: 'Invalid mainCharacterImage URL' }, { status: 400 });
    }

    cartoonBaseCloudinaryUrl = validatedImageUrl;

    const scenes = personalizedStoryText.split('\n\n').filter((s) => s.trim());

    const visualScenes = await Promise.all(
      scenes.map(async (sceneText, index) => {
        const url = await generateStoryScene(cartoonBaseCloudinaryUrl, sceneText, mainCharacterName, index + 1);
        return { sceneNumber: index + 1, sceneText, imageUrl: url };
      })
    );

    return NextResponse.json({ visualScenes, initialCartoonBaseImageUrl: cartoonBaseCloudinaryUrl }, { status: 200 });
  } catch (error) {
    console.error('🎨 [PERSONALIZE-VISUALS] ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to process visuals' }, { status: 500 });
  }
}
