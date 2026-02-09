import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import Story from '@/models/story';

export async function POST(request, context) {
  try {
    const { id: storyId } = await context.params;
    const { activity, rating, feedback } = await request.json();

    if (!activity || !rating) {
      return NextResponse.json(
        { error: 'Activity and rating are required.' },
        { status: 400 }
      );
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be a number between 1 and 5.' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ error: 'Story not found.' }, { status: 404 });
    }

    // If rating >= 3, save to savedActivities
    if (rating >= 3) {
      if (!story.savedActivities) {
        story.savedActivities = [];
      }
      story.savedActivities.push({
        activity,
        rating,
        feedback: feedback || null,
        createdAt: new Date(),
      });
    }

    // If rating < 3, save feedback to activityFeedback array
    if (rating < 3 && feedback) {
      if (!story.activityFeedback) {
        story.activityFeedback = [];
      }
      story.activityFeedback.push(feedback);
    }

    await story.save();

    return NextResponse.json(
      {
        message: 'Activity rating saved successfully.',
        story: story.toObject(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving activity rating:', error);

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

    return NextResponse.json(
      { error: 'Failed to save activity rating. An internal server error occurred.' },
      { status: 500 }
    );
  }
}







