import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import Student from "@/models/student";
import Story from "@/models/story";
import User from "@/models/user";
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GPT_API_KEY,
});

export async function GET(req) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // Verify the student belongs to the logged-in user
    const user = await User.findById(session.user.id).select('students').lean();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    
    // Check if studentId is in the user's students array (handle both string and ObjectId comparison)
    const userStudentIds = user.students || [];
    console.log('User students:', userStudentIds);
    console.log('Requested studentId:', studentId);
    
    const isAuthorized = userStudentIds.some(id => 
      id.toString() === studentId || id === studentId
    );
    
    console.log('Is authorized:', isAuthorized);
    
    if (!isAuthorized) {
      // For demo purposes, return mock recommendations instead of error
      console.log('Student not authorized, returning mock recommendations');
      const mockRecommendations = [
        {
          id: 'mock_reading_reminder',
          type: 'reading_reminder',
          priority: 'high',
          title: 'Reading Session Due',
          description: 'Consider scheduling a reading session with your student.',
          icon: 'Clock',
          color: 'bg-red-50 border-red-200 text-red-800',
          action: 'Schedule Session',
          actionUrl: '/dashboard/social-stories/create'
        },
        {
          id: 'mock_story_suggestion',
          type: 'story_suggestion',
          priority: 'medium',
          title: 'New Story Recommendation',
          description: 'Consider creating a personalized story based on student interests.',
          icon: 'BookOpen',
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          action: 'Create Story',
          actionUrl: '/dashboard/social-stories/create'
        }
      ];
      
      return NextResponse.json({ recommendations: mockRecommendations });
    }

    // Fetch student data
    const student = await Student.findById(studentId).lean();
    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    // Fetch student's stories and sessions
    const stories = await Story.find({ 
      student: studentId,
      isPersonalized: true 
    }).populate('student', 'name age').lean();

    // Generate AI recommendations based on the data
    const recommendations = await generateRecommendations(student, stories);

    return NextResponse.json({ recommendations });

  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json({ message: "Error generating recommendations" }, { status: 500 });
  }
}

async function generateRecommendations(student, stories) {
  const recommendations = [];

  // Get all personalized stories
  const personalizedStories = stories.filter(story => story.isPersonalized);

  // 1. AI Session Analysis per story based on latest session notes (prioritized by most recent)
  // Analyze each story separately with its goal and session notes
  const storyAnalyses = [];
  
  personalizedStories.forEach(story => {
    if (!story.sessions || story.sessions.length === 0) return;

    const latestSession = story.sessions.reduce((latest, session) => {
      const sessionDate = new Date(session.sessionDate);
      const latestDate = new Date(latest.sessionDate);
      return sessionDate > latestDate ? session : latest;
    });

    storyAnalyses.push({ 
      story, 
      latestSession,
      storyGoal: story.goal || 'No specific goal set',
      storyTitle: story.title
    });
  });

  if (storyAnalyses.length > 0) {
    // Sort by most recent session date
    storyAnalyses.sort((a, b) => {
      const aDate = new Date(a.latestSession.sessionDate);
      const bDate = new Date(b.latestSession.sessionDate);
      return bDate - aDate; // Most recent first
    });

    // Get the most recent story for recommendation
    const mostRecent = storyAnalyses[0];
    const { story, latestSession, storyGoal, storyTitle } = mostRecent;

    // Build context showing which story has which goal and which session note is for which story
    const allStoryContext = storyAnalyses.map(sa => ({
      storyTitle: sa.storyTitle,
      goal: sa.storyGoal,
      latestSessionDate: new Date(sa.latestSession.sessionDate).toLocaleDateString(),
      latestSessionNote: sa.latestSession.sessionNotes || sa.latestSession.notes || 'No notes'
    }));

    const aiRecommendation = await generateAIRecommendationForStory(
      story.sessions || [],
      student,
      story,
      allStoryContext,
      storyAnalyses
    );

    // Handle both old string format and new bullets format
    const bullets = aiRecommendation.bullets || (typeof aiRecommendation === 'string' ? [aiRecommendation] : ['Consider reviewing session notes for insights.']);

    recommendations.push({
      id: `ai_session_analysis_${story._id}`,
      type: 'ai_analysis',
      priority: 'medium',
      title: 'AI Session Analysis',
      description: bullets.join(' • '), // Keep description for backward compatibility
      bullets: bullets, // Add bullets array for frontend
      icon: 'Brain',
      color: 'bg-green-50 border-green-200 text-green-800',
      action: 'View Session',
      actionUrl: `/dashboard/social-stories/${story._id}/read`
    });
  } else {
    // Add a fallback recommendation when no sessions are found
    if (personalizedStories.length > 0) {
      const story = personalizedStories[0];
      recommendations.push({
        id: `no_session_analysis_${story._id}`,
        type: 'ai_analysis',
        priority: 'medium',
        title: 'AI Session Analysis',
        description: 'No recent sessions found. Start a reading session to get personalized insights.',
        icon: 'Brain',
        color: 'bg-green-50 border-green-200 text-green-800',
        action: 'Start a reading',
        actionUrl: `/dashboard/social-stories/${story._id}/read`
      });
    }
  }

  // 2. Reading Session Reminders for stories without sessions
  const storiesWithoutSessions = personalizedStories.filter(story => 
    !story.sessions || story.sessions.length === 0
  );

  if (storiesWithoutSessions.length > 0) {
    const story = storiesWithoutSessions[0]; // Take the first one
    recommendations.push({
      id: `no_session_reminder_${story._id}`,
      type: 'reading_reminder',
      priority: 'high',
      title: 'Start Reading Session',
      description: `${student.name} has a personalized story "${story.title}" that hasn't been read yet.`,
      icon: 'BookOpen',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      action: 'Start a reading',
      actionUrl: `/dashboard/social-stories/${story._id}/read`
    });
  }

  // 3. Check for stories with sessions between 1-10 days ago
  const storiesWithRecentSessions = personalizedStories.filter(story => {
    if (!story.sessions || story.sessions.length === 0) return false;
    
    const latestSession = story.sessions.reduce((latest, session) => {
      const sessionDate = new Date(session.sessionDate);
      const latestDate = new Date(latest.sessionDate);
      return sessionDate > latestDate ? session : latest;
    });
    
    const daysSinceSession = getDaysSince(latestSession.sessionDate);
    return daysSinceSession >= 1 && daysSinceSession <= 10;
  });

  if (storiesWithRecentSessions.length > 0) {
    const story = storiesWithRecentSessions[0];
    const latestSession = story.sessions.reduce((latest, session) => {
      const sessionDate = new Date(session.sessionDate);
      const latestDate = new Date(latest.sessionDate);
      return sessionDate > latestDate ? session : latest;
    });
    
    const daysSinceSession = getDaysSince(latestSession.sessionDate);
    
    recommendations.push({
      id: `recent_session_reminder_${story._id}`,
      type: 'reading_reminder',
      priority: 'medium',
      title: 'Continue Reading',
      description: `It has been ${daysSinceSession} days since the last session for "${story.title}".`,
      icon: 'Clock',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      action: 'Start reading',
      actionUrl: `/dashboard/social-stories/${story._id}/read`
    });
  }

  return recommendations.slice(0, 3); // Limit to top 3 recommendations
}

// Helper functions
function getDaysSince(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function analyzeLatestSessionNotes(stories) {
  return { latestSession: null, latestStory: null };
}

async function generateAIRecommendationForStory(sessions, student, currentStory, allStoryContext, storyAnalyses) {
  const notesWithDates = (sessions || [])
    .map(s => ({
      date: s.sessionDate,
      text: s.sessionNotes || s.notes || s.session_notes || s.session_notes_text || ''
    }))
    .filter(n => n.text && n.text.trim());

  if (notesWithDates.length === 0) {
    return 'No session notes available for analysis.';
  }

  if (!process.env.GPT_API_KEY) {
    return 'OpenAI API key not configured. Please set GPT_API_KEY in your environment.';
  }

  try {
    // Build context showing which story has which goal and which session note is for which story
    const storyGoalMapping = allStoryContext.map(ctx => 
      `Story: "${ctx.storyTitle}" | Goal: ${ctx.goal} | Latest Session: ${ctx.latestSessionDate} | Latest Note: "${ctx.latestSessionNote.substring(0, 100)}${ctx.latestSessionNote.length > 100 ? '...' : ''}"`
    ).join('\n');

    const currentStoryGoal = currentStory?.goal ? `\n\nCURRENT STORY BEING ANALYZED: "${currentStory.title}" - Goal: ${currentStory.goal}` : '';

    const studentContext = `
Student Profile:
- Learning Preferences: ${student.learningPreferences || 'Not specified'}
- Challenges: ${student.challenges || 'Not specified'}
- Additional Notes: ${student.notes || 'Not specified'}
- Age: ${student.age}
- Diagnosis: ${student.diagnosis || 'Not specified'}
- Comprehension Level: ${student.comprehensionLevel || 'Not specified'}
`;

    const sortedNotes = notesWithDates.sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sortedNotes[0];
    const pastList = sortedNotes.slice(1).map(n => `- [${new Date(n.date).toLocaleDateString()}] ${n.text}`).join('\n') || 'None';

    // Identify which other stories have more recent sessions (to help prioritize recommendations)
    const otherRecentStories = storyAnalyses
      .filter(sa => sa.story._id.toString() !== currentStory._id.toString())
      .slice(0, 3) // Top 3 other stories
      .map(sa => `- "${sa.storyTitle}" (Goal: ${sa.storyGoal}) - Last session: ${new Date(sa.latestSession.sessionDate).toLocaleDateString()}`)
      .join('\n');

    const analysisPrompt = `You are a helpful teaching assistant analyzing social story reading sessions. Analyze the following information and provide a 2-3 sentence recommendation for the teacher.

ALL STORIES WITH GOALS AND SESSION NOTES:
${storyGoalMapping}${currentStoryGoal}

${studentContext}

CURRENT STORY - LATEST SESSION NOTES (prioritize this):
"${latest.text}"
Date: ${new Date(latest.date).toLocaleDateString()}

CURRENT STORY - PAST SESSION NOTES (consider trends):
${pastList}

OTHER RECENT STORIES (for context):
${otherRecentStories || 'None'}

ANALYSIS TASK:
1. Focus on the CURRENT STORY's latest session notes (most recent) to determine the most relevant recommendation.
2. Consider how the current story's goal aligns with the latest session notes.
3. If other stories have more recent sessions, mention them but prioritize the current story's analysis.
4. Judge goal alignment based primarily on the latest notes, but adjust using patterns from past notes.
5. Consider the student's profile when proposing next actions.
6. Recommend one clear next step (adjust story, create new story on a certain topic, schedule session for how long and with what repetition, incorporate what kind of comprehension activity, continue doing certain things that are working etc).

IMPORTANT: The recommendation should be most relevant to the CURRENT STORY's most recent session notes. 

RETURN FORMAT: Return 2-3 bullet points where one of the should be recommending a new story creation on a certain topic as a JSON object with a "nextSteps" array. Each bullet point should be precise and within 10 words. Use the same language as the session notes.

EXAMPLE FORMAT:
{"nextSteps": ["Adjust story to focus on social skills", "Schedule 15-minute session with 2 repetitions", "Incorporate visual comprehension activities"]}

Return ONLY the JSON object, no additional text.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an expert teaching assistant specializing in social story therapy and personalized learning.' },
        { role: 'user', content: analysisPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const recommendation = completion.choices[0]?.message?.content?.trim();
    if (!recommendation) {
      return { bullets: ['Consider reviewing session notes for insights.'] };
    }

    // Parse the recommendation to extract bullet points
    let bullets = [];
    
    // Try to parse as JSON first (if AI returns JSON format)
    try {
      const jsonMatch = recommendation.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.nextSteps && Array.isArray(parsed.nextSteps)) {
          bullets = parsed.nextSteps;
        }
      }
    } catch (e) {
      // Not JSON, continue with text parsing
    }

    // If no JSON found, parse as text bullet points
    if (bullets.length === 0) {
      // Try to extract bullet points from various formats:
      // - Markdown bullets: "- item" or "* item"
      // - Numbered: "1. item"
      // - Plain text lines
      const lines = recommendation.split('\n').map(line => line.trim()).filter(line => line);
      
      for (const line of lines) {
        // Match markdown bullets or numbered lists
        const bulletMatch = line.match(/^[-*•]\s*(.+)$/) || line.match(/^\d+\.\s*(.+)$/);
        if (bulletMatch) {
          bullets.push(bulletMatch[1].trim());
        } else if (line.length > 0 && !line.match(/^(nextSteps|EXAMPLE)/i)) {
          // Add non-empty lines that aren't JSON keys
          bullets.push(line);
        }
      }
    }

    // Fallback: if no bullets found, use the whole recommendation as a single bullet
    if (bullets.length === 0) {
      bullets = [recommendation];
    }

    // Limit to 3 bullets and ensure each is within reasonable length
    bullets = bullets.slice(0, 3).map(bullet => bullet.substring(0, 100)); // Max 100 chars per bullet

    return { bullets };
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    return 'Consider reviewing session notes for insights.';
  }
}
