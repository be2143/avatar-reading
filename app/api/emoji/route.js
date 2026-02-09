// app/api/stories/suggest-emoji/route.js (for Next.js App Router)

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { storyTitle } = body;

    if (!storyTitle || typeof storyTitle !== 'string' || storyTitle.trim() === '') {
      return NextResponse.json(
        { error: 'Story title is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Suggest a single, highly relevant emoji for the following story title. Provide only the emoji character, nothing else.\nStory Title: "${storyTitle}"\nEmoji:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Try to extract just the emoji
    const emojiMatch = text.match(/\p{Emoji}/u);
    let suggestedEmoji = '📚';
    if (emojiMatch && emojiMatch[0]) {
      suggestedEmoji = emojiMatch[0];
    } else if (text.length <= 5) {
      suggestedEmoji = text;
    }

    return NextResponse.json(
      {
        message: 'Emoji suggested successfully',
        emoji: suggestedEmoji
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error suggesting emoji:', error);
    return NextResponse.json(
      { error: 'Failed to suggest emoji. An internal server error occurred.' },
      { status: 500 }
    );
  }
}
