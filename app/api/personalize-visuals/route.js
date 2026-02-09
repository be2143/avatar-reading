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

async function processImageForBuffer(imageBase64) {
  let fullDataUrl = imageBase64;

  if (!imageBase64.startsWith('data:image/')) {
    fullDataUrl = `data:image/png;base64,${imageBase64}`;
  }

  try {
    const parts = fullDataUrl.split(',');
    const base64Data = parts[1];
    const mimeTypeMatch = parts[0].match(/^data:(image\/[a-zA-Z0-9]+);base64/);
    const originalMimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const originalFileExtension = originalMimeType.split('/')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    let processedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1024, withoutEnlargement: true })
      .toFormat('jpeg', { quality: 80, progressive: true })
      .toBuffer();

    return {
      buffer: processedImageBuffer,
      mimeType: 'image/jpeg',
      extension: 'jpeg',
    };
  } catch (error) {
    console.error("Error processing image for buffer:", error);
    return null;
  }
}

async function uploadBufferToCloudinary(imageBuffer, fileNameHint = 'upload') {
  try {
    const base64Image = imageBuffer.toString('base64');
    const uploadResult = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Image}`, {
      folder: 'story_gen_images',
      public_id: `${fileNameHint}_${Date.now()}`,
      resource_type: 'image',
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
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
      return imageUrl;
    } else {
      console.error("No valid image result from generateCartoonBaseImage");
      return null;
    }
  } catch (error) {
    console.error("Error generating cartoon base image:", error);
    return null;
  }
}

// Generate individual story scene using the new API
async function generateStoryScene(cartoonBaseImageUrl, sceneDescription, mainCharacterName, sceneId) {
  try {
    console.log(`🎨 [PERSONALIZE-VISUALS] Generating scene ${sceneId}: "${sceneDescription.substring(0, 50)}..."`);
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/stories/generate-scene`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sceneText: sceneDescription,
        mainCharacterImage: cartoonBaseImageUrl,
        mainCharacterName: mainCharacterName,
        sceneId: sceneId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`🎨 [PERSONALIZE-VISUALS] Scene ${sceneId} failed:`, errorData);
      return null;
    }

    const data = await response.json();
    console.log(`🎨 [PERSONALIZE-VISUALS] Scene ${sceneId} generated successfully`);
    
    return data.imageUrl;
  } catch (error) {
    console.error(`🎨 [PERSONALIZE-VISUALS] Scene ${sceneId} error:`, error);
    return null;
  }
}

// Process scenes in parallel and return results as they complete
async function processScenesInParallel(scenes, cartoonBaseCloudinaryUrl, mainCharacterName) {
  const visualScenes = [];
  const maxConcurrent = 2;
  const queue = [...scenes];
  const activePromises = new Set();

  console.log(`🎨 [PERSONALIZE-VISUALS] Starting parallel processing of ${scenes.length} scenes with max ${maxConcurrent} concurrent requests`);

  while (queue.length > 0 || activePromises.size > 0) {
    // Start new requests if we have capacity
    while (activePromises.size < maxConcurrent && queue.length > 0) {
      const sceneData = queue.shift();
      const { index, sceneText } = sceneData;
      
      console.log(`🎨 [PERSONALIZE-VISUALS] Starting scene ${index + 1}/${scenes.length}`);
      
      const promise = generateStoryScene(cartoonBaseCloudinaryUrl, sceneText, mainCharacterName, index + 1)
        .then(imageUrl => {
          console.log(`🎨 [PERSONALIZE-VISUALS] Scene ${index + 1} completed`);
          return {
            id: index + 1,
            text: sceneText,
            image: imageUrl || 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed',
            error: !imageUrl,
          };
        })
        .catch(err => {
          console.error(`🎨 [PERSONALIZE-VISUALS] Scene ${index + 1} failed:`, err);
          return {
            id: index + 1,
            text: sceneText,
            image: 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed',
            error: true,
          };
        })
        .finally(() => {
          activePromises.delete(promise);
        });

      activePromises.add(promise);
    }

    // Wait for at least one promise to complete
    if (activePromises.size > 0) {
      const completedScene = await Promise.race(activePromises);
      visualScenes.push(completedScene);
      
      // Sort by ID to maintain order
      visualScenes.sort((a, b) => a.id - b.id);
    }
  }

  console.log(`🎨 [PERSONALIZE-VISUALS] ✅ All ${visualScenes.length} scenes processed`);
  return visualScenes;
}

export async function POST(request) {
  let cartoonBaseCloudinaryUrl = null;

  try {
    const body = await request.json();
    const { personalizedStoryText, mainCharacterImage, mainCharacterName, studentId } = body;

    if (!personalizedStoryText || !mainCharacterName) {
      return NextResponse.json({ error: 'Missing required fields: personalizedStoryText and mainCharacterName are required.' }, { status: 400 });
    }

    // Check if we have a student ID to look up cartoon image
    if (studentId) {
      console.log(`🎨 [PERSONALIZE-VISUALS] Checking for existing cartoon image for student ID: ${studentId}`);
      
      // Import and connect to MongoDB
      const { connectMongoDB } = await import("@/lib/mongodb");
      const Student = (await import("@/models/student")).default;
      
      await connectMongoDB();
      
      // Find the student and check for cartoon image
      const student = await Student.findById(studentId);
      if (!student) {
        return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
      }
      
      if (student.cartoonImage && student.cartoonImage.trim() !== '') {
        console.log(`🎨 [PERSONALIZE-VISUALS] Found existing cartoon image for ${student.name}: ${student.cartoonImage.substring(0, 50)}...`);
        cartoonBaseCloudinaryUrl = student.cartoonImage;
      } else {
        console.log(`🎨 [PERSONALIZE-VISUALS] No cartoon image found for student: ${student.name}`);
        return NextResponse.json({ 
          error: 'No cartoon image available for this student. Please ensure the student has a cartoon character generated.',
          studentName: student.name
        }, { status: 400 });
      }
    } else {
      // Fallback to generating cartoon from mainCharacterImage (for backward compatibility)
      if (!mainCharacterImage) {
        return NextResponse.json({ error: 'Either studentId or mainCharacterImage is required.' }, { status: 400 });
      }
      
      let realCharacterCloudinaryUrl;
      try {
        new URL(mainCharacterImage); // Validate URL
        realCharacterCloudinaryUrl = mainCharacterImage;
      } catch {
        return NextResponse.json({ error: 'Invalid mainCharacterImage URL.' }, { status: 400 });
      }

      console.log('🎨 [PERSONALIZE-VISUALS] Generating cartoon base image from mainCharacterImage...');
      const cartoonDataUrl = await generateCartoonBaseImage(realCharacterCloudinaryUrl, mainCharacterName);
      if (!cartoonDataUrl) {
        return NextResponse.json({ error: 'Failed to generate cartoon base image.' }, { status: 500 });
      }

      const cartoonBufferInfo = await processImageForBuffer(cartoonDataUrl);
      if (!cartoonBufferInfo) {
        return NextResponse.json({ error: 'Failed to process cartoon image.' }, { status: 500 });
      }

      cartoonBaseCloudinaryUrl = await uploadBufferToCloudinary(cartoonBufferInfo.buffer, `cartoon_base_${mainCharacterName}`);
      if (!cartoonBaseCloudinaryUrl) {
        return NextResponse.json({ error: 'Failed to upload cartoon image to Cloudinary.' }, { status: 500 });
      }
    }

    const scenes = personalizedStoryText.split('\n\n').filter(s => s.trim());
    console.log(`🎨 [PERSONALIZE-VISUALS] Processing ${scenes.length} scenes in parallel`);

    // Process scenes in parallel with real-time updates
    const visualScenes = await processScenesInParallel(
      scenes.map((sceneText, index) => ({ index, sceneText })),
      cartoonBaseCloudinaryUrl,
      mainCharacterName
    );

    return NextResponse.json({
      visualScenes,
      initialCartoonBaseImageUrl: cartoonBaseCloudinaryUrl,
    }, { status: 200 });

  } catch (error) {
    console.error('🎨 [PERSONALIZE-VISUALS] Fatal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
