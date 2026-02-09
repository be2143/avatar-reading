// app/api/personalize-text/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('API: personalize-text - Incoming body:', JSON.stringify(body, null, 2));

    const {
      studentName,
      comprehensionLevel,
      preferredStoryLength,
      preferredSentenceLength,
      learningPreferences,
      interests,
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
    - Student's First Name: "${firstName}"
    - Comprehension Level: ${comprehensionLevel || 'not specified'}
    - Preferred Sentence Length: ${preferredSentenceLength || 'not specified'}
    - Preferred Story Length: ${preferredStoryLength || 'not specified'}
    - Learning Preferences: ${learningPreferences || 'not specified'}
    - Challenges: ${challenges || 'not specified'}
    ${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

    Original Story Title: "${originalStoryTitle || 'Untitled Story'}"
    Original Story Content:
    "${originalStoryText}"

    Instructions for rewrite:
    - Integrate ONLY the student's first name "${firstName}" naturally into the story.
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
    - Incorporate interests and learning preferences naturally.
    - Gently address challenges, if relevant.
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

    console.log("Sending the scenes text: ", scenes);

    return NextResponse.json({ personalizedText, scenes }, { status: 200 });

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