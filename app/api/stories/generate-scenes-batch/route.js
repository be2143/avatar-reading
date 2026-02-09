import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { Redis } from '@upstash/redis';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Redis helper functions
async function getBatchProgress(batchId) {
  try {
    const data = await redis.get(`batch:${batchId}`);
    
    // If data is already an object (might be parsed by Redis client), return it directly
    if (typeof data === 'object' && data !== null) {
      return data;
    }
    
    // If data is a string, try to parse it
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

async function setBatchProgress(batchId, data, expire = 3600) {
  try {
    // Always stringify the data before storing
    await redis.set(`batch:${batchId}`, JSON.stringify(data), { ex: expire });
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
}

async function updateBatchScene(batchId, sceneIndex, sceneData) {
  try {
    const batch = await getBatchProgress(batchId);
    if (!batch) {
      console.error(`Batch ${batchId} not found for update`);
      return null;
    }

    const updatedScenes = [...batch.scenes];
    updatedScenes[sceneIndex] = { 
      ...updatedScenes[sceneIndex], 
      ...sceneData 
    };

    const completedCount = updatedScenes.filter(s => s.completed).length;
    const updatedBatch = {
      ...batch,
      scenes: updatedScenes,
      completedCount: completedCount,
      // Auto-complete if all scenes are done
      completed: completedCount >= batch.totalCount
    };

    const success = await setBatchProgress(batchId, updatedBatch);
    return success ? updatedBatch : null;
  } catch (error) {
    console.error('Redis update error:', error);
    return null;
  }
}

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
    console.log(`🎨 [BATCH-GEN] Generating scene: "${sceneText.substring(0, 50)}..."`);
    
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
      console.log(`🎨 [BATCH-GEN] Scene generated successfully`);
      
      const processedImage = await processImageForBuffer(dataUrl);
      if (!processedImage) {
        console.error(`🎨 [BATCH-GEN] Failed to process image`);
        return null;
      }
      
      const publicUrl = await uploadBufferToCloudinary(processedImage.buffer, `scene_${Date.now()}`);
      console.log(`🎨 [BATCH-GEN] Scene uploaded to Cloudinary: ${publicUrl?.substring(0, 50)}...`);
      
      return publicUrl;
    } else {
      console.error("🎨 [BATCH-GEN] No valid image result from generateStoryScene");
      return null;
    }
  } catch (error) {
    console.error("🎨 [BATCH-GEN] Error generating story scene:", error);
    return null;
  }
}

// Process scenes in parallel and update batch progress
async function processScenesInParallel(scenes, cartoonBaseCloudinaryUrl, mainCharacterName, batchId) {
  const maxConcurrent = 2;
  const queue = [...scenes];
  const activePromises = new Set();

  console.log(`🎨 [BATCH-GEN] Starting parallel processing of ${scenes.length} scenes with max ${maxConcurrent} concurrent requests`);

  while (queue.length > 0 || activePromises.size > 0) {
    // Start new requests if we have capacity
    while (activePromises.size < maxConcurrent && queue.length > 0) {
      const sceneData = queue.shift();
      const { index, sceneText } = sceneData;
      
      console.log(`🎨 [BATCH-GEN] Starting scene ${index + 1}/${scenes.length}`);
      
      const promise = generateStoryScene(cartoonBaseCloudinaryUrl, sceneText, mainCharacterName)
        .then(async imageUrl => {
          console.log(`🎨 [BATCH-GEN] Scene ${index + 1} completed`);
          
          // Update batch progress in Redis
          await updateBatchScene(batchId, index, {
            image: imageUrl || 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed',
            error: !imageUrl,
            completed: true,
          });
          
          return {
            id: index + 1,
            text: sceneText,
            image: imageUrl || 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed',
            error: !imageUrl,
          };
        })
        .catch(async err => {
          console.error(`🎨 [BATCH-GEN] Scene ${index + 1} failed:`, err);
          
          // Update batch progress with error in Redis
          await updateBatchScene(batchId, index, {
            image: 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed',
            error: true,
            completed: true,
          });
          
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
      await Promise.race(activePromises);
    }
  }

  console.log(`🎨 [BATCH-GEN] ✅ All scenes processed for batch ${batchId}`);
  
  // Mark batch as complete in Redis
  const finalBatch = await getBatchProgress(batchId);
  if (finalBatch) {
    await setBatchProgress(batchId, {
      ...finalBatch,
      completed: true,
    });
  }
}

export async function POST(request) {
  try {
    const { personalizedStoryText, mainCharacterImage, mainCharacterName, studentId } = await request.json();

    if (!personalizedStoryText || !mainCharacterName) {
      return NextResponse.json({ 
        error: 'Missing required fields: personalizedStoryText and mainCharacterName are required.' 
      }, { status: 400 });
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Split story into scenes
    const scenes = personalizedStoryText.split('\n\n').filter(s => s.trim());
    
    // Initialize batch progress in Redis
    const initialScenes = scenes.map((sceneText, index) => ({
      id: index + 1,
      text: sceneText,
      image: null,
      error: false,
      completed: false,
    }));
    
    const batchData = {
      scenes: initialScenes,
      completedCount: 0,
      totalCount: scenes.length,
      completed: false,
      startTime: Date.now(),
    };

    await setBatchProgress(batchId, batchData);

    console.log(`🎨 [BATCH-GEN] Created batch ${batchId} with ${scenes.length} scenes`);

    // Get cartoon image URL
    let cartoonImageUrl = mainCharacterImage;
    
    // If studentId is provided, look up the student's cartoon image
    if (studentId) {
      console.log(`🎨 [BATCH-GEN] Checking for existing cartoon image for student ID: ${studentId}`);
      
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
        console.log(`🎨 [BATCH-GEN] Found existing cartoon image for ${student.name}: ${student.cartoonImage.substring(0, 50)}...`);
        cartoonImageUrl = student.cartoonImage;
      } else {
        console.log(`🎨 [BATCH-GEN] No cartoon image found for student: ${student.name}`);
        return NextResponse.json({ 
          error: 'No cartoon image available for this student. Please ensure the student has a cartoon character generated.',
          studentName: student.name
        }, { status: 400 });
      }
    }

    // Start processing in background (don't await)
    processScenesInParallel(
      scenes.map((sceneText, index) => ({ index, sceneText })),
      cartoonImageUrl,
      mainCharacterName,
      batchId
    );

    return NextResponse.json({
      batchId: batchId,
      totalScenes: scenes.length,
      message: 'Batch generation started. Use the batch ID to poll for progress.',
    }, { status: 200 });

  } catch (error) {
    console.error("🎨 [BATCH-GEN] Fatal error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check batch progress
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const batch = await getBatchProgress(batchId);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({
      batchId: batchId,
      scenes: batch.scenes,
      completedCount: batch.completedCount,
      totalCount: batch.totalCount,
      completed: batch.completed,
      progress: Math.round((batch.completedCount / batch.totalCount) * 100),
    }, { status: 200 });

  } catch (error) {
    console.error("🎨 [BATCH-GEN] Error checking progress:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}