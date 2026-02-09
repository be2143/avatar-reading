// app/api/stories/evaluate-quality/route.js
// LLM judge pipeline to evaluate story text quality
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
      specificScenarios
    } = body;

    if (!storyText || !storyTitle) {
      return NextResponse.json(
        { error: 'Story text and title are required for evaluation.' },
        { status: 400 }
      );
    }

    const evaluationPrompt = `You are an expert evaluator of social stories for children with autism. Evaluate the following story text and provide a comprehensive quality assessment.

Story Details:
- Title: "${storyTitle}"
- Purpose/Description: "${description || 'Not specified'}"
- Category: "${category || 'Not specified'}"
- Age Group: "${ageGroup || 'Not specified'}"
- Target Length: "${storyLength || 'Not specified'}"
- Specific Scenario / Details to Include: "${specificScenarios || 'Not specified'}"

Story Text:
"""
${storyText}
"""

Please evaluate this social story on the following FIVE criteria (rate each 1-5, where 5 is excellent):
1. Coherence: Is the story logically organized with a clear beginning, middle, and end? Do events and ideas flow smoothly and make sense together?
2. Descriptiveness: Does the story use concrete, child-friendly details and descriptions that help the reader visualize situations and understand what is happening?
3. Empathy & Perspective-Taking: Does the story show understanding of the child's feelings and perspective? Does it model emotional awareness, validation, and supportive tone appropriate for children with autism?
4. Grammaticality & Readability: Is the text grammatically correct, with appropriate sentence structure, punctuation, and vocabulary for the specified age group?
5. Relevance to Target Behavior/Situation: How well does the story reflect and incorporate the given description (purpose/target behavior) and the specific scenario/details provided? Does it stay focused on that goal and give clear, relevant examples or situations?

DO NOT include any suggestions regarding the story visuals, the evaluation is only for the story text.

Provide your evaluation in the following JSON format:
{
  "scores": {
    "coherence": <1-5>,
    "descriptiveness": <1-5>,
    "empathy": <1-5>,
    "grammaticality": <1-5>,
    "relevance": <1-5>
  },
  "overallScore": <1-5>,
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "suggestions": ["suggestion1", "suggestion2", ...],
  "summary": "Brief overall assessment focusing on how well the story works as a social story for this target situation (2-3 sentences)"
}

Return ONLY the JSON object, no additional text or explanation.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_EVAL_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert evaluator of social stories for children with autism. Always respond with valid JSON only, no additional commentary.'
        },
        {
          role: 'user',
          content: evaluationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
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
          relevance: 3
        },
        overallScore: 3,
        strengths: ['Story generated successfully'],
        weaknesses: ['Unable to parse detailed evaluation'],
        suggestions: ['Review the story manually'],
        summary: 'Story has been generated. Please review for quality.'
      };
    }

    return NextResponse.json({
      evaluation,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error evaluating story quality:', error);
    
      // Return a default evaluation on error
    return NextResponse.json({
      evaluation: {
        scores: {
            coherence: 3,
            descriptiveness: 3,
            empathy: 3,
            grammaticality: 3,
            relevance: 3
        },
        overallScore: 3,
        strengths: ['Story generated successfully'],
        weaknesses: ['Evaluation service unavailable'],
        suggestions: ['Please review the story manually'],
        summary: 'Story has been generated. Evaluation service encountered an error, but the story is ready for review.'
      },
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 200 }); // Return 200 so the story can still be used even if evaluation fails
  }
}









