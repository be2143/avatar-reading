// app/api/stories/visuals/route.js
import { NextResponse } from 'next/server'; // Import NextResponse for proper API responses
import { generateImageFromText } from '@/lib/imageGenerator'; // Import your image generation utility
import { splitStoryIntoParagraphs } from '@/lib/storyProcessor'; // Assuming you have this utility

// NOTE: You do NOT need to import connectDB or Story model here
// if you have chosen to remove database persistence from this specific API endpoint,
// as per our previous discussion. If you *do* intend to use the DB,
// then uncomment/add those imports and the DB logic.


export async function POST(request) {
  try {
    // Parse the request body
    const { storyId, storyText, visualStyle } = await request.json();

    // Basic validation
    if (!storyText || !visualStyle) {
      return NextResponse.json({ error: 'Story text and visual style are required.' }, { status: 400 });
    }

    // Split story into paragraphs (assuming this utility exists)
    const paragraphs = splitStoryIntoParagraphs(storyText);
    const generatedImages = [];

    // Loop through paragraphs to generate images
    for (const paragraph of paragraphs) {
      const prompt = `Generate a ${visualStyle} style illustration for a children's story depicting: "${paragraph}". The image should be simple, friendly, and appealing to young children.`;
      console.log(`Generating image for prompt: ${prompt}`);
      const imageUrl = await generateImageFromText(prompt); // Call the imported utility function

      generatedImages.push({
        paragraph,
        imageUrl,
      });
    }

    // Return the generated images
    return NextResponse.json({ message: 'Visual scenes generated successfully', images: generatedImages }, { status: 200 });

  } catch (error) {
    console.error('Error in /api/stories/visuals:', error);
    // Return a generic error or specific message from the thrown error
    return NextResponse.json({ error: `Failed to generate visual scenes: ${error.message}` }, { status: 500 });
  }
}