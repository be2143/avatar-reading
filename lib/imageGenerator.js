// lib/imageGenerator.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY, // Access the API key from environment variables
});

export async function generateImageFromText(prompt) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3", // Or "dall-e-2" depending on your preference and access
      prompt: prompt,
      n: 1, // Number of images to generate
      size: "1024x1024", // Image size
    });

    const imageUrl = response.data[0].url;
    return imageUrl;
  } catch (error) {
    console.error("Error generating image from DALL-E:", error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    }
    throw new Error('Failed to generate image from AI service.');
  }
}