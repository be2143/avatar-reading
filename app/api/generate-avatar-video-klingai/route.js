import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Story from '@/models/story';
import { connectMongoDB } from '@/lib/mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate avatar video using Gemini Veo 3.1 API
 */
export async function POST(request) {
  try {
    const { storyId, sceneId, text, language = 'en' } = await request.json();

    if (!storyId || sceneId === undefined || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: storyId, sceneId, and text are required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Connect to database
    await connectMongoDB();

    // Fetch the story
    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Find the scene
    const scene = story.visualScenes?.find(s => s.id === sceneId);
    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Read avatar image
    const avatarPath = path.join(process.cwd(), 'public', 'avatar', 'avatar.png');
    if (!fs.existsSync(avatarPath)) {
      return NextResponse.json(
        { error: 'Avatar image not found at public/avatar/avatar.png' },
        { status: 404 }
      );
    }

    const avatarImageBuffer = fs.readFileSync(avatarPath);
    const avatarImageBase64 = avatarImageBuffer.toString('base64');

    console.log(`[Avatar Video] Generating video for story ${storyId}, scene ${sceneId}`);

    // Create prompt with dialogue
    // The text will be spoken by the avatar in the video
    const prompt = `A friendly, animated robot avatar with headphones is speaking directly to the camera. The robot has a cheerful expression and is reciting the following text: "${text}". The robot's mouth moves naturally as it speaks, and its expressions match the tone of the text. Clean, professional background.`;

    // Prepare the request body for Veo 3.1
    // Using image-to-video: pass the avatar image as the initial frame
    // This will animate the avatar image
    const requestBody = {
      instances: [{
        prompt: prompt,
        image: {
          bytesBase64Encoded: avatarImageBase64,
          mimeType: 'image/png',
        },
      }],
      parameters: {
        aspectRatio: '16:9',
        resolution: '720p',
        durationSeconds: 8,
      },
    };

    // Step 1: Start the video generation (async operation)
    console.log('[Avatar Video] Starting video generation request...');
    const generateResponse = await fetch(
      `${GEMINI_API_BASE}/models/veo-3.1-generate-preview:predictLongRunning`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': GEMINI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      console.error('[Avatar Video] Generation request failed:', errorText);

      // Handle quota/rate limit errors specifically
      if (generateResponse.status === 429 || errorData?.error?.code === 429) {
        return NextResponse.json(
          { 
            error: 'Gemini API quota exceeded. Please check your API quota and billing details.',
            details: errorData?.error?.message || 'Rate limit exceeded',
            code: 'QUOTA_EXCEEDED'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: `Video generation request failed: ${generateResponse.statusText}`, 
          details: errorData?.error?.message || errorText,
          code: errorData?.error?.code || 'UNKNOWN_ERROR'
        },
        { status: generateResponse.status }
      );
    }

    const generateData = await generateResponse.json();
    const operationName = generateData.name;

    if (!operationName) {
      console.error('[Avatar Video] No operation name in response:', generateData);
      return NextResponse.json(
        { error: 'Failed to start video generation: no operation name returned' },
        { status: 500 }
      );
    }

    console.log(`[Avatar Video] Operation started: ${operationName}`);

    // Step 2: Poll for completion
    let operation = null;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max (60 * 10 seconds)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(
        `${GEMINI_API_BASE}/${operationName}`,
        {
          headers: {
            'x-goog-api-key': GEMINI_API_KEY,
          },
        }
      );

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('[Avatar Video] Status check failed:', errorText);
        return NextResponse.json(
          { error: `Status check failed: ${statusResponse.statusText}` },
          { status: statusResponse.status }
        );
      }

      operation = await statusResponse.json();
      attempts++;

      if (operation.done) {
        console.log(`[Avatar Video] Video generation completed after ${attempts} attempts`);
        break;
      }

      console.log(`[Avatar Video] Polling... attempt ${attempts}/${maxAttempts} (done: ${operation.done})`);
    }

    if (!operation || !operation.done) {
      return NextResponse.json(
        { error: 'Video generation timed out after maximum attempts' },
        { status: 504 }
      );
    }

    // Step 3: Extract video URI and download
    const generatedSamples = operation.response?.generateVideoResponse?.generatedSamples;
    if (!generatedSamples || generatedSamples.length === 0) {
      console.error('[Avatar Video] No generated samples in response:', operation.response);
      return NextResponse.json(
        { error: 'No video generated in response' },
        { status: 500 }
      );
    }

    const videoUri = generatedSamples[0].video?.uri;
    if (!videoUri) {
      console.error('[Avatar Video] No video URI in response:', generatedSamples[0]);
      return NextResponse.json(
        { error: 'No video URI in response' },
        { status: 500 }
      );
    }

    console.log(`[Avatar Video] Downloading video from: ${videoUri}`);

    // Download the video
    const videoResponse = await fetch(videoUri, {
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
      },
    });

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download video: ${videoResponse.statusText}` },
        { status: videoResponse.status }
      );
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Step 4: Upload to Cloudinary
    console.log('[Avatar Video] Uploading video to Cloudinary...');
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: 'avatar-videos',
          public_id: `story-${storyId}-scene-${sceneId}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(videoBuffer);
    });

    const videoUrl = uploadResult.secure_url;
    console.log(`[Avatar Video] Video uploaded: ${videoUrl}`);

    // Step 5: Update the scene with video URL
    const sceneIndex = story.visualScenes.findIndex(s => s.id === sceneId);
    if (sceneIndex !== -1) {
      // Add video field to scene (using Mongoose's markModified for nested updates)
      if (!story.visualScenes[sceneIndex].video) {
        story.visualScenes[sceneIndex].video = videoUrl;
      } else {
        story.visualScenes[sceneIndex].video = videoUrl;
      }
      story.markModified('visualScenes');
      await story.save();
      console.log(`[Avatar Video] Scene ${sceneId} updated with video URL`);
    }

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      message: 'Avatar video generated and saved successfully',
    });

  } catch (error) {
    console.error('[Avatar Video] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar video', details: error.message },
      { status: 500 }
    );
  }
}
