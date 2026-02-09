import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.GPT_API_KEY,
  });

export async function POST(req) {
  try {
    const { first_name, comprehension_level, story_title, story_content, interests } = await req.json();

    const activity_prompt = `
Based on the following social story, suggest a simple, real-life, in-the-moment activity that a child with autism can do with their caregiver immediately after the story to practice the skill.
Student Profile:
- Student's First Name: "${first_name}"
- Comprehension Level: ${comprehension_level || 'not specified'}
- Story Title: "${story_title}"
- Story Content: "${story_content}"
- Interests: ${interests || 'not specified'}
The activity should be:
- Concrete and doable in 2–5 minutes
- Related directly to the core concept of the story
- Do not require any additional materials or preparation
- Suitable for the child's comprehension level and interests
Only output the activity description (no extra explanation).
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant specializing in educational activities for children with autism.' },
        { role: 'user', content: activity_prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const activity = completion.choices[0].message.content.trim();

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error in generate-activity API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
