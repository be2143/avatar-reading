import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Story from '@/models/story';

export async function POST(request, context) {
  try {
    const { id: storyId } = await context.params; // Extract and rename id to storyId
    
    // Debug: Log the raw request body
    const requestBody = await request.json();
    console.log('API received request body:', requestBody);
    
    const { sessionNotes, timeSpent, sessionNum, activityCompleted, activityUsefulness, suggestedActivity, comprehensionScore } = requestBody;

    // Basic validation for session data (restored)
    if (typeof timeSpent === 'undefined' || typeof sessionNum === 'undefined') {
      return NextResponse.json(
        { error: 'Time spent and session number are required for saving a session.' },
        { status: 400 }
      );
    }
    if (typeof timeSpent !== 'number' || timeSpent < 0 || typeof sessionNum !== 'number' || sessionNum < 1) {
        return NextResponse.json(
          { error: 'Time spent must be a non-negative number and session number must be a positive number.' },
          { status: 400 }
        );
    }
    // Comprehension score is optional
    if (comprehensionScore !== undefined && comprehensionScore !== null) {
        if (typeof comprehensionScore !== 'number' || comprehensionScore < 1 || comprehensionScore > 5) {
            return NextResponse.json(
              { error: 'Comprehension score must be a number between 1 and 5.' },
              { status: 400 }
            );
        }
    }

    await connectMongoDB();

    const story = await Story.findById(storyId); 
    if (!story) {
      return NextResponse.json({ error: 'Story not found.' }, { status: 404 });
    }

    if (!story.sessions) {
      story.sessions = [];
    }

    // Add a session to the story
    const newSession = {
      sessionNotes,
      timeSpent,
      sessionNum,
      sessionDate: new Date(),
      comprehensionScore: comprehensionScore || null,
    };
    
    console.log('Saving new session to database:', newSession);
    story.sessions.push(newSession);

    await story.save();

    return NextResponse.json(
      {
        message: 'Session saved successfully.',
        story: story.toObject(), // Convert to plain object if you want to send it back
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving session:', error);

    // Differentiate between known errors (like validation or invalid ID format)
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return NextResponse.json(
            { error: 'Invalid story ID format.' },
            { status: 400 }
        );
    }
    if (error.name === 'ValidationError') {
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }

    // Generic internal server error
    return NextResponse.json(
      { error: 'Failed to save session. An internal server error occurred.' },
      { status: 500 }
    );
  }
}