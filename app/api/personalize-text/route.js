// app/api/personalize-text/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

// Initialize Gemini for Arabic translation
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = 'gemini-2.0-flash';

async function translateWithOpenAI(text) {
  try {
    const systemInstruction = 'You are a professional translator. Translate English children\'s story text to Modern Standard Arabic. Preserve meaning and paragraph breaks. Return only the Arabic translation without commentary.';
    const userPrompt = `Translate to Modern Standard Arabic (MSA):\n\n"""${text}"""`;
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_TRANSLATE_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: Math.min(2048, Math.floor(text.length * 2) + 200),
    });
    return (completion.choices?.[0]?.message?.content || '').trim();
  } catch (err) {
    console.error('OpenAI translation failed:', err);
    return '';
  }
}

async function translateToArabic(text) {
  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = `Translate the following English children's story text to Modern Standard Arabic. Preserve meaning and formatting (paragraph breaks). Return only the Arabic translation without any extra commentary.\n\n"""${text}"""`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translated = response.text().trim().replace(/^( ["'`] )|( ["'`] )$/g, '');
    return translated;
  } catch (e) {
    console.error('Translation to Arabic failed:', e);
    // Fallback to OpenAI on 429 rate limit or any failure
    const fallback = await translateWithOpenAI(text);
    return fallback;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('API: personalize-text - Incoming body:', JSON.stringify(body, null, 2));

    const {
      studentName,
      age,
      diagnosis,
      guardian,
      comprehensionLevel,
      preferredStoryLength,
      preferredSentenceLength,
      learningPreferences,
      challenges,
      originalStoryText,
      originalStoryTitle,
      additionalNotes,
    } = body;

    if (!originalStoryText || !studentName) {
      console.error('API: personalize-text - Missing required fields');
      return NextResponse.json({ error: 'Original story text and student name are required.' }, { status: 400 });
    }

    const modelName = "gpt-3.5-turbo";
    const firstName = studentName ? studentName.split(' ')[0] : '';

    // Step 1 — Personalize the story
    const systemPrompt = `You are an AI assistant specialized in rewriting children's stories for children diagnosed with autism. Your goal is to personalize stories based on a student's profile so that they are able to relate and comprehend the story better. You must maintain the core plot, moral, and tone of the original story. You must ONLY return the rewritten story text, without any conversational filler, titles, or additional notes.`;

    const userPrompt = `Rewrite the following story to be personalized for a student using ONLY their first name: "${firstName}".

    Student Profile:
    - Student's Name: "${studentName || firstName}"
    - Age: ${age || 'not specified'}
    - Diagnosis: ${diagnosis || 'not specified'}
    - Comprehension Level: ${comprehensionLevel || 'not specified'}
    - Preferred Story Length: ${preferredStoryLength || 'not specified'}
    - Preferred Sentence Length: ${preferredSentenceLength || 'not specified'}
    - Learning Preferences: ${learningPreferences || 'not specified'} 
    - Challenges: ${challenges || 'not specified'}
    ${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

    Original Story Title: "${originalStoryTitle || 'Untitled Story'}"
    Original Story Content:
    "${originalStoryText}"

    Instructions for rewrite:
    - Integrate ONLY the student's first name "${firstName}" naturally into the story.
    - Consider the student's age (${age || 'not specified'}) when choosing appropriate vocabulary and concepts.
    - Take into account the student's diagnosis (${diagnosis || 'not specified'}) to ensure the story is appropriate and supportive.
    - Adjust vocabulary and sentence structure to fit comprehension level: ${comprehensionLevel || 'general children\'s'}.
    - Keep sentence lengths within: ${preferredSentenceLength || 'general'} where:
      - very_short: Very Short (1–5 words)
      - short: Short (6–10 words)
      - medium: Medium (11–15 words)
      - long: Long (More than 15 words).
    - Keep story lengths within: ${preferredStoryLength || 'general'} where:
      - very_short: Very Short (1–3 sentences)
      - short: Short (1–2 paragraphs)
      - medium: Medium (3–5 paragraphs)
      - long: Long (More than 5 paragraphs)
    - Incorporate learning preferences (${learningPreferences || 'not specified'}) naturally into the story structure and presentation.
    - Gently address challenges (${challenges || 'not specified'}), if relevant to the story.
    - Adhere to the additional notes and adjust accordingly: ${additionalNotes || 'none provided'}.
    - Take the ${comprehensionLevel} into account when rewriting the story.
    - Maintain core plot, moral, and positivity.`;

    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: Math.floor(originalStoryText.length * 1.5) + 200,
      temperature: 0.7,
    });

    const personalizedText = completion.choices[0].message.content.trim();

    if (!personalizedText) {
      console.error('API: personalize-text - OpenAI returned empty text.');
      return NextResponse.json({ error: 'OpenAI did not generate personalized text.' }, { status: 500 });
    }

    // Step 2 — Split into scenes
    const sceneSystemPrompt = `You are an AI assistant specialized in rewriting children's stories for children diagnosed with autism. Your goal is to personalize stories based on a student's profile so that they are able to relate and comprehend the story better. You must maintain the core plot, moral, and tone of the original story. You must ONLY return the rewritten story text, without any conversational filler, titles, scene prefix or additional notes`;

    const sceneUserPrompt = `
    Divide the following children's story into distinct scenes for a picture book.
    
    Each scene should contain a portion of the original story text (unchanged), grouped logically based on what could be illustrated as a single moment or page in a children's book.
    
    Instructions:
    - Do NOT rewrite or summarize.
    - Keep original text as-is.
    - Break at natural transitions (setting, actions, emotions, characters).
    - Output each scene separated by exactly two newline characters (\n\n).
    - Do NOT number or label the scenes such as Scene 1,2,3
    - For very short stories with at most 5 sentences, do not have more than 2 scenes.
    - For short stories (6-8 sentences), do not have more than 3 scenes.
    - For medium stories (8-10 sentences), do not have more than 4 scenes.
    - For longer stories (10+ sentences), do not have more than 4-5 scenes.
    - Do not have more than 5 scenes in total.
    - Optimize number of scenes while capturing the essence.
    
    Story:
    """${personalizedText}"""
    `;

    const sceneCompletion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: sceneSystemPrompt },
        { role: "user", content: sceneUserPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const scenes = sceneCompletion.choices[0].message.content;

    // Arabic translation – scene-aligned for better matching
    const sceneParts = (scenes || '').split('\n\n').filter(p => p.trim() !== '');
    let scenesArabic = '';
    let personalizedTextArabic = '';
    if (sceneParts.length > 0) {
      const arabicScenePromises = sceneParts.map(part => translateToArabic(part));
      const arabicSceneResults = await Promise.all(arabicScenePromises);
      scenesArabic = arabicSceneResults.join('\n\n');
      // Build full Arabic by translating entire personalizedText or joining parts
      // Prefer translating the full story to preserve flow
      personalizedTextArabic = await translateToArabic(personalizedText);
      if (!personalizedTextArabic) {
        personalizedTextArabic = scenesArabic; // fallback
      }
    } else {
      // If scenes split is empty, translate the whole text once
      personalizedTextArabic = await translateToArabic(personalizedText);
      scenesArabic = personalizedTextArabic;
    }

    console.log("Sending the scenes text (EN): ", scenes);
    return NextResponse.json({ personalizedText, scenes, personalizedTextArabic, scenesArabic }, { status: 200 });

  } catch (error) {
    console.error('API: personalize-text - Error:', error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Failed: ${error.message}` },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to personalize and split text. Internal server error.' },
      { status: 500 }
    );
  }
}