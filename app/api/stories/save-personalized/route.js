// app/api/stories/save/route.js
import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story'; // Your Story model
import Student from '@/models/student'; // Your Student model (make sure to import it!)

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
      isPersonalized, // Receive this from frontend if passed, otherwise default in backend
      student, // The student _id to associate with
    } = body;

    // Basic validation
    // Add a check for 'student' ID if 'isPersonalized' is true or if it's always required for this flow
    if (!title || !generatedText || (isPersonalized && !student)) {
      return NextResponse.json(
        { error: 'Story title, generated text, and student association (if personalized) are required for saving.' },
        { status: 400 }
      );
    }

    let storyRecord;

    // Check if we are updating an existing story or creating a new one
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
      isPersonalized: true, // Explicitly set to true for personalized stories
      student: student,     // Associate the story with the student's ID
      // Add a 'postedBy' or 'userId' if stories are associated with users
      // postedBy: userId,
    };

    if (storyRecord) {
      // Update existing story
      // If the student association is changing, you might need to handle
      // removing from old student's personalizedStories and adding to new
      Object.assign(storyRecord, storyData);
      await storyRecord.save();
      console.log('Story updated:', storyRecord._id);
    } else {
      // Create new story
      storyRecord = new Story(storyData);
      await storyRecord.save();
      console.log('New story created:', storyRecord._id);

      // --- NEW: Associate the story with the student ---
      if (student && storyRecord._id) {
        await Student.findByIdAndUpdate(
          student,
          { $push: { personalizedStories: storyRecord._id } },
          { new: true, useFindAndModify: false } // Return the updated document
        );
        console.log(`Story ${storyRecord._id} added to student ${student}'s personalizedStories.`);
      }
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
    // Add more specific error handling for Mongoose validation errors if needed
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to save story. An internal server error occurred.' },
      { status: 500 }
    );
  }
}