import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.GPT_API_KEY,
  });

export async function POST(req) {
  try {
    const { 
      first_name, 
      comprehension_level, 
      story_title, 
      story_content, 
      story_goal,
      diagnosis,
      learning_preferences,
      challenges,
      additional_notes,
      interests,
      previous_feedback 
    } = await req.json();

    const feedbackContext = previous_feedback && previous_feedback.length > 0
      ? `\n\nIMPORTANT: Previous activities received negative feedback (rating < 3). Please avoid these issues:\n${previous_feedback.map((fb, idx) => `${idx + 1}. ${fb}`).join('\n')}\n\nUse this feedback to generate a better, more suitable activity.`
      : '';

    const activity_prompt = `
Based on the following social story, suggest a simple, real-life, in-the-moment activity that a child with autism can do with their teacher in the classroom setting immediately after the story to practice the skill.

Student Profile:
- Student's First Name: "${first_name}"
- Diagnosis: ${diagnosis || 'not specified'}
- Comprehension Level: ${comprehension_level || 'not specified'}
- Learning Preferences: ${learning_preferences || 'not specified'}
- Challenges: ${challenges || 'not specified'}
- Additional Notes: ${additional_notes || 'not specified'}
- Interests: ${interests || 'not specified'}

Story Information:
- Story Title: "${story_title}"
- Story Goal: ${story_goal || 'not specified'}
- Story Content: "${story_content}"
${feedbackContext}
The activity should be:
- Concrete and doable in 2–5 minutes
- Related directly to the story goal: ${story_goal || 'the core concept of the story'}
- Do not require any additional materials or preparation
- Suitable for the child's comprehension level (${comprehension_level || 'not specified'})
- Consider the student's learning preferences (${learning_preferences || 'not specified'})
- Be mindful of the student's challenges (${challenges || 'not specified'})
- Take into account the student's diagnosis (${diagnosis || 'not specified'})
- Consider additional notes: ${additional_notes || 'none provided'}
- Align with the student's interests when possible (${interests || 'not specified'})
${previous_feedback && previous_feedback.length > 0 ? '- Address the issues mentioned in previous feedback' : ''}
Only output the activity description in 2-4 sentences (no extra explanation).
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
