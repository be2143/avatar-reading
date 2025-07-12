// app/api/stories/generate/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the GenAI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { purpose, guidelines, wordCount, category, ageGroup } = await request.json();

    // --- CHANGE THIS LINE ---
    // Use gemini-1.5-flash for text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    // You could also try "gemini-1.5-pro" if you need higher quality/context for a cost
    // For general text, 'gemini-1.5-flash' is often a good default.
    // ------------------------

    const prompt = `You are a friendly storyteller AI specialized in creating social stories for children.

    Write a children's social story with the following characteristics:
    - Purpose/Topic: ${purpose}
    - Main Guidelines: ${guidelines || 'None provided. Be creative and positive.'}
    - Target Age Group: ${ageGroup || 'General children'}. Adjust language and complexity accordingly.
    - Category: ${category || 'General'}.
    - Approximate Length: around ${wordCount || 200} words.
    
    The story should be positive, encouraging, and provide clear examples of appropriate behaviors or feelings related to the purpose. Break the story into distinct paragraphs that could easily represent individual scenes. Do NOT include comprehension questions at the end.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const story = response.text();

    if (!story) {
      return NextResponse.json({ error: 'No story generated' }, { status: 500 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Gemini API error for text generation:', error);
    return NextResponse.json({ error: 'Failed to generate story text. Please try again.' }, { status: 500 });
  }
}