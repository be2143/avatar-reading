import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story';

export async function GET(request, { params }) {
  try {
    await connectMongoDB();

    const { id } = await params;

    const story = await Story.findById(id);

    console.log('Fetched Story:', story);

    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return NextResponse.json(story, { status: 200 });

  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectMongoDB();

    const { id } = await params;
    const body = await request.json();

    const { title, story_content, story_content_arabic, visualScenes, visibility, mainCharacterName, initialCartoonBaseImageUrl } = body;

    // Validate required fields
    if (!title || !story_content) {
      return NextResponse.json({ error: 'Title and story content are required' }, { status: 400 });
    }

    // Build update object, only including defined fields to preserve existing data
    const updateData = {
      title,
      story_content,
      story_content_arabic,
      visualScenes,
      visibility
    };

    // Only update character fields if provided
    if (mainCharacterName !== undefined) {
      updateData.mainCharacterName = mainCharacterName;
    }
    if (initialCartoonBaseImageUrl !== undefined) {
      updateData.initialCartoonBaseImageUrl = initialCartoonBaseImageUrl;
    }

    const updatedStory = await Story.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStory) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    console.log('Updated Story:', updatedStory);

    return NextResponse.json(updatedStory, { status: 200 });

  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Failed to update story' }, { status: 500 });
  }
}