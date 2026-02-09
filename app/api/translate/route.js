import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL_NAME = 'gemini-2.0-flash';

// Fallback OpenAI client
const openai = process.env.GPT_API_KEY ? new OpenAI({ apiKey: process.env.GPT_API_KEY }) : null;

// Translation with Gemini, fallback to OpenAI if needed
async function translateText(text, targetLanguage) {
  const buildPrompt = () => {
    if (targetLanguage === 'arabic') {
      return `Translate the following English text to Modern Standard Arabic. Keep the meaning accurate and natural in Arabic. IMPORTANT: Preserve the EXACT same formatting, line breaks, and paragraph structure as the original text. Do not add extra line breaks or change the formatting. Return only the Arabic translation without any additional text or explanations:\n\n"${text}"`;
    } else if (targetLanguage === 'english') {
      return `Translate the following Arabic text to English. Keep the meaning accurate and natural in English. IMPORTANT: Preserve the EXACT same formatting, line breaks, and paragraph structure as the original text. Do not add extra line breaks or change the formatting. Return only the English translation without any additional text or explanations:\n\n"${text}"`;
    }
    throw new Error('Invalid target language');
  };

  const normalize = (translatedText) => {
    const trimmed = (translatedText || '').trim();
    let cleanText = trimmed.replace(/^(["'`])|(["'`])$/g, '');

    // Preserve the exact line break structure of the original text
    const originalLineBreaks = text.match(/\n/g) || [];
    const translatedLineBreaks = cleanText.match(/\n/g) || [];

    if (translatedLineBreaks.length > originalLineBreaks.length) {
      cleanText = cleanText.replace(/\n{3,}/g, '\n\n');
      const currentBreaks = cleanText.match(/\n/g) || [];
      if (currentBreaks.length > originalLineBreaks.length) {
        const originalSingleBreaks = text.match(/\n(?!\n)/g) || [];
        const originalDoubleBreaks = text.match(/\n\n/g) || [];
        if (originalSingleBreaks.length > originalDoubleBreaks.length) {
          cleanText = cleanText.replace(/\n\n/g, '\n');
        }
      }
    }
    return cleanText;
  };

  const prompt = buildPrompt();

  // Try Gemini first if available
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const translatedText = normalize(response.text());
      if (translatedText) return translatedText;
    } catch (err) {
      console.error('Gemini translation failed, falling back to OpenAI:', err?.message || err);
    }
  }

  // Fallback to OpenAI (text-only)
  if (openai) {
    try {
      const res = await openai.responses.create({
        model: 'gpt-4o-mini',
        input: [
          {
            role: 'user',
            content: [{ type: 'text', text: prompt }],
          },
        ],
      });
      const textPart = res?.output?.find?.((p) => p.type === 'output_text');
      const alt = normalize(textPart?.content?.[0]?.text || textPart?.text || '');
      if (alt) return alt;
    } catch (err) {
      console.error('OpenAI translation failed:', err?.message || err);
    }
  }

  throw new Error('All translators failed or are unavailable');
}

export async function POST(request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    if (!['arabic', 'english'].includes(targetLanguage)) {
      return NextResponse.json(
        { error: 'Target language must be either "arabic" or "english"' },
        { status: 400 }
      );
    }

    const translatedText = await translateText(text, targetLanguage);

    return NextResponse.json({
      originalText: text,
      translatedText: translatedText,
      targetLanguage: targetLanguage
    });

  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
}
