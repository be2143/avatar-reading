import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Story from "@/models/story";
import Student from "@/models/student";
import User from "@/models/user";
import { calculateAverageSessionTime } from "@/lib/aiAnalysisUtils";

export async function GET(req) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await User.findById(userId).select('students').lean();

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userStudentIds = user.students || [];

    console.log("userStudentIds", userStudentIds);

    // Calculate metrics based on actual data
    const metrics = await calculateMetrics(userId, userStudentIds);

    console.log("Calculated metrics: ", metrics);

    return NextResponse.json({ metrics });

  } catch (error) {
    console.error("Error calculating metrics:", error);
    return NextResponse.json({ message: "Error calculating metrics" }, { status: 500 });
  }
}

async function calculateMetrics(userId, userStudentIds) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // 1. Stories This Month
  console.log('Calculating stories for user:', userId);
  console.log('First day of month:', firstDayOfMonth);

  // Use let instead of const for variables that need reassignment
  let storiesThisMonth = await Story.countDocuments({
    createdBy: userId,
    createdAt: { $gte: firstDayOfMonth }
  });

  const storiesLastMonth = await Story.countDocuments({
    createdBy: userId,
    createdAt: { $gte: lastMonth, $lt: firstDayOfMonth }
  });

  console.log('Stories this month:', storiesThisMonth);
  console.log('Stories last month:', storiesLastMonth);

  // Debug: Check all stories for this user
  const allStories = await Story.find({ createdBy: userId }).select('createdAt createdBy title').lean();
  console.log('Total stories for user:', allStories.length);
  console.log('Sample stories:', allStories.slice(0, 3));

  // Calculate change percentage
  let storiesChange = 0;
  let changeText = 'No change';

  console.log('Calculating change:');
  console.log('- storiesThisMonth:', storiesThisMonth);
  console.log('- storiesLastMonth:', storiesLastMonth);

  if (storiesLastMonth > 0) {
    const changePercent = ((storiesThisMonth - storiesLastMonth) / storiesLastMonth) * 100;
    storiesChange = Math.round(changePercent);

    // Cap the percentage to prevent unrealistic values
    if (storiesChange > 1000) {
      storiesChange = 1000;
      changeText = '+1000%+ vs last month';
    } else {
      changeText = storiesChange > 0 ? `+${storiesChange}% vs last month` :
        storiesChange < 0 ? `${storiesChange}% vs last month` : 'No change';
    }
    console.log('- Calculated change:', storiesChange);
  } else if (storiesThisMonth > 0) {
    // If no stories last month but stories this month, show as new activity
    changeText = 'New activity this month';
    storiesChange = 0;
    console.log('- New activity, setting change to 0');
  } else {
    // No stories in either month
    changeText = 'No stories yet';
    storiesChange = 0;
    console.log('- No stories in either month');
  }

  console.log('- Final changeText:', changeText);
  console.log('- Final storiesChange:', storiesChange);

  // Fallback: If no stories found with createdBy, try without it
  if (storiesThisMonth === 0) {
    console.log('No stories found with createdBy, trying without filter...');
    const fallbackStoriesThisMonth = 0;
    console.log('Fallback stories this month:', fallbackStoriesThisMonth);

    // Only use fallback if we actually found stories
    if (fallbackStoriesThisMonth > 0) {
      storiesThisMonth = fallbackStoriesThisMonth;
      console.log('Using fallback count:', storiesThisMonth);
    }
  }

  // 2. Personalization Rate
  const totalStories = await Story.countDocuments({ createdBy: userId });
  const personalizedStories = await Story.countDocuments({
    createdBy: userId,
    isPersonalized: true
  });

  const personalizationRate = totalStories > 0
    ? Math.round((personalizedStories / totalStories) * 100)
    : 0;

  const libraryStories = totalStories - personalizedStories;

  // 3. Average Reading Session Time (using shared utility function)
  const { avgSessionMinutes } = await calculateAverageSessionTime(userId);

  // 4. Behavior Success — average current behavioral score (0–10) across students
  const students = await Student.find({ userId }).lean();
  const currentScores = students
    .map((s) => (typeof s.currentBehavioralScore === 'number' ? s.currentBehavioralScore : null))
    .filter((score) => typeof score === 'number' && !isNaN(score));

  const avgBehaviorScore =
    currentScores.length > 0
      ? currentScores.reduce((sum, score) => sum + score, 0) / currentScores.length
      : 0;

  return [
    {
      title: 'Stories This Month',
      value: storiesThisMonth.toString(),
      subtitle: 'Stories Delivered',
      change: changeText,
      changeColor: (storiesChange > 0 || (storiesThisMonth > 0 && storiesLastMonth === 0)) ? 'green' : storiesChange < 0 ? 'red' : 'gray'
    },
    {
      title: 'Personalization Rate',
      value: `${personalizationRate}%`,
      subtitle: `vs ${100 - personalizationRate}% library stories`,
      change: personalizationRate > 50 ? 'High personalization' : 'Consider more personalization',
      changeColor: personalizationRate > 40 ? 'green' : 'yellow'
    },
    {
      title: 'Avg. Reading Session Time',
      value: `${avgSessionMinutes.toFixed(1)} min`,
      subtitle: 'per story',
      change: avgSessionMinutes > 2
        ? 'Strong engagement'
        : avgSessionMinutes > 0.5
          ? 'Moderate engagement'
          : 'Limited engagement',
      changeColor: avgSessionMinutes > 2 ? 'green' : avgSessionMinutes > 0.5 ? 'yellow' : 'red'
    },
    {
      title: 'Behavior Success',
      value: `${avgBehaviorScore.toFixed(1)}/10`,
      subtitle: 'Avg behavioral score',
      change:
        avgBehaviorScore >= 7
          ? 'Strong behavioral progress'
          : avgBehaviorScore >= 4
            ? 'Moderate progress'
            : 'Needs support',
      changeColor: avgBehaviorScore >= 7 ? 'green' : avgBehaviorScore >= 4 ? 'yellow' : 'red'
    }
  ];
}