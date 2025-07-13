// app/api/stories/save/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story'; // Assuming your Story model can handle all fields

export async function POST(request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const {
      _id, // This will be present if updating an existing story
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
      selectedStyle,
      dummyStoryId, // This can be used as a temporary identifier
      // You might want to add 'userId' if stories belong to users
    } = body;

    // Basic validation
    if (!title || !generatedText) {
      return NextResponse.json(
        { error: 'Story title and generated text are required for saving.' },
        { status: 400 }
      );
    }

    let storyRecord;

    // Check if we are updating an existing story or creating a new one
    // We'll use dummyStoryId for initial creation and then the actual _id for updates
    if (_id) { // If an _id exists, try to find and update
      storyRecord = await Story.findById(_id);
    } else if (dummyStoryId) { // If _id not set yet, check by dummyStoryId
       storyRecord = await Story.findOne({ dummyStoryId: dummyStoryId });
    }


    const storyData = {
      title,
      description,
      category,
      ageGroup,
      storyLength,
      specificScenarios,
      story_content: generatedText, // Map generatedText to story_content
      mainCharacterDescription,
      otherCharacters,
      visualScenes: visualScenes, 
      selectedStyle,
      isGenerated: true,
      hasImages: visualScenes && visualScenes.length > 0,
      dummyStoryId: dummyStoryId, // Persist the dummy ID
      // Add a 'postedBy' or 'userId' if stories are associated with users
      // postedBy: userId,
    };

    if (storyRecord) {
      // Update existing story
      Object.assign(storyRecord, storyData);
      await storyRecord.save();
      console.log('Story updated:', storyRecord._id);
    } else {
      // Create new story
      storyRecord = new Story(storyData);
      await storyRecord.save();
      console.log('New story created:', storyRecord._id);
    }

    return NextResponse.json(
      {
        message: 'Story saved successfully',
        story: storyRecord.toObject(), // Return the saved story object, including its _id
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving story:', error);
    return NextResponse.json(
      { error: 'Failed to save story. An internal server error occurred.' },
      { status: 500 }
    );
  }
}