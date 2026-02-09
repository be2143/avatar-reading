import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story'; 
import { GoogleGenerativeAI } from '@google/generative-ai';

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = 'gemini-2.0-flash';

// Translation function
async function translateText(text, targetLanguage) {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    let prompt;
    if (targetLanguage === 'arabic') {
      prompt = `Translate the following English text to Modern Standard Arabic. Keep the meaning accurate and natural in Arabic. Maintain any formatting, line breaks, or special characters. Return only the Arabic translation without any additional text or explanations:\n\n"${text}"`;
    } else if (targetLanguage === 'english') {
      prompt = `Translate the following Arabic text to English. Keep the meaning accurate and natural in English. Maintain any formatting, line breaks, or special characters. Return only the English translation without any additional text or explanations:\n\n"${text}"`;
    } else {
      throw new Error('Invalid target language');
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();
    
    // Clean up any potential markdown or extra quotes
    const cleanText = translatedText.replace(/^["']|["']$/g, '');
    
    console.log(`✓ Translation successful (${text.length} chars → ${cleanText.length} chars)`);
    return cleanText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
} 

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    console.log("session", session);

    if (!session || !session.user || !session.user.name || !session.user.id) {
      return NextResponse.json({ message: "Not authenticated or user ID unavailable" }, { status: 401 });
    }

    await connectMongoDB();

    const body = await request.json();
    const { language, title, category, ageGroup, story_content, isPersonalized, postedBy, createdBy: clientCreatedBy, visibility, ...otherBodyData } = body;
    
    // Validate visibility field
    if (visibility && !['private', 'public'].includes(visibility)) {
      return NextResponse.json(
        { error: 'Visibility must be either "private" or "public"' },
        { status: 400 }
      );
    }

    if (!title || !story_content || !language) {
      return NextResponse.json(
        { error: 'Title, story content, and language are required' },
        { status: 400 }
      );
    }

    // Validate language
    if (!['english', 'arabic'].includes(language)) {
      return NextResponse.json(
        { error: 'Language must be either "english" or "arabic"' },
        { status: 400 }
      );
    }

    let suggestedEmoji = '📚'; 
    try {
      const emojiSuggestResponse = await fetch(`${request.nextUrl.origin}/api/emoji`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyTitle: title }),
      });

      if (emojiSuggestResponse.ok) {
        const emojiData = await emojiSuggestResponse.json();
        suggestedEmoji = emojiData.emoji;
      } else {
        console.warn(`Failed to get emoji from suggestion API: ${emojiSuggestResponse.status} ${emojiSuggestResponse.statusText}`);
      }
    } catch (emojiError) {
      console.error('Error calling emoji suggestion API:', emojiError);
    }

    // Translate story content based on selected language
    let storyContentEnglish = story_content;
    let storyContentArabic = '';

    try {
      console.log(`Translating story content from ${language}...`);
      
      if (language === 'english') {
        // Story is in English, translate to Arabic
        storyContentEnglish = story_content; // Keep original English
        storyContentArabic = await translateText(story_content, 'arabic');
      } else if (language === 'arabic') {
        // Story is in Arabic, translate to English
        storyContentArabic = story_content; // Keep original Arabic
        storyContentEnglish = await translateText(story_content, 'english');
      }
      
      console.log(`✓ Translation completed successfully`);
    } catch (translationError) {
      console.error('Translation failed:', translationError);
      return NextResponse.json(
        { error: 'Failed to translate story content' },
        { status: 500 }
      );
    }

    const storyData = {
      title,
      category,
      ageGroup,
      story_content: storyContentEnglish,
      story_content_arabic: storyContentArabic,
      isPersonalized: isPersonalized || false,
      isGenerated: false,
      hasImages: false,
      visualScenes: [], 
      source: "uploaded",
      authorName: postedBy,
      emoji: suggestedEmoji,
      ...otherBodyData, 
      createdBy: session.user.id,
      visibility: visibility || 'private', // Set visibility AFTER spread to ensure it's not overridden
    };
    
    const newStory = new Story(storyData);

    const savedStory = await newStory.save();

    return NextResponse.json(
      {
        message: 'Story uploaded successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error uploading story:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A story with this unique identifier already exists.' },
        { status: 409 }
      );
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: `Validation Error: ${messages.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload story' },
      { status: 500 }
    );
  }
}
