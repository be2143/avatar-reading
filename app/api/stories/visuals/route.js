// app/api/stories/visuals/route.js
import { NextResponse } from 'next/server';
import { generateImageFromText } from '@/lib/imageGenerator';
import { processStoryForVisuals } from '@/lib/storyVisuals';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { storyText, visualStyle = "cartoon" } = await request.json();

    if (!storyText) {
      return NextResponse.json({ error: 'Story text is required.' }, { status: 400 });
    }

    console.log("Processing story to identify main character and scenes...");
    const { mainCharacterDescription, otherCharacters, scenes } = await processStoryForVisuals(storyText);
    console.log("Main Character identified:", mainCharacterDescription);
    console.log("Other Characters:", otherCharacters);
    console.log("Scenes identified:", scenes.length);

    const generatedVisuals = [];

    // Combine all character descriptions into one strong prefix for DALL-E
    // Emphasize the main character heavily
    let allCharacterPrompts = `Main character: ${mainCharacterDescription}.`;
    if (otherCharacters.length > 0) {
        allCharacterPrompts += " Other characters present: " + otherCharacters.join(' ');
    }

    // Loop through each identified scene to generate an image
    for (const scene of scenes) {
      // Construct a highly detailed prompt for DALL-E
      // Always start with the consistent character description
      const dallEPrompt = `
      **A children's story illustration in a ${visualStyle} style.**
      **Consistent Character Details:** ${allCharacterPrompts}
      **Scene:** "${scene.sceneText}".
      Ensure the main character, exactly as described, is present and consistently portrayed in this scene. Focus on key visual elements described in the scene text. The overall image should be simple, friendly, and appealing to young children.
      `;

      console.log(`Generating image for Scene ${scene.sceneNumber} with prompt (truncated): ${dallEPrompt.substring(0, 200)}...`);
      const imageUrl = await generateImageFromText(dallEPrompt);

      generatedVisuals.push({
        sceneNumber: scene.sceneNumber,
        sceneText: scene.sceneText,
        imageUrl: imageUrl,
      });
    }

    return NextResponse.json({
      message: 'Visual scenes and characters generated successfully',
      mainCharacterDescription: mainCharacterDescription, // Send back main character
      otherCharacters: otherCharacters, // Send back other characters
      visualScenes: generatedVisuals,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/stories/visuals:', error);
    return NextResponse.json({ error: `Failed to generate visual scenes: ${error.message}` }, { status: 500 });
  }
}