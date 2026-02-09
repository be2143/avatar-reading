import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Story from "@/models/story";

export async function GET(req) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate story length distribution based on actual data
    const data = await calculateStoryLengthDistribution(userId);

    return NextResponse.json({ data });

  } catch (error) {
    console.error("Error calculating story length distribution:", error);
    return NextResponse.json({ message: "Error calculating distribution" }, { status: 500 });
  }
}

async function calculateStoryLengthDistribution(userId) {
  // Fetch all stories for the user
  const stories = await Story.find({ createdBy: userId }).lean();

  // Initialize counters for different length categories
  let shortStories = 0;    // 1-2 scenes
  let mediumStories = 0;   // 3-5 scenes
  let longStories = 0;     // 6+ scenes

  stories.forEach(story => {
    // Count scenes based on visualScenes array or estimate from content
    let sceneCount = 0;
    
    if (story.visualScenes && Array.isArray(story.visualScenes)) {
      sceneCount = story.visualScenes.length;
    } else if (story.scenes && Array.isArray(story.scenes)) {
      sceneCount = story.scenes.length;
    } else if (story.content) {
      // Estimate scenes from content (rough approximation)
      const paragraphs = story.content.split('\n\n').filter(p => p.trim().length > 0);
      sceneCount = Math.min(paragraphs.length, 12); // Cap at 12 scenes
    } else {
      // Default to medium length if no scene data available
      sceneCount = 6;
    }

    // Categorize based on scene count
    if (sceneCount >= 1 && sceneCount <= 2) {
      shortStories++;
    } else if (sceneCount >= 3 && sceneCount <= 5) {
      mediumStories++;
    } else if (sceneCount >= 6) {
      longStories++;
    } else {
      // Stories with 0 scenes count as short
      shortStories++;
    }
  });

  // Calculate percentages and prepare data
  const totalStories = shortStories + mediumStories + longStories;
  
  const data = [
    {
      name: 'Short (1-2 scenes)',
      value: shortStories,
      color: '#f8b4cb'
    },
    {
      name: 'Medium (3-5 scenes)',
      value: mediumStories,
      color: '#a7e0a7'
    },
    {
      name: 'Long (6+ scenes)',
      value: longStories,
      color: '#ffd93d'
    }
  ];

  // If no stories exist, return empty data
  if (totalStories === 0) {
    return [
      {
        name: 'Short (1-2 scenes)',
        value: 0,
        color: '#f8b4cb'
      },
      {
        name: 'Medium (3-5 scenes)',
        value: 0,
        color: '#a7e0a7'
      },
      {
        name: 'Long (6+ scenes)',
        value: 0,
        color: '#ffd93d'
      }
    ];
  }

  return data;
} 