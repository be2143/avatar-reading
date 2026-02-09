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