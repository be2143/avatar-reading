// lib/storyProcessor.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

async function getChatCompletion(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error getting chat completion from OpenAI:", error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    }
    throw new Error('Failed to process story with AI service for story structure.');
  }
}

/**
 * Processes the entire story to identify characters, provide detailed descriptions,
 * and split it into logical scenes.
 * @param {string} storyText - The full story text.
 * @returns {Promise<{mainCharacterDescription: string, otherCharacters: string[], scenes: {sceneText: string, sceneNumber: number}[]}>}
 */
export async function processStoryForVisuals(storyText) {
  const prompt = `
  Analyze the following children's story. Your goal is to prepare it for visual illustration, focusing on consistent characters.

  Perform the following tasks and return the output as a JSON object:

  1.  **Identify the SINGLE most prominent main character.** Provide an extremely detailed, vivid, and concise physical description of this character. This description should be suitable for repeatedly including in image generation prompts to ensure visual consistency. Focus on unique features:
      * Character's name (e.g., "Lily")
      * Species/type (e.g., "a cheerful young girl", "a brave little fox")
      * Key physical attributes (e.g., "with braided brown hair, bright blue eyes, a small freckle on her nose")
      * Consistent clothing (e.g., "wearing a bright yellow sundress with red polka dots and worn brown boots")
      * Any unique accessories (e.g., "carrying a small, green satchel")
      * Emphasize things that make them distinct and recognizable.
      * Example: "Barnaby: A small, brave rabbit with soft white fur, unusually bright pink eyes, and a single black spot on his left ear. He consistently wears a tiny, faded red bandana around his neck and carries a small, well-worn blue backpack."

  2.  **Identify any other significant characters.** For each, provide a brief, descriptive physical appearance, similar to the main character but perhaps less detailed if they are minor.

  3.  **Divide the story into distinct visual scenes or moments.** Each scene should have a clear visual focus. Provide the exact text that describes that scene.

  Return the output as a JSON object with the following keys:
  - "mainCharacterDescription": A single string containing the detailed description of the main character.
  - "otherCharacters": An array of strings, each for an additional character.
  - "scenes": An array of objects, each with "sceneNumber" (integer) and "sceneText" (string).

  Story:
  ${storyText}
  `;

  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant specialized in breaking down children's stories for consistent visual illustration. Always respond in valid JSON format as specified."
    },
    {
      role: "user",
      content: prompt
    }
  ];

  const result = await getChatCompletion(messages);

  // Validate the structure of the AI's response
  if (
    !result ||
    typeof result.mainCharacterDescription !== 'string' ||
    !Array.isArray(result.otherCharacters) ||
    !Array.isArray(result.scenes)
  ) {
    console.error("Invalid response format from story processing AI:", result);
    throw new Error("AI did not return expected story processing format for visuals.");
  }

  return result;
}