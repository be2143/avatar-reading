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

// Process image for buffer
// Helper to process base64 image to buffer (same as visual generation)
async function processImageForBuffer(imageBase64) {
  let fullDataUrl = imageBase64;
  if (!imageBase64.startsWith('data:image/')) {
    fullDataUrl = `data:image/png;base64,${imageBase64}`;
  }

  try {
    console.log('🎨 [CARTOON-GEN] Processing image: Extracting base64 data...');
    const parts = fullDataUrl.split(',');
    const base64Data = parts[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log(`🎨 [CARTOON-GEN] Processing image: Original buffer size: ${imageBuffer.length} bytes`);

    console.log('🎨 [CARTOON-GEN] Processing image: Applying Sharp transformations...');
    const processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer();

    console.log(`🎨 [CARTOON-GEN] Processing image: Processed buffer size: ${processedImageBuffer.length} bytes`);
    console.log('🎨 [CARTOON-GEN] Processing image: SUCCESS');

    return {
      buffer: processedImageBuffer,
      mimeType: 'image/jpeg',
      extension: 'jpeg',
    };
  } catch (error) {
    console.error("🎨 [CARTOON-GEN] Processing image: ERROR:", error);
    console.error("🎨 [CARTOON-GEN] Processing image: Error stack:", error.stack);
    return null;
  }
}

// Upload to Cloudinary
async function uploadBufferToCloudinary(buffer, filenameHint) {
  try {
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: Starting upload for ${filenameHint}...`);
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: Buffer size: ${buffer.length} bytes`);
    
    const base64Image = buffer.toString('base64');
    const uploadOptions = {
      folder: 'story_gen_images', // Same folder as visual generation
      public_id: `${filenameHint}_${Date.now()}`,
      resource_type: 'image',
    };
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: Options:`, uploadOptions);

    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, uploadOptions);
    
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: SUCCESS`);
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: URL: ${result.secure_url}`);
    console.log(`🎨 [CARTOON-GEN] Cloudinary upload: Public ID: ${result.public_id}`);
    
    return result.secure_url;
  } catch (error) {
    console.error("🎨 [CARTOON-GEN] Cloudinary upload: ERROR:", error);
    console.error("🎨 [CARTOON-GEN] Cloudinary upload: Error details:", {
      message: error.message,
      status: error.http_code,
      name: error.name
    });
    return null;
  }
}
// Generate cartoon character from student image (using same logic as visual generation)
async function generateCartoonCharacter(characterImageUrl, mainCharacterName) {
  const promptText = (
    `Create a full-body, simple, cute, and consistent cartoon illustration of an 8-year-old character named ${mainCharacterName || 'a child'} based on the provided reference image. ` +
    `The style should be like a friendly children's storybook illustration. ` +
    `The character should be standing, facing forward, on a plain white background, showing their full appearance clearly.`
  );

  try {
    console.log(`🎨 [CARTOON-GEN] Using GPT-4o with image input for cartoon generation...`);
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText },
            { type: "input_image", image_url: characterImageUrl },
          ],
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const imageUrl = `data:image/png;base64,${imageGenerationOutput.result}`;
      console.log(`🎨 [CARTOON-GEN] Successfully generated cartoon using GPT-4o`);
      return imageUrl;
    } else {
      console.error("🎨 [CARTOON-GEN] No valid image result from generateCartoonCharacter");
      return null;
    }
  } catch (error) {
    console.error("🎨 [CARTOON-GEN] Error generating cartoon character:", error);
    if (error.response) {
      console.error("🎨 [CARTOON-GEN] OpenAI API Error details:", error.response.status, error.response.data);
    }
    return null;
  }
}

export async function POST(request) {
  const startTime = Date.now();
  console.log('🎨 [CARTOON-GEN] Starting cartoon generation process...');
  
  try {
    const { studentImageUrl, studentName, studentId } = await request.json();
    console.log(`🎨 [CARTOON-GEN] Received request for student: ${studentName} (ID: ${studentId})`);

    if (!studentImageUrl || !studentName || !studentId) {
      console.error('🎨 [CARTOON-GEN] Missing required fields:', { 
        hasImageUrl: !!studentImageUrl, 
        hasName: !!studentName, 
        hasId: !!studentId 
      });
      return NextResponse.json({ 
        error: 'Student image URL, name, and ID are required.' 
      }, { status: 400 });
    }

    console.log(`🎨 [CARTOON-GEN] Input validation passed. Image URL: ${studentImageUrl.substring(0, 50)}...`);
    console.log(`🎨 [CARTOON-GEN] Starting cartoon generation for: ${studentName}`);

    // Generate cartoon character
    console.log(`🎨 [CARTOON-GEN] Step 1: Calling DALL-E for cartoon generation...`);
    const cartoonDataUrl = await generateCartoonCharacter(studentImageUrl, studentName);
    if (!cartoonDataUrl) {
      console.error('🎨 [CARTOON-GEN] Step 1 FAILED: DALL-E generation returned null');
      return NextResponse.json({ 
        error: 'Failed to generate cartoon character.' 
      }, { status: 500 });
    }
    console.log(`🎨 [CARTOON-GEN] Step 1 SUCCESS: DALL-E generated cartoon data URL (length: ${cartoonDataUrl.length})`);

    // Process the generated image
    console.log(`🎨 [CARTOON-GEN] Step 2: Processing cartoon image with Sharp...`);
    const cartoonBufferInfo = await processImageForBuffer(cartoonDataUrl);
    if (!cartoonBufferInfo) {
      console.error('🎨 [CARTOON-GEN] Step 2 FAILED: Image processing returned null');
      return NextResponse.json({ 
        error: 'Failed to process cartoon image.' 
      }, { status: 500 });
    }
    console.log(`🎨 [CARTOON-GEN] Step 2 SUCCESS: Image processed. Buffer size: ${cartoonBufferInfo.buffer.length} bytes`);

    // Upload to Cloudinary
    console.log(`🎨 [CARTOON-GEN] Step 3: Uploading to Cloudinary...`);
    const cartoonCloudinaryUrl = await uploadBufferToCloudinary(
      cartoonBufferInfo.buffer, 
      `cartoon_base_${studentName.replace(/\s+/g, '_')}`
    );
    
    if (!cartoonCloudinaryUrl) {
      console.error('🎨 [CARTOON-GEN] Step 3 FAILED: Cloudinary upload returned null');
      return NextResponse.json({ 
        error: 'Failed to upload cartoon image to Cloudinary.' 
      }, { status: 500 });
    }
    console.log(`🎨 [CARTOON-GEN] Step 3 SUCCESS: Uploaded to Cloudinary: ${cartoonCloudinaryUrl}`);

    const totalTime = Date.now() - startTime;
    console.log(`🎨 [CARTOON-GEN] ✅ COMPLETE: Cartoon generated successfully for ${studentName} in ${totalTime}ms`);
    console.log(`🎨 [CARTOON-GEN] Final URL: ${cartoonCloudinaryUrl}`);

    return NextResponse.json({ 
      message: 'Cartoon character generated successfully',
      cartoonImageUrl: cartoonCloudinaryUrl,
      studentId: studentId,
      generationTime: totalTime
    }, { status: 200 });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`🎨 [CARTOON-GEN] ❌ ERROR after ${totalTime}ms:`, error);
    console.error('🎨 [CARTOON-GEN] Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to generate cartoon character.' 
    }, { status: 500 });
  }
} 