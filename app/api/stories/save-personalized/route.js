import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story';
import Student from '@/models/student';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    await connectMongoDB();
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const {
      _id,
      title,
      description,
      category,
      ageGroup,
      storyLength,
      specificScenarios,
      generatedText,
      visualScenes,
      mainCharacterDescription,
      otherCharacters,
      dummyStoryId,
      isPersonalized,
      student,
    } = body;

    if (!title || !generatedText || (isPersonalized && !student)) {
      return NextResponse.json(
        { error: 'Story title, generated text, and student association (if personalized) are required for saving.' },
        { status: 400 }
      );
    }

    // --- NEW: Call the emoji suggestion endpoint ---
    let suggestedEmoji = '📚'; // Default fallback emoji
    try {
      const emojiSuggestResponse = await fetch(`${request.nextUrl.origin}/api/emoji`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyTitle: title }),
      });
      if (emojiSuggestResponse.ok) {
        const emojiData = await emojiSuggestResponse.json();
        suggestedEmoji = emojiData.emoji;
      } else {
        console.warn(`Failed to get emoji from suggestion API: ${emojiSuggestResponse.status} ${emojiSuggestResponse.statusText}`);
      }
    } catch (emojiError) {
      console.error('Error calling emoji suggestion API:', emojiError);
    }
    // --- END NEW ---

    let storyRecord;

    if (_id) {
      storyRecord = await Story.findById(_id);
    } else if (dummyStoryId) {
       storyRecord = await Story.findOne({ dummyStoryId: dummyStoryId });
    }

    const storyData = {
      title,
      description,
      category,
      ageGroup,
      storyLength,
      specificScenarios,
      story_content: generatedText,
      mainCharacterDescription,
      otherCharacters,
      visualScenes: visualScenes,
      isGenerated: true,
      hasImages: visualScenes && visualScenes.length > 0,
      dummyStoryId: dummyStoryId,
      isPersonalized: true,
      student: student,
      createdBy: session.user.id,
      emoji: suggestedEmoji // Add the emoji field
    };

    if (storyRecord) {
      Object.assign(storyRecord, storyData);
      await storyRecord.save();
      console.log('Story updated:', storyRecord._id);
    } else {
      storyRecord = new Story({ ...storyData, createdBy: session?.user?.id });
      await storyRecord.save();
      console.log('New story created:', storyRecord._id);

      if (student && storyRecord._id) {
        await Student.findByIdAndUpdate(
          student,
          { $push: { personalizedStories: storyRecord._id } },
          { new: true, useFindAndModify: false }
        );
        console.log(`Story ${storyRecord._id} added to student ${student}'s personalizedStories.`);
      }
    }

    return NextResponse.json(
      {
        message: 'Story saved successfully',
        story: storyRecord.toObject(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving story:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to save story. An internal server error occurred.' },
      { status: 500 }
    );
  }
}