import { NextResponse } from 'next/server';
import Story from '@/models/story';
import { connectMongoDB } from '@/lib/mongodb';

export async function GET(request, { params }) {
  try {
    await connectMongoDB();
    const { id } = params;

    const story = await Story.findById(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
