import Story from "@/models/story";

/**
 * Calculate average reading session time across all stories for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Average session time in minutes
 */
export async function calculateAverageSessionTime(userId) {
  const stories = await Story.find({ createdBy: userId }).lean();

  let totalTimeSpentSeconds = 0;
  let sessionCount = 0;

  stories.forEach(story => {
    if (story.sessions && Array.isArray(story.sessions)) {
      story.sessions.forEach(session => {
        // Validate that timeSpent is a valid number
        if (typeof session.timeSpent === 'number' && !isNaN(session.timeSpent) && session.timeSpent > 0) {
          totalTimeSpentSeconds += session.timeSpent;
          sessionCount++;
        }
      });
    }
  });

  // Calculate average in minutes
  const avgSessionMinutes = sessionCount > 0
    ? totalTimeSpentSeconds / sessionCount / 60
    : 0;

  return {
    avgSessionMinutes,
    totalSessions: sessionCount,
    totalTimeSpentSeconds
  };
}

