// app/api/stories/[id]/route.js

import { NextResponse } from 'next/server';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story';

// Correct function signature for dynamic API routes in Next.js 13+
export async function GET(request, { params }) {
  try {
    await connectMongoDB();

    // Await params directly before destructuring
    const { id } = await params; // <-- This is the change

    const story = await Story.findById(id);

    if (!story) {
      return NextResponse.json({ message: "Story not found" }, { status: 404 });
    }

    return NextResponse.json(story, { status: 200 });

  } catch (error) {
    console.error('Error fetching story:', error);
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}