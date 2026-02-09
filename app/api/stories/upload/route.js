import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectMongoDB } from "@/lib/mongodb";
import Story from '@/models/story'; 

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route"; 

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    console.log("session", session);

    if (!session || !session.user || !session.user.name || !session.user.id) {
      return NextResponse.json({ message: "Not authenticated or user ID unavailable" }, { status: 401 });
    }

    await connectMongoDB();

    const body = await request.json();
    const { title, category, ageGroup, story_content, isPersonalized, postedBy, createdBy: clientCreatedBy, ...otherBodyData } = body;

    if (!title || !story_content) {
      return NextResponse.json(
        { error: 'Title and story content are required' },
        { status: 400 }
      );
    }

    let suggestedEmoji = '📚'; 
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

    const newStory = new Story({
      title,
      category,
      ageGroup,
      story_content,
      isPersonalized: isPersonalized || false,
      isGenerated: false,
      hasImages: false,
      visualScenes: [], 
      source: "uploaded",
      authorName: postedBy,
      emoji: suggestedEmoji,
      ...otherBodyData, 
      createdBy: session.user.id, 
    });

    const savedStory = await newStory.save();

    return NextResponse.json(
      {
        message: 'Story uploaded successfully',
        // story: savedStory
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error uploading story:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'A story with this unique identifier already exists.' },
        { status: 409 }
      );
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: `Validation Error: ${messages.join(', ')}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to upload story' },
      { status: 500 }
    );
  }
}
