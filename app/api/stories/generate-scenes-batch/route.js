import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import { Redis } from '@upstash/redis';

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

function ensureDataUrl(imageBase64OrUrl) {
  if (typeof imageBase64OrUrl === 'string' && imageBase64OrUrl.startsWith('data:image/')) return imageBase64OrUrl;
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

// Analyze story to identify environments and characters needed, and map characters to scenes
async function analyzeStoryForVisualPlanning(personalizedStoryText, mainCharacterName = '') {
  try {
    // Split story into scenes first
    const scenes = personalizedStoryText.split('\n\n').filter(s => s.trim());
    
    const mainCharContext = mainCharacterName ? `The main character is "${mainCharacterName}" - DO NOT include this character in the characters list. ` : 'The main character will be provided separately - DO NOT include the main character in the characters list. ';
    
    const analysisPrompt = `Analyze the following story text and identify:
1. All unique environments/locations/settings mentioned (e.g., "classroom", "playground", "home kitchen", "park")
2. All characters mentioned (${mainCharContext}Only include OTHER characters like family members, friends, teachers, etc. - include their names exactly as they appear)
3. Any recurring visual elements or themes
4. For each scene, identify which OTHER characters (not the main character) appear in that scene

The story has ${scenes.length} scenes separated by double line breaks.

Story text:
${personalizedStoryText}

Return a JSON object with this structure:
{
  "environments": ["environment1", "environment2", ...],
  "characters": ["character1", "character2", ...],
  "visualThemes": ["theme1", "theme2", ...],
  "sceneCharacterMap": {
    "scene1": ["character1", "character2"],
    "scene2": ["character1"],
    ...
  }
}

IMPORTANT: ${mainCharContext}Only list OTHER characters, not the main character. Be specific and concise. Only include environments and characters that are actually mentioned in the story. Use exact character names as they appear in the text.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert at analyzing children\'s stories for visual planning. Return only valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const analysisText = completion.choices[0]?.message?.content?.trim();
    if (!analysisText) {
      return { environments: [], characters: [], visualThemes: [], sceneCharacterMap: {} };
    }

    const analysis = JSON.parse(analysisText);
    
    // Build scene character map using scene indices
    const sceneCharacterMap = {};
    scenes.forEach((sceneText, index) => {
      const sceneKey = `scene${index + 1}`;
      // Try to get from AI analysis, or analyze the scene directly
      if (analysis.sceneCharacterMap && analysis.sceneCharacterMap[sceneKey]) {
        sceneCharacterMap[index] = analysis.sceneCharacterMap[sceneKey];
      } else {
        // Fallback: analyze scene text for character mentions
        const sceneLower = sceneText.toLowerCase();
        const mentionedChars = (analysis.characters || []).filter(char => 
          sceneLower.includes(char.toLowerCase())
        );
        sceneCharacterMap[index] = mentionedChars;
      }
    });
    
    return {
      environments: analysis.environments || [],
      characters: analysis.characters || [],
      visualThemes: analysis.visualThemes || [],
      sceneCharacterMap: sceneCharacterMap
    };
  } catch (error) {
    console.error('Error analyzing story for visual planning:', error);
    return { environments: [], characters: [], visualThemes: [], sceneCharacterMap: {} };
  }
}

// Check for existing character images from student's characterImages field
async function getExistingCharacterImages(studentId, characterNames) {
  if (!studentId || !characterNames || characterNames.length === 0) {
    return {};
  }

  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const Student = (await import("@/models/student")).default;
    
    await connectMongoDB();
    
    // Find the student and check their characterImages field
    const student = await Student.findById(studentId).select('characterImages cartoonImage').lean();
    
    if (!student) {
      return {};
    }
    
    const existingCharacters = {};
    
    // Check student's characterImages field (Map or object)
    if (student.characterImages) {
      // Handle both Map (from Mongoose) and plain object
      const characterImages = student.characterImages instanceof Map 
        ? Object.fromEntries(student.characterImages) 
        : student.characterImages;
      
      console.log(`🎨 [BATCH-GEN] Checking ${Object.keys(characterImages).length} saved character images for: ${characterNames.join(', ')}`);
      console.log(`🎨 [BATCH-GEN] Saved character keys: ${Object.keys(characterImages).join(', ')}`);
      
      // Create a normalized lookup map (lowercase key -> original key + value)
      const normalizedLookup = {};
      Object.keys(characterImages).forEach(storedKey => {
        const normalizedKey = storedKey.toLowerCase();
        if (!normalizedLookup[normalizedKey]) {
          normalizedLookup[normalizedKey] = {
            originalKey: storedKey,
            imageUrl: characterImages[storedKey]
          };
        }
      });
      
      // Match character names (case-insensitive)
      characterNames.forEach(charName => {
        const normalizedName = charName.toLowerCase();
        const match = normalizedLookup[normalizedName];
        
        if (match && match.imageUrl) {
          // Use the exact character name from the current story as the key
          existingCharacters[charName] = match.imageUrl;
          console.log(`🎨 [BATCH-GEN] Found existing character image for "${charName}" (stored as "${match.originalKey}") from student's saved characters`);
        }
      });
    } else {
      console.log(`🎨 [BATCH-GEN] No characterImages field found for student ${studentId}`);
    }
    
    return existingCharacters;
  } catch (error) {
    console.error('Error checking for existing character images:', error);
    return {};
  }
}

// Identify if a character is a family member/relative
function identifyFamilyRelationship(characterName, studentName) {
  const familyKeywords = ['mom', 'mother', 'dad', 'father', 'parent', 'guardian', 'sister', 'brother', 'sibling', 
                          'grandma', 'grandmother', 'grandpa', 'grandfather', 'aunt', 'uncle', 'cousin'];
  const charLower = characterName.toLowerCase();
  
  for (const keyword of familyKeywords) {
    if (charLower.includes(keyword)) {
      // Determine relationship type
      if (charLower.includes('mom') || charLower.includes('mother')) {
        return 'the mother';
      } else if (charLower.includes('dad') || charLower.includes('father')) {
        return 'the father';
      } else if (charLower.includes('sister')) {
        return 'a sister';
      } else if (charLower.includes('brother')) {
        return 'a brother';
      } else if (charLower.includes('grandma') || charLower.includes('grandmother')) {
        return 'the grandmother';
      } else if (charLower.includes('grandpa') || charLower.includes('grandfather')) {
        return 'the grandfather';
      } else if (charLower.includes('aunt')) {
        return 'an aunt';
      } else if (charLower.includes('uncle')) {
        return 'an uncle';
      } else if (charLower.includes('cousin')) {
        return 'a cousin';
      } else if (charLower.includes('parent') || charLower.includes('guardian')) {
        return 'a parent';
      } else if (charLower.includes('sibling')) {
        return 'a sibling';
      }
      return 'a family member';
    }
  }
  return null;
}

// Save character images to student model
async function saveCharacterImagesToStudent(studentId, characterImages) {
  if (!studentId || !characterImages || Object.keys(characterImages).length === 0) {
    console.log(`🎨 [BATCH-GEN] Skipping save: studentId=${!!studentId}, images=${Object.keys(characterImages || {}).length}`);
    return;
  }

  try {
    const { connectMongoDB } = await import("@/lib/mongodb");
    const Student = (await import("@/models/student")).default;
    
    await connectMongoDB();
    
    const student = await Student.findById(studentId);
    if (!student) {
      console.error(`🎨 [BATCH-GEN] Student ${studentId} not found for saving character images`);
      return;
    }
    
    // Initialize characterImages map if it doesn't exist
    // Mongoose Maps need to be initialized properly
    if (!student.characterImages || !(student.characterImages instanceof Map)) {
      student.characterImages = new Map();
    }
    
    // Add new character images (normalize keys to lowercase for consistent storage)
    let savedCount = 0;
    const imagesToSave = {};
    
    Object.keys(characterImages).forEach(charName => {
      if (characterImages[charName] && characterImages[charName].trim() !== '') {
        // Store with lowercase key for case-insensitive matching
        const normalizedKey = charName.toLowerCase();
        imagesToSave[normalizedKey] = characterImages[charName];
        savedCount++;
        console.log(`🎨 [BATCH-GEN] Preparing to save character image for "${charName}" (stored as "${normalizedKey}") to student ${studentId}`);
      }
    });
    
    if (savedCount > 0) {
      // Set all character images at once
      Object.keys(imagesToSave).forEach(normalizedKey => {
        student.characterImages.set(normalizedKey, imagesToSave[normalizedKey]);
      });
      
      // Mark the field as modified to ensure Mongoose saves it
      student.markModified('characterImages');
      
      await student.save();
      console.log(`🎨 [BATCH-GEN] ✅ Successfully saved ${savedCount} character image(s) to student ${studentId}`);
      
      // Verify the save by reading it back (without lean to get the actual Map)
      const verifyStudent = await Student.findById(studentId).select('characterImages');
      if (verifyStudent && verifyStudent.characterImages) {
        const savedImages = verifyStudent.characterImages instanceof Map 
          ? Object.fromEntries(verifyStudent.characterImages) 
          : verifyStudent.characterImages;
        const savedKeys = Object.keys(savedImages);
        console.log(`🎨 [BATCH-GEN] Verification: Student now has ${savedKeys.length} saved character image(s): ${savedKeys.join(', ')}`);
        savedKeys.forEach(key => {
          console.log(`🎨 [BATCH-GEN]   - "${key}": ${savedImages[key]?.substring(0, 50)}...`);
        });
      } else {
        console.warn(`🎨 [BATCH-GEN] ⚠️ Verification failed: Could not read back saved character images`);
      }
    } else {
      console.warn(`🎨 [BATCH-GEN] No character images to save (all were empty/null)`);
    }
  } catch (error) {
    console.error('🎨 [BATCH-GEN] Error saving character images to student:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

// Generate background image for an environment
async function generateBackgroundImage(environment, visualThemes = []) {
  try {
    const themesContext = visualThemes.length > 0 ? ` Incorporate visual themes: ${visualThemes.join(', ')}.` : '';
    const promptText = (
      `Create a colorful, friendly children's story background illustration for: "${environment}". ` +
      `${themesContext} ` +
      `This is a background scene without characters. ` +
      `DO NOT include any text or captions. ` +
      `Use a consistent, warm, child-friendly art style. ` +
      `The image should be in a square format (1024x1024) suitable for placing characters in the foreground.`
    );

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText }
          ],
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const dataUrl = ensureDataUrl(imageGenerationOutput.result);
      const publicUrl = await uploadDataUrlToCloudinary(dataUrl, `bg_${environment.replace(/\s+/g, '_')}_${Date.now()}`);
      return publicUrl;
    }
    return null;
  } catch (error) {
    console.error(`Error generating background for ${environment}:`, error);
    return null;
  }
}

// Generate character image, optionally using a base image (e.g., for family members)
async function generateCharacterImage(characterName, characterDescription = '', baseImageUrl = null, relationshipToBase = '') {
  try {
    const descriptionContext = characterDescription ? ` Description: ${characterDescription}.` : '';
    const relationshipContext = relationshipToBase ? ` This character is ${relationshipToBase} to the person in the base image. ` : '';
    const baseImageContext = baseImageUrl ? ` Use the provided base image as a reference to create a character that looks related (similar features, style, and appearance). ` : '';
    
    let promptText = '';
    if (baseImageUrl && relationshipToBase) {
      // For family members/relatives, use the base image
      promptText = (
        `Create a colorful, friendly children's story character illustration: "${characterName}". ` +
        `${relationshipContext}` +
        `${baseImageContext}` +
        `${descriptionContext} ` +
        `This character should be in a consistent cartoon style suitable for a children's story, and should look related to the person in the base image. ` +
        `DO NOT include any text or captions. ` +
        `The character should be clearly visible and in a neutral pose. ` +
        `The image should be in a square format (1024x1024).`
      );
    } else {
      // For non-family characters, generate without base image
      promptText = (
      `Create a colorful, friendly children's story character illustration: "${characterName}". ` +
      `${descriptionContext} ` +
      `This character should be in a consistent cartoon style suitable for a children's story. ` +
      `DO NOT include any text or captions. ` +
      `The character should be clearly visible and in a neutral pose. ` +
      `The image should be in a square format (1024x1024).`
    );
    }

    const inputContent = [
      { type: "input_text", text: promptText }
    ];

    // Add base image if provided
    if (baseImageUrl) {
      inputContent.push({ type: "input_image", image_url: baseImageUrl });
    }

    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: inputContent,
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const dataUrl = ensureDataUrl(imageGenerationOutput.result);
      const publicUrl = await uploadDataUrlToCloudinary(dataUrl, `char_${characterName.replace(/\s+/g, '_')}_${Date.now()}`);
      return publicUrl;
    }
    return null;
  } catch (error) {
    console.error(`Error generating character ${characterName}:`, error);
    return null;
  }
}

// Generate all visual assets (backgrounds and characters) before scene generation
async function generateVisualAssets(visualPlan, studentId, studentCartoonImage = null, studentName = '') {
  const generatedAssets = {
    backgrounds: {},
    characters: {}
  };

  console.log(`🎨 [BATCH-GEN] Generating visual assets...`);
  console.log(`🎨 [BATCH-GEN] Environments to generate: ${visualPlan.environments?.length || 0}`);
  console.log(`🎨 [BATCH-GEN] Characters to generate: ${visualPlan.characters?.length || 0}`);

  // Generate all backgrounds in parallel
  if (visualPlan.environments && visualPlan.environments.length > 0) {
    const backgroundPromises = visualPlan.environments.map(async (env) => {
      const bgUrl = await generateBackgroundImage(env, visualPlan.visualThemes || []);
      if (bgUrl) {
        generatedAssets.backgrounds[env] = bgUrl;
        console.log(`🎨 [BATCH-GEN] Generated background for: ${env}`);
      }
      return { env, bgUrl };
    });

    await Promise.all(backgroundPromises);
  }

  // Check for existing character images first
  let existingCharacters = {};
  if (studentId && visualPlan.characters && visualPlan.characters.length > 0) {
    existingCharacters = await getExistingCharacterImages(studentId, visualPlan.characters);
    console.log(`🎨 [BATCH-GEN] Found ${Object.keys(existingCharacters).length} existing character images`);
    
    // Add existing characters to generated assets
    Object.assign(generatedAssets.characters, existingCharacters);
  }

  // Generate only new characters (those that don't already exist)
  const charactersToGenerate = visualPlan.characters.filter(charName => 
    !existingCharacters[charName]
  );

  if (charactersToGenerate.length > 0) {
    console.log(`🎨 [BATCH-GEN] Generating ${charactersToGenerate.length} new character(s): ${charactersToGenerate.join(', ')}`);
    
    // Get student's cartoon image if available for family members
    let baseImageUrl = studentCartoonImage;
    if (!baseImageUrl && studentId) {
      try {
        const { connectMongoDB } = await import("@/lib/mongodb");
        const Student = (await import("@/models/student")).default;
        await connectMongoDB();
        const student = await Student.findById(studentId).select('cartoonImage name').lean();
        if (student) {
          baseImageUrl = student.cartoonImage;
          if (!studentName && student.name) {
            studentName = student.name;
          }
        }
      } catch (error) {
        console.error('Error fetching student cartoon image:', error);
      }
    }
    
    const characterPromises = charactersToGenerate.map(async (charName) => {
      // Check if this is a family member
      const relationship = identifyFamilyRelationship(charName, studentName);
      const useBaseImage = relationship && baseImageUrl;
      
      if (useBaseImage) {
        console.log(`🎨 [BATCH-GEN] Generating family member "${charName}" using student's cartoon image as base (${relationship})`);
      }
      
      const charUrl = await generateCharacterImage(
        charName, 
        '', 
        useBaseImage ? baseImageUrl : null,
        relationship || ''
      );
      
      if (charUrl) {
        generatedAssets.characters[charName] = charUrl;
        console.log(`🎨 [BATCH-GEN] Generated character: ${charName}${useBaseImage ? ' (using base image)' : ''}`);
      }
      return { charName, charUrl };
    });

    await Promise.all(characterPromises);
    
    // Save newly generated character images to student
    const newCharacterImages = {};
    charactersToGenerate.forEach(charName => {
      if (generatedAssets.characters[charName]) {
        newCharacterImages[charName] = generatedAssets.characters[charName];
      }
    });
    
    if (studentId && Object.keys(newCharacterImages).length > 0) {
      await saveCharacterImagesToStudent(studentId, newCharacterImages);
    }
  } else {
    console.log(`🎨 [BATCH-GEN] All characters already exist, reusing existing images`);
  }

  console.log(`🎨 [BATCH-GEN] ✅ Visual assets ready:`, {
    backgrounds: Object.keys(generatedAssets.backgrounds).length,
    characters: Object.keys(generatedAssets.characters).length,
    existingCharacters: Object.keys(existingCharacters).length,
    newCharacters: charactersToGenerate.length
  });

  return generatedAssets;
}

// Generate individual story scene using consistent elements and pre-generated assets
async function generateStoryScene(cartoonImageUrl, sceneText, mainCharacterName, learningPreferences, challenges, additionalNotes, visualPlan, generatedAssets, sceneIndex) {
  let contextInfo = '';
  if (learningPreferences) {
    contextInfo += `Consider the student's learning preferences: ${learningPreferences}. `;
  }
  if (challenges) {
    contextInfo += `Be mindful of the student's challenges: ${challenges}. `;
  }
  if (additionalNotes) {
    contextInfo += `Additional context: ${additionalNotes}. `;
  }
  
  // Build consistent visual context from the plan and generated assets
  let consistencyContext = '';
  // Use the student's cartoon image as the main character reference (DO NOT generate a new one)
  const inputImages = [{ type: "input_image", image_url: cartoonImageUrl }];
  
  // Add context that the main character image is provided and should be used as-is
  consistencyContext += `The main character "${mainCharacterName}" is provided in the reference image - use this exact character design and do not create a new version. `;
  
  // Match scene to environment and use pre-generated background
  let matchingEnv = null;
  if (visualPlan.environments && visualPlan.environments.length > 0) {
    const sceneLower = sceneText.toLowerCase();
    matchingEnv = visualPlan.environments.find(env => 
      sceneLower.includes(env.toLowerCase())
    );
    
    if (matchingEnv && generatedAssets?.backgrounds?.[matchingEnv]) {
      consistencyContext += `This scene takes place in a ${matchingEnv}. Use the provided ${matchingEnv} background as a reference to maintain exact visual consistency. `;
      inputImages.push({ type: "input_image", image_url: generatedAssets.backgrounds[matchingEnv] });
      console.log(`🎨 [BATCH-GEN] Using pre-generated background for: ${matchingEnv}`);
    } else if (visualPlan.environments.length > 0) {
      consistencyContext += `Maintain consistency with the story's environments: ${visualPlan.environments.join(', ')}. `;
    }
  }
  
  // Use sceneCharacterMap to identify which characters appear in this scene
  let mentionedChars = [];
  if (visualPlan.sceneCharacterMap && sceneIndex !== undefined && visualPlan.sceneCharacterMap[sceneIndex]) {
    // Use the pre-analyzed character mapping for this scene
    mentionedChars = visualPlan.sceneCharacterMap[sceneIndex];
    console.log(`🎨 [BATCH-GEN] Scene ${sceneIndex + 1} characters from map: ${mentionedChars.join(', ')}`);
  } else if (visualPlan.characters && visualPlan.characters.length > 0) {
    // Fallback: analyze scene text for character mentions
    const sceneLower = sceneText.toLowerCase();
    visualPlan.characters.forEach(charName => {
      if (sceneLower.includes(charName.toLowerCase())) {
        mentionedChars.push(charName);
      }
    });
  }
  
  // Add pre-generated character images as references for ALL characters in this scene
    if (mentionedChars.length > 0) {
      consistencyContext += `Include these characters consistently: ${mentionedChars.join(', ')}. `;
    // Add pre-generated character images as references
    mentionedChars.forEach(charName => {
      if (generatedAssets?.characters?.[charName]) {
        inputImages.push({ type: "input_image", image_url: generatedAssets.characters[charName] });
        console.log(`🎨 [BATCH-GEN] Using pre-generated character reference: ${charName}`);
      } else {
        console.warn(`🎨 [BATCH-GEN] Character "${charName}" mentioned but no image available`);
      }
    });
  }
  
  // Add context about other characters in the story
  if (visualPlan.characters && visualPlan.characters.length > 0) {
    const otherChars = visualPlan.characters.filter(c => !mentionedChars.includes(c));
    if (otherChars.length > 0) {
      consistencyContext += `Other characters in this story that may appear: ${otherChars.join(', ')}. `;
    }
  }
  
  // Add visual themes
  if (visualPlan.visualThemes && visualPlan.visualThemes.length > 0) {
    consistencyContext += `Maintain these visual themes throughout: ${visualPlan.visualThemes.join(', ')}. `;
  }

  // Build prompt with asset references
  let assetReferences = '';
  if (matchingEnv && generatedAssets?.backgrounds?.[matchingEnv]) {
    assetReferences += `Use the provided ${matchingEnv} background image as the exact environment setting. `;
  }
  if (mentionedChars.length > 0) {
    const charsWithAssets = mentionedChars.filter(c => generatedAssets?.characters?.[c]);
    if (charsWithAssets.length > 0) {
      assetReferences += `Use the provided character reference images for: ${charsWithAssets.join(', ')}. These characters must appear exactly as shown in their reference images. `;
    }
  }
  
  const promptText = (
    `Create a colorful, friendly children's story scene illustration for the scene: '${sceneText}'. ` +
    `The main character, ${mainCharacterName || 'a child'}, is provided in the first reference image - use this EXACT character design and appearance. Do NOT create a new or different version of the main character. ` +
    `${assetReferences}` +
    `${consistencyContext}` +
    `${contextInfo}` +
    `DO NOT include any text or captions in the image. ` +
    `Use a consistent composition and style. The image should be in a square format (1024x1024) with the main character prominently featured. However, avoid having the main character simply standing still: ensure they are engaged in some kind of activity or interacting with other characters according to the scene description. ` +
    `CRITICAL: The main character must match the provided reference image exactly. Maintain visual consistency with the established story style, characters, and environments across all scenes. When reference images are provided, use them as exact visual references for consistency.`
  );

  try {
    console.log(`🎨 [BATCH-GEN] Generating scene: "${sceneText.substring(0, 50)}..."`);
    console.log(`🎨 [BATCH-GEN] Using ${inputImages.length} reference image(s)`);
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: promptText },
            ...inputImages,
          ],
        },
      ],
      tools: [{ type: "image_generation" }],
    });

    const imageGenerationOutput = response.output.find(
      (output) => output.type === "image_generation_call"
    );

    if (imageGenerationOutput?.result) {
      const dataUrl = ensureDataUrl(imageGenerationOutput.result);
      const publicUrl = await uploadDataUrlToCloudinary(dataUrl, `scene_${Date.now()}`);
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
async function processScenesInParallel(scenes, cartoonBaseCloudinaryUrl, mainCharacterName, batchId, learningPreferences, challenges, additionalNotes, visualPlan, studentId) {
  const maxConcurrent = 2;
  const queue = [...scenes];
  const activePromises = new Set();

  console.log(`🎨 [BATCH-GEN] Starting parallel processing of ${scenes.length} scenes with max ${maxConcurrent} concurrent requests`);
  console.log(`🎨 [BATCH-GEN] Using visual plan:`, visualPlan);

  // Step 1: Generate all visual assets (backgrounds and characters) FIRST
  console.log(`🎨 [BATCH-GEN] Phase 1: Generating visual assets...`);
  // Get student info for family member generation
  let studentCartoonImage = cartoonBaseCloudinaryUrl;
  let studentName = mainCharacterName;
  if (studentId) {
    try {
      const { connectMongoDB } = await import("@/lib/mongodb");
      const Student = (await import("@/models/student")).default;
      await connectMongoDB();
      const student = await Student.findById(studentId).select('cartoonImage name').lean();
      if (student) {
        studentCartoonImage = student.cartoonImage || cartoonBaseCloudinaryUrl;
        studentName = student.name || mainCharacterName;
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  }
  const generatedAssets = await generateVisualAssets(visualPlan, studentId, studentCartoonImage, studentName);
  
  // Store visual plan and generated assets in batch data for reference
  const batch = await getBatchProgress(batchId);
  if (batch) {
    await setBatchProgress(batchId, {
      ...batch,
      visualPlan: {
        environments: visualPlan.environments || [],
        characters: visualPlan.characters || [],
        themes: visualPlan.visualThemes || [],
        sceneCharacterMap: visualPlan.sceneCharacterMap || {}
      },
      generatedAssets: generatedAssets
    });
  }

  console.log(`🎨 [BATCH-GEN] Visual plan and assets stored:`, {
    environments: visualPlan.environments?.length || 0,
    characters: visualPlan.characters?.length || 0,
    themes: visualPlan.visualThemes?.length || 0,
    generatedBackgrounds: Object.keys(generatedAssets.backgrounds).length,
    generatedCharacters: Object.keys(generatedAssets.characters).length
  });

  // Step 2: Now generate scenes using the pre-generated assets
  console.log(`🎨 [BATCH-GEN] Phase 2: Generating scenes with consistent assets...`);

  while (queue.length > 0 || activePromises.size > 0) {
    // Start new requests if we have capacity
    while (activePromises.size < maxConcurrent && queue.length > 0) {
      const sceneData = queue.shift();
      const { index, sceneText } = sceneData;
      
      console.log(`🎨 [BATCH-GEN] Starting scene ${index + 1}/${scenes.length}`);
      
      const promise = generateStoryScene(
        cartoonBaseCloudinaryUrl, 
        sceneText, 
        mainCharacterName, 
        learningPreferences, 
        challenges, 
        additionalNotes,
        visualPlan,
        generatedAssets,
        index
      )
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
    const { personalizedStoryText, mainCharacterImage, mainCharacterName, studentId, learningPreferences, challenges, additionalNotes } = await request.json();

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

    // Step 1: Analyze story for visual planning
    console.log(`🎨 [BATCH-GEN] Analyzing story for visual planning...`);
    const visualPlan = await analyzeStoryForVisualPlanning(personalizedStoryText, mainCharacterName);
    
    // Filter out main character from characters list if it was mistakenly included
    if (mainCharacterName && visualPlan.characters) {
      const mainCharLower = mainCharacterName.toLowerCase();
      visualPlan.characters = visualPlan.characters.filter(char => 
        char.toLowerCase() !== mainCharLower
      );
      // Also filter from sceneCharacterMap
      Object.keys(visualPlan.sceneCharacterMap || {}).forEach(sceneIndex => {
        if (visualPlan.sceneCharacterMap[sceneIndex]) {
          visualPlan.sceneCharacterMap[sceneIndex] = visualPlan.sceneCharacterMap[sceneIndex].filter(char =>
            char.toLowerCase() !== mainCharLower
          );
        }
      });
      console.log(`🎨 [BATCH-GEN] Filtered out main character "${mainCharacterName}" from character list`);
    }
    
    console.log(`🎨 [BATCH-GEN] Visual plan:`, visualPlan);

    // Start processing in background (don't await)
    processScenesInParallel(
      scenes.map((sceneText, index) => ({ index, sceneText })),
      cartoonImageUrl,
      mainCharacterName,
      batchId,
      learningPreferences,
      challenges,
      additionalNotes,
      visualPlan,
      studentId
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