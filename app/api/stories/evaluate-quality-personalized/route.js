// app/api/stories/evaluate-quality-personalized/route.js
// LLM judge pipeline to evaluate personalized story text quality
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      storyText,
      storyTitle,
      description,
      category,
      ageGroup,
      storyLength,
      storyGoal,
      studentName,
      studentAge,
      diagnosis,
      comprehensionLevel,
      preferredSentenceLength,
      preferredStoryLength,
      learningPreferences,
      challenges,
      additionalNotes
    } = body;

    if (!storyText || !storyTitle) {
      return NextResponse.json(
        { error: 'Story text and title are required for evaluation.' },
        { status: 400 }
      );
    }

    const evaluationPrompt = `You are an expert evaluator of personalized social stories for children with autism. Evaluate the following personalized story text and provide a comprehensive quality assessment.

Story Details:
- Title: "${storyTitle}"
- Purpose/Description: "${description || 'Not specified'}"
- Category: "${category || 'Not specified'}"
- Age Group: "${ageGroup || 'Not specified'}"
- Target Length: "${storyLength || 'Not specified'}"
- Story Goal: "${storyGoal || 'Not specified'}"

Student Profile (for personalization context):
- Student Name: "${studentName || 'Not specified'}"
- Age: ${studentAge || 'Not specified'}
- Diagnosis: ${diagnosis || 'Not specified'}
- Comprehension Level: ${comprehensionLevel || 'Not specified'}
- Preferred Story Length: ${preferredStoryLength || 'Not specified'}
- Preferred Sentence Length: ${preferredSentenceLength || 'Not specified'}
- Learning Preferences: ${learningPreferences || 'Not specified'}
- Challenges: ${challenges || 'Not specified'}
- Additional Notes / Personalization Notes: ${additionalNotes || 'Not specified'}

Personalized Story Text:
"""
${storyText}
"""

Please evaluate this personalized social story on the following criteria (rate each 1-5, where 5 is excellent):

1. Coherence: Considering the student's comprehension level (${comprehensionLevel || 'not specified'}), preferred sentence length (${preferredSentenceLength || 'not specified'}) and preferred story length (${preferredStoryLength || 'not specified'}), is the story logically organized with a clear beginning, middle, and end? Do events and ideas flow smoothly and stay at an appropriate level of complexity?

2. Descriptiveness: Does the story use concrete, child-friendly details and descriptions that help this student visualize situations and understand what is happening (without overwhelming them)?

3. Empathy & Personal Support: Based on the student's learning preferences (${learningPreferences || 'not specified'}) and additional notes (${additionalNotes || 'not specified'}), does the story show understanding of the student's feelings and needs, model emotional awareness, and keep a supportive, non-judgmental tone?

4. Grammaticality & Readability: Is the text grammatically correct, with appropriate sentence structure, punctuation, and vocabulary for this student's age (${studentAge || 'not specified'}) and comprehension level (${comprehensionLevel || 'not specified'})?

5. Relevance to Personalization Notes: How well does the story incorporate and stay focused on the teacher/therapist's personalization notes (additional notes), such as specific behaviors, contexts, or supports requested for this student?

6. Story Goal Alignment: How well does the story support and illustrate the stated story goal ("${storyGoal || 'Not specified'}") for this student, especially in relation to their diagnosis (${diagnosis || 'not specified'}) and challenges (${challenges || 'not specified'})?

DO NOT include any suggestions regarding the story visuals, the evaluation is only for the story TEXT.

Provide your evaluation in the following JSON format:
{
  "scores": {
    "coherence": <1-5>,
    "descriptiveness": <1-5>,
    "empathy": <1-5>,
    "grammaticality": <1-5>,
    "relevance": <1-5>,
    "storyGoalAlignment": <1-5>
  },
  "overallScore": <1-5>,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "summary": "Brief overall assessment focusing on how well the story works as a personalized social story for this student and goal (2-3 sentences)"
}

Return ONLY the JSON object, no additional text or explanation.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_EVAL_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert evaluator of personalized social stories for children with autism. Always respond with valid JSON only, no additional commentary.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });

    const evaluationText = completion.choices[0].message.content.trim();
    
    // Parse the JSON response
    let evaluation;
    try {
      evaluation = JSON.parse(evaluationText);
    } catch (parseError) {
      console.error('Failed to parse evaluation JSON:', parseError);
      // Fallback evaluation if JSON parsing fails
      evaluation = {
        scores: {
          coherence: 3,
          descriptiveness: 3,
          empathy: 3,
          grammaticality: 3,
          relevance: 3,
          storyGoalAlignment: 3
        },
        overallScore: 3,
        strengths: ['Story personalized successfully'],
        weaknesses: ['Unable to parse detailed evaluation'],
        suggestions: ['Review the story manually'],
        summary: 'Story has been personalized. Please review for quality.'
      };
    }

    return NextResponse.json({
      evaluation,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error evaluating personalized story quality:', error);
    
    // Return a default evaluation on error
    return NextResponse.json({
      evaluation: {
        scores: {
          coherence: 3,
          descriptiveness: 3,
          empathy: 3,
          grammaticality: 3,
          relevance: 3,
          storyGoalAlignment: 3
        },
        overallScore: 3,
        strengths: ['Story personalized successfully'],
        weaknesses: ['Evaluation service unavailable'],
        suggestions: ['Please review the story manually'],
        summary: 'Story has been personalized. Evaluation service encountered an error, but the story is ready for review.'
      },
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 200 }); // Return 200 so the story can still be used even if evaluation fails
  }
}









