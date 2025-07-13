// app/api/generate-visuals/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY, // Ensure this is correctly set in your .env.local
});

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('API: generate-visuals - Incoming body:', JSON.stringify(body, null, 2));

    const { personalizedStoryText, mainCharacterImage, mainCharacterName } = body;

    if (!personalizedStoryText) {
      console.error('API: generate-visuals - Missing personalizedStoryText');
      return NextResponse.json({ error: 'Personalized story text is required.' }, { status: 400 });
    }

    // 1. Split the story into scenes (paragraphs)
    // We'll split by double newlines, then filter out any empty strings
    const scenes = personalizedStoryText.split('\n\n').filter(s => s.trim() !== '');

    const visualScenes = [];

    console.log(`API: generate-visuals - Found ${scenes.length} scenes to process.`);

    // 2. Loop through each scene and generate an image
    for (const [index, sceneText] of scenes.entries()) {
      if (!sceneText.trim()) {
        console.warn(`API: generate-visuals - Skipping empty scene at index ${index}.`);
        continue; // Skip if the scene text is empty
      }

      // Construct a DALL-E prompt for the current scene
      // We instruct DALL-E to generate a children's book style illustration
      const imagePrompt = `Create a children's book illustration for the following scene: "${sceneText}". The main character is ${mainCharacterName || 'a child'}. Ensure the style is friendly, colorful, and engaging for kids.`;

      try {
        console.log(`API: generate-visuals - Generating image for scene ${index + 1} (out of ${scenes.length}). Prompt (first 100 chars): "${imagePrompt.substring(0, 100)}..."`);

        // DALL-E 3 is generally recommended for better prompt adherence and quality
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1, // Generate one image per scene
          size: "1024x1024", // Standard size, can be "1792x1024" or "1024x1792"
          response_format: "url", // Request a URL for the image
        });

        const imageUrl = imageResponse.data[0].url;

        visualScenes.push({
          id: index + 1, // Unique ID for the scene
          text: sceneText, // Original text of the scene
          image: imageUrl, // URL of the generated image
        });

        console.log(`API: generate-visuals - Successfully generated image for scene ${index + 1}.`);

        // Optional: Add a small delay to reduce chances of hitting rate limits, especially for many scenes
        // await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between calls
      } catch (sceneError) {
        console.error(`API: generate-visuals - Error generating image for scene ${index + 1}:`, sceneError);
        // Add a placeholder image if image generation fails for a specific scene
        visualScenes.push({
          id: index + 1,
          text: sceneText,
          image: 'https://via.placeholder.com/400x300.png?text=Image+Failed', // Placeholder for failed generation
          error: true, // Indicate that this scene's image failed
        });
      }
    }

    console.log('API: generate-visuals - All scenes processed. Returning visualScenes.');
    return NextResponse.json({ visualScenes }, { status: 200 });

  } catch (error) {
    console.error('API: generate-visuals - Top-level error generating visuals:', error);
    // Differentiate between OpenAI API errors and other errors
    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error Details:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });
    }
    return NextResponse.json(
      { error: 'Failed to generate visuals. An internal server error occurred.' },
      { status: 500 }
    );
  }
}