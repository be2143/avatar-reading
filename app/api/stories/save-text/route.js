import { NextResponse } from 'next/server';
import Story from '@/models/story'; // Adjust this path to your Mongoose Story model file
import mongoose from 'mongoose'; // Import mongoose for ValidationError

export async function POST(request) {
  try {
    const { 
      storyId, // <--- Accept optional storyId here
      title, 
      description, 
      category, 
      ageGroup, 
      storyLength, 
      specificScenarios, 
      generatedText 
    } = await request.json();

    // Basic validation
    if (!title || !generatedText) {
      return NextResponse.json({ error: 'Title and generated text are required.' }, { status: 400 });
    }

    let storyRecord;

    if (storyId) {
      // If storyId is provided, attempt to find and update the existing story
      storyRecord = await Story.findByIdAndUpdate(
        storyId,
        {
          title,
          description,
          story_content: generatedText,
          category,
          ageGroup,
          storyLength,
          specificScenarios,
          // We assume isGenerated is true if we are updating text
          // hasImages and scenes are not managed by this endpoint
        },
        { new: true, runValidators: true } // Return the updated document and run schema validators
      );

      if (!storyRecord) {
        // If storyId was provided but no story found, it's an error or a stale ID.
        // For simplicity, we can treat it as needing a new story if not found,
        // or return an error if you want strict ID enforcement.
        // Here, we'll create a new one if update fails to find.
        console.warn(`Story with ID ${storyId} not found for update, creating new.`);
        // Fall through to creation logic if you want to create new in this case
      } else {
        console.log('Story text UPDATED in DB with ID:', storyRecord._id);
      }
    }
    
    // If no storyId was provided, or if update failed to find the story, create a new one
    if (!storyRecord) {
      storyRecord = await Story.create({
        title,
        description,
        story_content: generatedText,
        category,
        ageGroup,
        storyLength,
        specificScenarios,
        isGenerated: true,  // Mark as text generated
        hasImages: false,   // Initially no images
        scenes: [],         // Initially empty scenes array
        // student: (if you have a student ID from auth, you'd add it here)
      });
      console.log('Story text CREATED in DB with ID:', storyRecord._id);
    }

    // Return the story's ID (whether created or updated)
    return NextResponse.json({ message: 'Story text saved successfully!', storyId: storyRecord._id });

  } catch (error) {
    console.error('Error saving story text to DB:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save story text to database.' }, { status: 500 });
  }
}