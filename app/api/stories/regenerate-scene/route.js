// app/api/stories/regenerate-scene/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import fetch from 'node-fetch';
import { predefinedCharacters } from '@/lib/characters';

const openai = new OpenAI({ apiKey: process.env.GPT_API_KEY });
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Re-use helper functions from generate-visuals/route.js
// You might abstract these into a shared 'utils' file to avoid duplication
async function processDalleImageBuffer(imageBuffer) { /* ... same as above ... */ }
async function uploadBufferToCloudinary(imageBuffer, fileNameHint = 'upload', folder = 'story_gen_scenes') { /* ... same as above ... */ }
async function generateStorySceneSingle(cartoonBaseImageUrl, sceneDescription, mainCharacterName, mainCharacterDescription) {
    // This is essentially the core logic of generateStoryScene from visuals/route.js
    // You would copy that logic here.
    // It should fetch the character's base image, generate DALL-E prompt via GPT-4o,
    // generate DALL-E image, fetch it, process, upload to Cloudinary, and return URL.
    // Make sure it doesn't try to loop through multiple scenes.
    /* ... copy generateStoryScene logic here ... */
    const promptForDalle = (
        `Based on the provided image of a children's book character, create a vibrant and friendly ` +
        `illustration for the following scene: '${sceneDescription}'. ` +
        `The main character, ${mainCharacterName} (${mainCharacterDescription}), should be featured prominently and look *exactly* like the character in the reference image. ` +
        `Maintain the simple, cute, and consistent cartoon style of the reference character. ` +
        `Ensure the character's pose and expression fit the scene's context. ` +
        `DO NOT add any text overlays or captions directly in the image. ` +
        `Focus solely on the visual illustration of the scene. ` +
        `The image should be a standalone illustration of the scene. Avoid complex or distracting backgrounds. ` +
        `The style is a soft, warm, digital illustration suitable for a modern children's storybook.`
    );

    try {
        const gptResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "user", content: [{ type: "text", text: promptForDalle }, { type: "image_url", image_url: { url: cartoonBaseImageUrl } }] },
            ],
            max_tokens: 500,
        });
        const dallEPrompt = gptResponse.choices[0].message.content;

        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: dallEPrompt,
            n: 1,
            size: "1024x1024",
            response_format: "url",
        });
        const temporaryImageUrl = imageResponse.data[0]?.url;

        if (!temporaryImageUrl) {
            console.error('DALL-E did not return a valid image URL:', imageResponse);
            throw new Error('DALL-E did not return a valid image URL. Full response: ' + JSON.stringify(imageResponse));
        }

        const imageBufferResponse = await fetch(temporaryImageUrl);
        if (!imageBufferResponse.ok) throw new Error(`Failed to fetch DALL-E temp image: ${imageBufferResponse.statusText}`);
        const rawImageBuffer = Buffer.from(await imageBufferResponse.arrayBuffer());

        const processedBuffer = await processDalleImageBuffer(rawImageBuffer);
        const publicImageUrl = await uploadBufferToCloudinary(processedBuffer, `regenerated_scene_${mainCharacterName}_${Date.now()}`);

        return publicImageUrl;
    } catch (error) {
        console.error(`Error in generateStorySceneSingle for scene "${sceneDescription}":`, error);
        if (error.response) {
            try {
                const errorBody = await error.response.text();
                console.error('OpenAI API Error response body:', errorBody);
            } catch (e) {
                console.error('Failed to read OpenAI error response body:', e);
            }
        }
        if (error.response) console.error("OpenAI API Error details:", error.response.status, error.response.data);
        return null;
    }
}


export async function POST(request) {
  try {
    const { sceneText, mainCharacterImage, mainCharacterName } = await request.json();

    if (!sceneText || !mainCharacterImage || !mainCharacterName) {
      return NextResponse.json({ error: 'Scene text, main character image, and main character name are required.' }, { status: 400 });
    }

    // Use the provided mainCharacterImage as the cartoon base image
    const cartoonBaseImageUrl = mainCharacterImage;
    const characterDescription = mainCharacterName;

    const newImageUrl = await generateStorySceneSingle(cartoonBaseImageUrl, sceneText, mainCharacterName, characterDescription);

    if (!newImageUrl) {
      const errMsg = 'Failed to regenerate scene image. (No image returned from OpenAI/DALL-E)';
      console.error(errMsg);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: newImageUrl }, { status: 200 });

  } catch (error) {
    console.error('API: regenerate-scene - Top-level error:', error);
    return NextResponse.json({ error: `Failed to regenerate scene. ${error?.message || error}` }, { status: 500 });
  }
}