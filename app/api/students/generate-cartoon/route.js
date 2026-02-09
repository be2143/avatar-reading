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
    console.error('Cloudinary upload failed:', error);
    return null;
  }
}

async function generateCartoonCharacter(characterImageUrl, mainCharacterName) {
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
    console.error('Error generating cartoon character:', error);
    return null;
  }
}

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { studentImageUrl, studentName, studentId } = await request.json();

    if (!studentImageUrl || !studentName || !studentId) {
      return NextResponse.json({ error: 'studentImageUrl, studentName, and studentId are required.' }, { status: 400 });
    }

    let validatedImageUrl;
    try { validatedImageUrl = new URL(studentImageUrl).toString(); } catch {
      return NextResponse.json({ error: 'Invalid studentImageUrl URL.' }, { status: 400 });
    }

    const cartoonDataUrl = await generateCartoonCharacter(validatedImageUrl, studentName);
    if (!cartoonDataUrl) {
      return NextResponse.json({ error: 'Failed to generate cartoon image.' }, { status: 500 });
    }

    const cartoonCloudUrl = await uploadDataUrlToCloudinary(cartoonDataUrl, `cartoon_character_${studentId}`);
    if (!cartoonCloudUrl) {
      return NextResponse.json({ error: 'Failed to upload cartoon image to Cloudinary.' }, { status: 500 });
    }

    const durationMs = Date.now() - startTime;
    console.log(`🎨 [CARTOON-GEN] Cartoon generation completed in ${durationMs}ms`);

    return NextResponse.json({ cartoonImageUrl: cartoonCloudUrl }, { status: 200 });
  } catch (error) {
    console.error('🎨 [CARTOON-GEN] ERROR:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate cartoon' }, { status: 500 });
  }
} 