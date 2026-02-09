import { NextResponse } from 'next/server';
import Story from '@/models/story';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const { 
      storyId,
      title, 
      description, 
      category, 
      ageGroup, 
      storyLength, 
      specificScenarios, 
      generatedText 
    } = await request.json();

    if (!title || !generatedText) {
      return NextResponse.json({ error: 'Title and generated text are required.' }, { status: 400 });
    }

    let storyRecord;

    if (storyId) {
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
        },
        { new: true, runValidators: true }
      );

      if (!storyRecord) {
        console.warn(`Story with ID ${storyId} not found for update, creating new.`);
      } else {
        console.log('Story text UPDATED in DB with ID:', storyRecord._id);
      }
    }
    
    if (!storyRecord) {
      storyRecord = await Story.create({
        title,
        description,
        story_content: generatedText,
        category,
        ageGroup,
        storyLength,
        specificScenarios,
        isGenerated: true,
        hasImages: false,
        scenes: [],
      });
      console.log('Story text CREATED in DB with ID:', storyRecord._id);
    }

    return NextResponse.json({ message: 'Story text saved successfully!', storyId: storyRecord._id });

  } catch (error) {
    console.error('Error saving story text to DB:', error);
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ error: `Validation Error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save story text to database.' }, { status: 500 });
  }
}