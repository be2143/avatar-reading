import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

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

// Generate individual story scene
async function generateStoryScene(cartoonImageUrl, sceneText, mainCharacterName) {
  const promptText = (
    `Create a colorful, friendly children's book illustration for the scene: '${sceneText}'. ` +
    `The main character, ${mainCharacterName || 'a child'}, should be featured and match the cartoon style of the provided reference image. ` +
    `DO NOT include any text or captions in the image. ` +
    `Use consistent composition and style. The image should be square format (1024x1024) with the main character prominently featured.`
  );

  try {
    console.log(`🎨 [GENERATE-SCENE] Generating scene: "${sceneText.substring(0, 50)}..."`);
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText },
            { type: "input_image", image_url: cartoonImageUrl },
          ],
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const dataUrl = `data:image/png;base64,${imageGenerationOutput.result}`;
      console.log(`🎨 [GENERATE-SCENE] Scene generated successfully`);
      
      const processedImage = await processImageForBuffer(dataUrl);
      if (!processedImage) {
        console.error(`🎨 [GENERATE-SCENE] Failed to process image`);
        return null;
      }
      
      const publicUrl = await uploadBufferToCloudinary(processedImage.buffer, `scene_${Date.now()}`);
      console.log(`🎨 [GENERATE-SCENE] Scene uploaded to Cloudinary: ${publicUrl?.substring(0, 50)}...`);
      
      return publicUrl;
    } else {
      console.error("🎨 [GENERATE-SCENE] No valid image result from generateStoryScene");
      return null;
    }
  } catch (error) {
    console.error("🎨 [GENERATE-SCENE] Error generating story scene:", error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { sceneText, mainCharacterImage, mainCharacterName, sceneId } = await request.json();

    if (!sceneText || !mainCharacterImage || !mainCharacterName) {
      return NextResponse.json({ 
        error: 'Missing required fields: sceneText, mainCharacterImage, and mainCharacterName are required.' 
      }, { status: 400 });
    }

    console.log(`🎨 [GENERATE-SCENE] Starting generation for scene ${sceneId || 'unknown'}`);

    // Generate the scene image
    const imageUrl = await generateStoryScene(mainCharacterImage, sceneText, mainCharacterName);

    if (!imageUrl) {
      return NextResponse.json({ 
        error: 'Failed to generate scene image.',
        sceneId: sceneId
      }, { status: 500 });
    }

    console.log(`🎨 [GENERATE-SCENE] ✅ SUCCESS: Scene ${sceneId} generated successfully`);

    return NextResponse.json({
      success: true,
      sceneId: sceneId,
      imageUrl: imageUrl,
      sceneText: sceneText
    }, { status: 200 });

  } catch (error) {
    console.error("🎨 [GENERATE-SCENE] Fatal error:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      sceneId: request.body?.sceneId
    }, { status: 500 });
  }
} 