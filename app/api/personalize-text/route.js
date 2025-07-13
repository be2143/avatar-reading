// app/api/personalize-text/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Google Generative AI

// Initialize the GenAI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use your GEMINI_API_KEY

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

    // Basic validation
    if (!originalStoryText || !studentName) {
        console.error('API: personalize-text - Missing required fields (originalStoryText or studentName)');
        return NextResponse.json({ error: 'Original story text and student name are required.' }, { status: 400 });
    }

    // --- Gemini Model Selection ---
    // Use gemini-1.5-flash for faster, more cost-effective text generation
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    // Or for higher quality/more complex personalizations, you might consider:
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    // ----------------------------

    // Construct the prompt for text personalization
    const prompt = `Rewrite the following story to be personalized for a student named "${studentName}".

    Student Profile:
    - Comprehension Level: ${comprehensionLevel}
    - Preferred Story Length: ${preferredStoryLength}
    - Preferred Sentence Length: ${preferredSentenceLength}
    - Learning Preferences: ${learningPreferences}
    - Interests: ${interests}
    - Challenges: ${challenges}
    ${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ''}

    Original Story Title: "${originalStoryTitle}"
    Original Story Content:
    "${originalStoryText}"

    Instructions for rewrite:
    - Integrate the student's name "${studentName}" naturally into the story, potentially as the main character.
    - Adjust sentence complexity and vocabulary to a ${comprehensionLevel} level.
    - Aim for a ${preferredStoryLength} length.
    - Ensure sentence structures align with ${preferredSentenceLength} preference.
    - Incorporate aspects of the student's interests and learning preferences.
    - Gently address or provide coping strategies for challenges, if relevant to the story's theme.
    - Maintain the core plot and moral of the original story.
    - Return only the rewritten story text, without any conversational filler or additional notes.`;

    console.log('API: personalize-text - Generated Prompt (first 500 chars):', prompt.substring(0, 500));
    console.log('API: personalize-text - Attempting Gemini call...');

    // Perform the content generation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const personalizedText = response.text().trim(); // Extract the text and trim whitespace

    console.log('API: personalize-text - Gemini call successful.');
    console.log('API: personalize-text - Gemini Response (first 100 chars):', personalizedText.substring(0, 100));

    if (!personalizedText) {
      console.error('API: personalize-text - Gemini returned empty text.');
      return NextResponse.json({ error: 'Gemini did not generate personalized text.' }, { status: 500 });
    }

    return NextResponse.json({ personalizedText }, { status: 200 });

  } catch (error) {
    console.error('API: personalize-text - Error personalizing text with Gemini:', error);
    // Generic error handling for Google Generative AI
    // The Gemini API client often provides less specific error types than OpenAI's,
    // so general error logging is usually sufficient.
    return NextResponse.json(
      { error: 'Failed to personalize text. An internal server error occurred during Gemini API call.' },
      { status: 500 }
    );
  }
}