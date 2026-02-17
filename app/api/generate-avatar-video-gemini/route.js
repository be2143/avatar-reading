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

const DID_API_KEY = process.env.DID_API_KEY;
const DID_API_BASE = 'https://api.d-id.com';

/**
 * Generate avatar video using D-ID API
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

    if (!DID_API_KEY) {
      return NextResponse.json(
        { error: 'DID_API_KEY is not configured' },
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
    const avatarPath = path.join(process.cwd(), 'public', 'avatar', 'human-avatar.png');
    if (!fs.existsSync(avatarPath)) {
      return NextResponse.json(
        { error: 'Avatar image not found at public/avatar/human-avatar.png' },
        { status: 404 }
      );
    }

    console.log(`[Avatar Video] Generating video for story ${storyId}, scene ${sceneId}`);

    // Step 1: Upload avatar image to Cloudinary to get a public URL
    // D-ID requires a publicly accessible URL for the source image
    console.log('[Avatar Video] Uploading avatar image to Cloudinary...');
    const avatarImageBuffer = fs.readFileSync(avatarPath);
    const avatarImageBase64 = `data:image/png;base64,${avatarImageBuffer.toString('base64')}`;
    
    let avatarImageUrl;
    try {
      const avatarUploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          avatarImageBase64,
          {
            folder: 'avatar-images',
            public_id: 'avatar',
            overwrite: true,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
      avatarImageUrl = avatarUploadResult.secure_url;
      console.log(`[Avatar Video] Avatar image uploaded: ${avatarImageUrl}`);
    } catch (error) {
      console.error('[Avatar Video] Failed to upload avatar image:', error);
      return NextResponse.json(
        { error: 'Failed to upload avatar image to Cloudinary', details: error.message },
        { status: 500 }
      );
    }

    // Step 2: Create D-ID talk request
    // D-ID uses Basic auth with the API key
    const authHeader = `Basic ${Buffer.from(DID_API_KEY).toString('base64')}`;
    
    // Determine voice based on language
    // For English, use a neutral voice. For Arabic, you might want to use an Arabic voice
    // D-ID supports various providers: microsoft, amazon, elevenlabs, etc.
    const voiceProvider = language === 'ar' 
      ? {
          type: 'microsoft',
          voice_id: 'ar-SA-ZariyahNeural' // Arabic voice
        }
      : {
          type: 'amazon',
          voice_id: 'Justin' // English voice
        };

    // Try using custom avatar first, but D-ID requires a human face
    // If face detection fails, we'll fall back to preset avatars
    const requestBody = {
      source_url: avatarImageUrl,
      script: {
        type: 'text',
        input: text,
        provider: voiceProvider,
      },
    };

    console.log('[Avatar Video] Creating D-ID talk...');
    const createTalkResponse = await fetch(
      `${DID_API_BASE}/talks`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!createTalkResponse.ok) {
      const errorText = await createTalkResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: { message: errorText } };
      }

      console.error('[Avatar Video] D-ID talk creation failed:', errorText);

      // Handle quota/rate limit errors
      if (createTalkResponse.status === 429) {
        return NextResponse.json(
          { 
            error: 'D-ID API quota exceeded. Please check your API quota and billing details.',
            details: errorData?.error?.message || 'Rate limit exceeded',
            code: 'QUOTA_EXCEEDED'
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: `D-ID talk creation failed: ${createTalkResponse.statusText}`, 
          details: errorData?.error?.message || errorText,
          code: errorData?.error?.code || 'UNKNOWN_ERROR'
        },
        { status: createTalkResponse.status }
      );
    }

    const talkData = await createTalkResponse.json();
    const talkId = talkData.id;

    if (!talkId) {
      console.error('[Avatar Video] No talk ID in response:', talkData);
      return NextResponse.json(
        { error: 'Failed to create D-ID talk: no talk ID returned' },
        { status: 500 }
      );
    }

    console.log(`[Avatar Video] D-ID talk created: ${talkId}`);

    // Step 3: Poll for completion
    let talkStatus = null;
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes max (60 * 10 seconds)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds (D-ID is faster than Gemini)

      const statusResponse = await fetch(
        `${DID_API_BASE}/talks/${talkId}`,
        {
          headers: {
            'Authorization': authHeader,
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

      talkStatus = await statusResponse.json();
      attempts++;

      if (talkStatus.status === 'done') {
        console.log(`[Avatar Video] Video generation completed after ${attempts} attempts`);
        break;
      }

      if (talkStatus.status === 'error') {
        console.error('[Avatar Video] D-ID talk failed:', talkStatus);
        
        // Handle face detection error specifically
        // Try fallback to preset avatar if custom image fails
        if (talkStatus.error?.kind === 'FaceError' || talkStatus.error?.description?.includes('face not detected')) {
          console.log('[Avatar Video] Face not detected, trying preset avatar fallback...');
          
          // Use D-ID's preset avatar (Amber) as fallback
          const fallbackRequestBody = {
            presenter_id: 'v2_public_Amber@0zSz8kflCN', // D-ID's default presenter
            script: {
              type: 'text',
              input: text,
              provider: voiceProvider,
            },
          };

          const fallbackResponse = await fetch(
            `${DID_API_BASE}/clips`,
            {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fallbackRequestBody),
            }
          );

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            const fallbackTalkId = fallbackData.id;
            console.log(`[Avatar Video] Fallback preset avatar talk created: ${fallbackTalkId}`);
            
            // Poll the fallback talk
            let fallbackStatus = null;
            let fallbackAttempts = 0;
            const maxFallbackAttempts = 60;

            while (fallbackAttempts < maxFallbackAttempts) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              const statusResponse = await fetch(
                `${DID_API_BASE}/clips/${fallbackTalkId}`,
                {
                  headers: { 'Authorization': authHeader },
                }
              );

              if (!statusResponse.ok) {
                break;
              }

              fallbackStatus = await statusResponse.json();
              fallbackAttempts++;

              if (fallbackStatus.status === 'done') {
                console.log(`[Avatar Video] Fallback video generation completed`);
                const fallbackVideoUrl = fallbackStatus.result_url;
                if (fallbackVideoUrl) {
                  // Download and upload to Cloudinary
                  const videoResponse = await fetch(fallbackVideoUrl);
                  if (videoResponse.ok) {
                    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
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

                    const finalVideoUrl = uploadResult.secure_url;
                    const sceneIndex = story.visualScenes.findIndex(s => s.id === sceneId);
                    if (sceneIndex !== -1) {
                      story.visualScenes[sceneIndex].video = finalVideoUrl;
                      story.markModified('visualScenes');
                      await story.save();
                    }

                    return NextResponse.json({
                      success: true,
                      videoUrl: finalVideoUrl,
                      message: 'Avatar video generated using preset avatar (robot avatar not supported)',
                      usedFallback: true,
                    });
                  }
                }
                break;
              }

              if (fallbackStatus.status === 'error') {
                break; // Fall through to error response
              }

              console.log(`[Avatar Video] Fallback polling... attempt ${fallbackAttempts}/${maxFallbackAttempts} (status: ${fallbackStatus.status})`);
            }
          }

          // If fallback also failed, return error
          return NextResponse.json(
            { 
              error: 'Face not detected in avatar image',
              details: 'D-ID requires a human face with clear facial features (eyes, nose, mouth). The robot avatar image does not contain detectable facial landmarks. The system attempted to use a preset avatar as fallback but it also failed.',
              code: 'FACE_NOT_DETECTED',
              suggestion: 'Consider using a human face image or D-ID preset avatars'
            },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Video generation failed', 
            details: talkStatus.error?.description || talkStatus.error || 'Unknown error',
            code: talkStatus.error?.kind || 'GENERATION_ERROR'
          },
          { status: 500 }
        );
      }

      console.log(`[Avatar Video] Polling... attempt ${attempts}/${maxAttempts} (status: ${talkStatus.status})`);
    }

    if (!talkStatus || talkStatus.status !== 'done') {
      return NextResponse.json(
        { error: 'Video generation timed out after maximum attempts' },
        { status: 504 }
      );
    }

    // Step 4: Get video URL from D-ID
    const videoUrl = talkStatus.result_url;
    if (!videoUrl) {
      console.error('[Avatar Video] No video URL in response:', talkStatus);
      return NextResponse.json(
        { error: 'No video URL in response' },
        { status: 500 }
      );
    }

    console.log(`[Avatar Video] Downloading video from D-ID: ${videoUrl}`);

    // Step 5: Download the video from D-ID
    const videoResponse = await fetch(videoUrl);

    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download video from D-ID: ${videoResponse.statusText}` },
        { status: videoResponse.status }
      );
    }

    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Step 6: Upload to Cloudinary for permanent storage
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

    const finalVideoUrl = uploadResult.secure_url;
    console.log(`[Avatar Video] Video uploaded to Cloudinary: ${finalVideoUrl}`);

    // Step 7: Update the scene with video URL
    const sceneIndex = story.visualScenes.findIndex(s => s.id === sceneId);
    if (sceneIndex !== -1) {
      story.visualScenes[sceneIndex].video = finalVideoUrl;
      story.markModified('visualScenes');
      await story.save();
      console.log(`[Avatar Video] Scene ${sceneId} updated with video URL`);
    }

    return NextResponse.json({
      success: true,
      videoUrl: finalVideoUrl,
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
