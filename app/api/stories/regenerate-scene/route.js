import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import { connectMongoDB } from "@/lib/mongodb";
import Story from "@/models/story";
import Student from "@/models/student";

// Prevent build-time evaluation in Vercel while keeping logic the same
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

    // Dynamic import to avoid loading sharp during build
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

// Enhanced regenerate scene function that takes user instructions and current image
async function regenerateStoryScene(cartoonImageUrl, sceneText, mainCharacterName, userInstructions, currentImageUrl) {
  try {
    console.log(`🎨 [REGENERATE-SCENE] Regenerating scene with instructions: "${userInstructions || 'No specific instructions'}"`);

    const isInvalidImage = (url) => {
      if (!url) return true;
      try { new URL(url); } catch { return true; }
      const lower = url.toLowerCase();
      if (lower.includes('placehold.co')) return true;
      if (lower.includes('failed') || lower.includes('no image')) return true;
      return false;
    };

    const validCartoonUrl = isInvalidImage(cartoonImageUrl) ? null : cartoonImageUrl;
    const validCurrentUrl = isInvalidImage(currentImageUrl) ? null : currentImageUrl;

    // Create a comprehensive prompt that includes the original scene, user instructions, and current image context
    let promptText = `Create an improved version of a children's book illustration for the scene: '${sceneText}'. `;
    
    // Add character context if available
    if (mainCharacterName) {
      if (validCartoonUrl) {
        console.log(`🎨 [REGENERATE-SCENE] Using cartoon image for context: ${validCartoonUrl}`);
        promptText += `The main character, ${mainCharacterName}, is provided in the first reference image. Use this EXACT character design and appearance - match the character's style, features, and appearance from the provided reference image. The character must look identical to the reference image. `;
      } else {
        console.log(`🎨 [REGENERATE-SCENE] No valid cartoon image, using default prompt`);
        promptText += `The main character, ${mainCharacterName}, should be prominently featured in the illustration. `;
      }
    } else {
      promptText += `Create a child-friendly illustration for this scene. `;
    }

    // Add user instructions if provided
    if (userInstructions && userInstructions.trim()) {
      promptText += `\n\nIMPORTANT USER INSTRUCTIONS: ${userInstructions.trim()}. Please incorporate these changes into the new illustration. `;
    }

    // Add context about the current image if provided
    if (validCurrentUrl) {
      promptText += `\n\nNote: This is a regeneration of an existing scene. The user wants to modify the current illustration based on their instructions above. `;
    }

    promptText += (
      `\n\nDO NOT include any text or captions in the image. ` +
      `Use consistent composition and style. The image should be square format (1024x1024). ` +
      `Make the illustration colorful, friendly, and suitable for children.`
    );

    // Build content array with text first, then images
    // Character image should be first (main reference), then current image (for context)
    const contentArray = [
      { type: "input_text", text: promptText }
    ];
    
    // Add character reference image FIRST (most important - this is the main character design)
    if (validCartoonUrl) {
      contentArray.push({ type: "input_image", image_url: validCartoonUrl });
      console.log(`🎨 [REGENERATE-SCENE] Added character reference image to content array`);
    } else {
      console.warn(`🎨 [REGENERATE-SCENE] ⚠️ No valid character image available - character may not match expected design`);
    }
    
    // Add current image for context if available (optional - for reference only)
    if (validCurrentUrl) {
      contentArray.push({ type: "input_image", image_url: validCurrentUrl });
      console.log(`🎨 [REGENERATE-SCENE] Added current image for context`);
    }

    // Log the final prompt being sent to the LLM (for debugging)
    console.log(`🎨 [REGENERATE-SCENE] Final prompt to LLM:\n${promptText}`);
    console.log(`🎨 [REGENERATE-SCENE] Context images -> character: ${!!validCartoonUrl}, current: ${!!validCurrentUrl}`);

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: contentArray,
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const dataUrl = `data:image/png;base64,${imageGenerationOutput.result}`;
      console.log(`🎨 [REGENERATE-SCENE] Scene regenerated successfully`);
      
      const processedImage = await processImageForBuffer(dataUrl);
      if (!processedImage) {
        console.error(`🎨 [REGENERATE-SCENE] Failed to process image`);
        return null;
      }
      
      const publicUrl = await uploadBufferToCloudinary(processedImage.buffer, `regenerated_scene_${Date.now()}`);
      console.log(`🎨 [REGENERATE-SCENE] Regenerated scene uploaded to Cloudinary: ${publicUrl?.substring(0, 50)}...`);
      
      return publicUrl;
    } else {
      console.warn("🎨 [REGENERATE-SCENE] No image result. Retrying with character image reference...");
      // Retry with character image included (but simplified prompt)
      const retryContent = [
        { type: "input_text", text: `${promptText}\n\nCreate a 1024x1024 child-friendly illustration.` }
      ];
      
      // Always include character image in retry if available
      if (validCartoonUrl) {
        retryContent.push({ type: "input_image", image_url: validCartoonUrl });
        console.log(`🎨 [RETRY] Including character reference image in retry`);
      }
      
      const retry = await openai.responses.create({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: retryContent,
          },
        ],
        tools: [{ type: "image_generation" }],
      });

      const retryOut = retry.output.find((o) => o.type === "image_generation_call");
      if (retryOut?.result) {
        const dataUrl = `data:image/png;base64,${retryOut.result}`;
        console.log(`🎨 [RETRY] Regenerated scene on retry`);
        const processedImage = await processImageForBuffer(dataUrl);
        if (!processedImage) {
          console.error(`🎨 [RETRY] Failed to process image`);
          return null;
        }
        const publicUrl = await uploadBufferToCloudinary(processedImage.buffer, `regenerated_scene_retry_${Date.now()}`);
        console.log(`🎨 [RETRY] Uploaded to Cloudinary: ${publicUrl?.substring(0, 50)}...`);
        return publicUrl;
      }

      console.error("🎨 [REGENERATE-SCENE] No valid image result after retry");
      return null;
    }
  } catch (error) {
    console.error("🎨 [REGENERATE-SCENE] Error regenerating story scene:", error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { sceneText, mainCharacterImage, studentImage, characterImage, mainCharacterName, instructions, currentImageUrl, storyId, sceneIndex } = await request.json();

    if (!sceneText) {
      return NextResponse.json({ 
        error: 'Missing required field: sceneText is required.' 
      }, { status: 400 });
    }

    console.log(`🎨 [REGENERATE-SCENE] Starting regeneration for scene with instructions: "${instructions || 'No specific instructions'}"`);

    // Step 1: Try to use frontend-provided images first
    let resolvedImage = mainCharacterImage || studentImage || characterImage || null;
    let sourceTag = mainCharacterImage ? 'mainCharacterImage' : (studentImage ? 'studentImage' : (characterImage ? 'characterImage' : 'none'));

    // Step 2: If no image provided and storyId is available, look up from database
    if (!resolvedImage && storyId) {
      console.log(`🎨 [REGENERATE-SCENE] No character image provided, looking up from story ${storyId}...`);
      
      try {
        await connectMongoDB();
        const story = await Story.findById(storyId).populate('student').lean();
        
        if (story) {
          // Check if story is personalized and has a student
          if (story.isPersonalized && story.student) {
            const student = typeof story.student === 'object' ? story.student : await Student.findById(story.student).lean();
            
            if (student && student.cartoonImage && student.cartoonImage.trim() !== '') {
              resolvedImage = student.cartoonImage;
              sourceTag = 'student.cartoonImage';
              console.log(`🎨 [REGENERATE-SCENE] Found student cartoon image for personalized story: ${resolvedImage.substring(0, 50)}...`);
            } else {
              console.log(`🎨 [REGENERATE-SCENE] Story is personalized but student has no cartoon image`);
            }
          }
          
          // If still no image, try story's initialCartoonBaseImageUrl
          if (!resolvedImage && story.initialCartoonBaseImageUrl) {
            resolvedImage = story.initialCartoonBaseImageUrl;
            sourceTag = 'story.initialCartoonBaseImageUrl';
            console.log(`🎨 [REGENERATE-SCENE] Using story's initialCartoonBaseImageUrl: ${resolvedImage.substring(0, 50)}...`);
          }
          
          // If still no image and we have visual scenes, use previous/next scene as reference
          if (!resolvedImage && story.visualScenes && Array.isArray(story.visualScenes) && story.visualScenes.length > 0) {
            // Try to find a reference scene (previous or next)
            let referenceScene = null;
            
            if (typeof sceneIndex === 'number' && sceneIndex >= 0) {
              console.log(`🎨 [REGENERATE-SCENE] Looking for reference scene. Current scene index: ${sceneIndex}, Total scenes: ${story.visualScenes.length}`);
              
              // Try previous scene first (most likely to have the same character)
              if (sceneIndex > 0) {
                const prevScene = story.visualScenes[sceneIndex - 1];
                if (prevScene?.image && prevScene.image.trim() !== '') {
                  referenceScene = prevScene;
                  console.log(`🎨 [REGENERATE-SCENE] Found previous scene (index ${sceneIndex - 1}) with image as character reference`);
                }
              }
              
              // If no previous, try next scene
              if (!referenceScene && sceneIndex < story.visualScenes.length - 1) {
                const nextScene = story.visualScenes[sceneIndex + 1];
                if (nextScene?.image && nextScene.image.trim() !== '') {
                  referenceScene = nextScene;
                  console.log(`🎨 [REGENERATE-SCENE] Found next scene (index ${sceneIndex + 1}) with image as character reference`);
                }
              }
            }
            
            // If no specific scene index or no previous/next found, use first available scene with image
            if (!referenceScene) {
              referenceScene = story.visualScenes.find(scene => 
                scene && scene.image && scene.image.trim() !== '' && 
                scene.image !== currentImageUrl // Don't use the current scene being regenerated
              );
              if (referenceScene) {
                console.log(`🎨 [REGENERATE-SCENE] Using first available scene with image as character reference`);
              }
            }
            
            if (referenceScene && referenceScene.image) {
              resolvedImage = referenceScene.image;
              sourceTag = 'visualScene.reference';
              console.log(`🎨 [REGENERATE-SCENE] ✅ Using visual scene image as character reference: ${resolvedImage.substring(0, 50)}...`);
            } else {
              console.log(`🎨 [REGENERATE-SCENE] No suitable reference scene found in visualScenes`);
            }
          }
        } else {
          console.log(`🎨 [REGENERATE-SCENE] Story not found with ID: ${storyId}`);
        }
      } catch (error) {
        console.error(`🎨 [REGENERATE-SCENE] Error looking up story:`, error);
      }
    }

    // Final fallback: If still no character image, use currentImageUrl as character reference
    // (since it likely contains the character we want to maintain)
    if (!resolvedImage && currentImageUrl) {
      try {
        const testUrl = new URL(currentImageUrl);
        resolvedImage = currentImageUrl;
        sourceTag = 'currentImageUrl.fallback';
        console.log(`🎨 [REGENERATE-SCENE] Using current image as character reference fallback: ${resolvedImage.substring(0, 50)}...`);
      } catch {
        // Invalid URL, skip
      }
    }

    // Validate the character image URL if we found one
    let validatedImageUrl = null;
    if (resolvedImage) {
      try {
        validatedImageUrl = new URL(resolvedImage).toString();
        console.log(`🎨 [REGENERATE-SCENE] ✅ Using character image from ${sourceTag}: ${validatedImageUrl.substring(0, 50)}...`);
      } catch {
        console.warn(`🎨 [REGENERATE-SCENE] Invalid character image URL, proceeding without it`);
      }
    } else {
      console.log(`🎨 [REGENERATE-SCENE] ⚠️ No character image found, regenerating without character reference`);
    }

    // Validate current image URL if provided (for context, not as character reference)
    let validatedCurrentImageUrl = null;
    if (currentImageUrl && currentImageUrl !== resolvedImage) {
      // Only use current image for context if it's different from the character reference
      try {
        validatedCurrentImageUrl = new URL(currentImageUrl).toString();
        console.log(`🎨 [REGENERATE-SCENE] Using current image for context: ${validatedCurrentImageUrl.substring(0, 50)}...`);
      } catch {
        console.warn(`🎨 [REGENERATE-SCENE] Invalid current image URL, proceeding without it`);
      }
    } else if (currentImageUrl === resolvedImage) {
      console.log(`🎨 [REGENERATE-SCENE] Current image is same as character reference, skipping duplicate`);
    }

    // Generate the regenerated scene image
    const newImageUrl = await regenerateStoryScene(
      validatedImageUrl, 
      sceneText, 
      mainCharacterName, 
      instructions, 
      validatedCurrentImageUrl
    );

    if (!newImageUrl) {
      // Graceful fallback: if generation failed, return the current image so UI doesn't break
      console.warn('🎨 [REGENERATE-SCENE] Returning current image as fallback');
      return NextResponse.json({
        success: false,
        imageUrl: validatedCurrentImageUrl || null,
        sceneText: sceneText,
        note: 'Generation failed; returned current image as fallback'
      }, { status: 200 });
    }

    console.log(`🎨 [REGENERATE-SCENE] ✅ SUCCESS: Scene regenerated successfully`);

    return NextResponse.json({
      success: true,
      imageUrl: newImageUrl,
      sceneText: sceneText,
      instructions: instructions
    }, { status: 200 });

  } catch (error) {
    console.error("🎨 [REGENERATE-SCENE] Fatal error:", error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}