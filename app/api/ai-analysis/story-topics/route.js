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

    // Calculate story topics based on actual data
    const topics = await calculateStoryTopics(userId);

    return NextResponse.json({ topics });

  } catch (error) {
    console.error("Error calculating story topics:", error);
    return NextResponse.json({ message: "Error calculating story topics" }, { status: 500 });
  }
}

async function calculateStoryTopics(userId) {
  // Fetch all stories for the user
  const stories = await Story.find({ createdBy: userId }).lean();

  // Initialize topic counters
  const topicCounts = {};
  let totalStories = 0;

  stories.forEach(story => {
    totalStories++;
    
    // Extract topic from category or content
    let topic = 'Other';
    
    if (story.category) {
      // Map categories to topics based on your available categories
      const category = story.category.toLowerCase();
      if (category.includes('social') || category.includes('social skills')) {
        topic = 'Social Skills';
      } else if (category.includes('routine') || category.includes('routines')) {
        topic = 'Routines';
      } else if (category.includes('community')) {
        topic = 'Community';
      } else if (category.includes('emotion') || category.includes('emotions')) {
        topic = 'Emotions';
      } else if (category.includes('school') || category.includes('learning') || category.includes('education')) {
        topic = 'School';
      } else if (category.includes('digital') || category.includes('technology') || category.includes('tech')) {
        topic = 'Digital World/Technology';
      } else {
        // Use the category as topic if it doesn't match predefined ones
        topic = story.category;
      }
    } else if (story.title) {
      // Analyze title for topic keywords based on your categories
      const title = story.title.toLowerCase();
      if (title.includes('friend') || title.includes('play') || title.includes('share') || title.includes('social') || title.includes('greeting')) {
        topic = 'Social Skills';
      } else if (title.includes('routine') || title.includes('morning') || title.includes('bedtime') || title.includes('schedule')) {
        topic = 'Routines';
      } else if (title.includes('community') || title.includes('public') || title.includes('park') || title.includes('store')) {
        topic = 'Community';
      } else if (title.includes('feel') || title.includes('angry') || title.includes('sad') || title.includes('happy') || title.includes('emotion')) {
        topic = 'Emotions';
      } else if (title.includes('school') || title.includes('class') || title.includes('learn') || title.includes('teacher') || title.includes('homework')) {
        topic = 'School';
      } else if (title.includes('digital') || title.includes('technology') || title.includes('computer') || title.includes('screen') || title.includes('online')) {
        topic = 'Digital World/Technology';
      }
    }

    // Count topics
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });

  // Convert to array and calculate percentages
  const topicsArray = Object.entries(topicCounts).map(([name, count]) => ({
    name,
    percentage: totalStories > 0 ? Math.round((count / totalStories) * 100) : 0
  }));

  // Sort by percentage (descending) and take top 6
  const sortedTopics = topicsArray
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  // If no stories exist, return empty data
  if (totalStories === 0) {
    return [
      { name: 'No Stories Available', percentage: 0 }
    ];
  }

  return sortedTopics;
} 