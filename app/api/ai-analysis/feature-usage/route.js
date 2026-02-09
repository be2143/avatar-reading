import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Story from "@/models/story";
import { calculateAverageSessionTime } from "@/lib/aiAnalysisUtils";

export async function GET(req) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;

    // Calculate feature usage based on actual data
    const { features, avgUsageTime } = await calculateFeatureUsage(userId);

    return NextResponse.json({ features, avgUsageTime });

  } catch (error) {
    console.error("Error calculating feature usage:", error);
    return NextResponse.json({ message: "Error calculating feature usage" }, { status: 500 });
  }
}

async function calculateFeatureUsage(userId) {
  // Fetch all stories for the user
  const stories = await Story.find({ createdBy: userId }).lean();

  // Initialize feature counters
  let generalReadingCount = 0;
  let storyGenerationCount = 0;
  let personalizationCount = 0;

  stories.forEach(story => {
    // Count sessions for general reading
    if (story.sessions && story.sessions.length > 0) {
      generalReadingCount += story.sessions.length;
    }

    // Count story generation (AI-generated stories)
    if (story.source === 'generated' || story.isPersonalized) {
      storyGenerationCount++;
    }

    // Count personalization (stories with student association)
    if (story.isPersonalized && story.student) {
      personalizationCount++;
    }
  });

  // Calculate average usage time using shared utility function
  const { avgSessionMinutes: avgUsageTime } = await calculateAverageSessionTime(userId);

  // Determine usage levels
  const getUsageLevel = (count, total) => {
    if (total === 0) return 'No Data';
    const percentage = (count / total) * 100;
    if (percentage >= 50) return 'Most Used';
    if (percentage >= 30) return 'High Usage';
    if (percentage >= 10) return 'Medium Usage';
    return 'Low Usage';
  };

  const totalStories = stories.length;
  const totalFeatures = generalReadingCount + storyGenerationCount + personalizationCount;

  const features = [
    {
      name: 'General Story Reading',
      usage: getUsageLevel(generalReadingCount, totalFeatures),
      color: 'text-blue-600'
    },
    {
      name: 'Story Generation',
      usage: getUsageLevel(storyGenerationCount, totalFeatures),
      color: 'text-green-600'
    },
    {
      name: 'Personalization',
      usage: getUsageLevel(personalizationCount, totalFeatures),
      color: 'text-purple-600'
    }
  ];

  return { features, avgUsageTime };
} 