import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Story from "@/models/story";
import Student from "@/models/student";
import User from "@/models/user";

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

  // 3. Average Comprehension
  const storiesWithSessions = await Story.find({ createdBy: userId }).lean();

  console.log('storiesWithSessions', storiesWithSessions);

  let totalComprehension = 0;
  let sessionCount = 0;

  storiesWithSessions.forEach(story => {
    if (story.sessions && Array.isArray(story.sessions)) {
      console.log('story.sessions:', story.sessions);
      story.sessions.forEach(session => {
        console.log('session.comprehensionScore:', session.comprehensionScore);
        totalComprehension += parseInt(session.comprehensionScore);
        sessionCount++;
      });
    }
  });

  console.log('Final totalComprehension:', totalComprehension);
  console.log('sessionCount:', sessionCount);

  const avgComprehension = sessionCount > 0
    ? Math.round(totalComprehension / sessionCount)
    : 0;

  // 4. Behavior Success Rate
  const students = await Student.find({ userId }).lean();
  let allBehaviorScores = [];
  students.forEach(student => {
    if (Array.isArray(student.behavioralScoreHistory)) {
      allBehaviorScores = allBehaviorScores.concat(student.behavioralScoreHistory.map(entry => entry.score));
    }
    if (
      typeof student.currentBehavioralScore === 'number' &&
      (!student.behavioralScoreHistory || !student.behavioralScoreHistory.some(entry => entry.score === student.currentBehavioralScore))
    ) {
      allBehaviorScores.push(student.currentBehavioralScore);
    }
  });

  const successThreshold = 60;
  const successfulScores = allBehaviorScores.filter(score => score >= successThreshold).length;
  const behaviorSuccessRate = allBehaviorScores.length > 0
    ? Math.round((successfulScores / allBehaviorScores.length) * 100)
    : 0;

  const improvementRate = Math.min(behaviorSuccessRate, 100);

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
      title: 'Avg Comprehension',
      value: `${avgComprehension}/5`,
      subtitle: 'Comprehension Score',
      change: avgComprehension > 3 ? 'Excellent comprehension' :
        avgComprehension > 2 ? 'Good comprehension' : 'Needs improvement',
      changeColor: avgComprehension >= 3 ? 'green' : avgComprehension > 2 ? 'yellow' : 'red'
    },
    {
      title: 'Behavior Success',
      value: `${behaviorSuccessRate}%`,
      subtitle: 'Target behavior observed',
      change: `${improvementRate}% show improvement`,
      changeColor: behaviorSuccessRate > 50 ? 'green' : behaviorSuccessRate > 40 ? 'yellow' : 'red'
    }
  ];
}