import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story'; // Adjust the path to your Story model

export async function POST(request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { title, category, ageGroup, story_content, postedBy, isPersonalized } = body;

    // Validate required fields
    if (!title || !story_content) {
      return NextResponse.json(
        { error: 'Title and story content are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the story (optional, since MongoDB creates _id automatically)
    const uniqueId = new mongoose.Types.ObjectId().toString();

    // Create new story
    const newStory = new Story({
      id: uniqueId, // If you want to use your custom id field
      title,
      category,
      ageGroup,
      story_content,
      postedBy, // You might want to add this field to your schema if it's not there
      isPersonalized: isPersonalized || false,
      isGenerated: true, // Since this is user-uploaded content, mark as generated
      hasImages: false, // No images initially for user uploads
      scenes: [] // Empty scenes array initially
    });

    // Save to database
    const savedStory = await newStory.save();

    return NextResponse.json(
      { 
        message: 'Story uploaded successfully', 
        story: savedStory 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error uploading story:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Story with this ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload story' },
      { status: 500 }
    );
  }
}