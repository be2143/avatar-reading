import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if it's the same day
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) return 'Today';
  
  // Check if it's yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) return 'Yesterday';
  
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getActivityIcon(activity) {
  // For stories, use story-specific emoji if available
  if (activity.type === 'personalized' || activity.type === 'generated') {
    return getStoryEmoji(activity);
  }
  
  switch (activity.type) {
    case 'session':
      return '📚';
    case 'student':
      return '👤';
    default:
      return '📖';
  }
}

function getStoryEmoji(story) {
  // Check if story has a custom emoji
  if (story.emoji) {
    return story.emoji;
  }
  
  // Extract emoji from story title if it starts with one
  if (story.title && /^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(story.title)) {
    const emojiMatch = story.title.match(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
    if (emojiMatch) {
      return emojiMatch[0];
    }
  }
  
  // Determine emoji based on story content or theme
  const title = story.title?.toLowerCase() || '';
  const description = story.description?.toLowerCase() || '';
  const content = `${title} ${description}`;
  
  // Animal stories
  if (content.includes('animal') || content.includes('pet') || content.includes('dog') || content.includes('cat') || 
      content.includes('zoo') || content.includes('farm') || content.includes('bird') || content.includes('horse')) {
    return '🐾';
  }
  
  // Transportation stories
  if (content.includes('car') || content.includes('bus') || content.includes('train') || content.includes('bike') || 
      content.includes('plane') || content.includes('truck') || content.includes('walk')) {
    return '🚗';
  }
  
  // School/learning stories
  if (content.includes('school') || content.includes('classroom') || content.includes('teacher') || 
      content.includes('homework') || content.includes('learning') || content.includes('book')) {
    return '📚';
  }
  
  // Family stories
  if (content.includes('family') || content.includes('mom') || content.includes('dad') || 
      content.includes('sister') || content.includes('brother') || content.includes('parent')) {
    return '👨‍👩‍👧‍👦';
  }
  
  // Food stories
  if (content.includes('food') || content.includes('eat') || content.includes('lunch') || 
      content.includes('dinner') || content.includes('breakfast') || content.includes('snack')) {
    return '🍕';
  }
  
  // Play/game stories
  if (content.includes('play') || content.includes('game') || content.includes('toy') || 
      content.includes('fun') || content.includes('activity') || content.includes('park')) {
    return '🎮';
  }
  
  // Emotion stories
  if (content.includes('happy') || content.includes('sad') || content.includes('angry') || 
      content.includes('excited') || content.includes('feel') || content.includes('emotion')) {
    return '😊';
  }
  
  // Nature stories
  if (content.includes('tree') || content.includes('flower') || content.includes('sun') || 
      content.includes('rain') || content.includes('outdoor') || content.includes('garden')) {
    return '🌳';
  }
  
  // Sports stories
  if (content.includes('ball') || content.includes('run') || content.includes('jump') || 
      content.includes('sport') || content.includes('exercise') || content.includes('soccer')) {
    return '⚽';
  }
  
  // Color stories
  if (content.includes('red') || content.includes('blue') || content.includes('green') || 
      content.includes('yellow') || content.includes('purple') || content.includes('orange')) {
    return '🎨';
  }
  
  // Number/math stories
  if (content.includes('one') || content.includes('two') || content.includes('three') || 
      content.includes('count') || content.includes('number') || content.includes('math')) {
    return '🔢';
  }
  
  // Music stories
  if (content.includes('song') || content.includes('music') || content.includes('sing') || 
      content.includes('dance') || content.includes('rhythm') || content.includes('melody')) {
    return '🎵';
  }
  
  // Default emojis based on story type
  if (story.type === 'personalized') {
    return '✨';
  } else if (story.type === 'generated') {
    return '🎨';
  }
  
  return '📖';
}

function getActivityLabel(activity) {
  switch (activity.type) {
    case 'session':
      return 'Reading Session';
    case 'personalized':
      return 'Personalized Story';
    case 'generated':
      return 'Generated Story';
    case 'student':
      return 'New Student';
    default:
      return 'Activity';
  }
}

export default function RecentActivity() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchActivities() {
      if (!session?.user?.id) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch multiple types of activities
        const [storiesRes, sessionsRes, studentsRes] = await Promise.all([
          fetch('/api/stories?type=all'),
          fetch('/api/stories/session'),
          fetch('/api/students?recent=true')
        ]);

        const activities = [];

        // Process stories (personalized and generated)
        if (storiesRes.ok) {
          const storiesData = await storiesRes.json();
          const stories = Array.isArray(storiesData) ? storiesData : [];
          stories.forEach(story => {
            // Only include generated stories created by the current user
            if (story.isPersonalized || 
                (!story.isPersonalized && story.createdBy === session.user.id)) {
              activities.push({
                ...story,
                type: story.isPersonalized ? 'personalized' : 'generated',
                title: story.title,
                createdAt: story.createdAt,
                storyId: story._id
              });
            }
          });
        }

        // Process reading sessions
        if (sessionsRes.ok) {
          const sessionsData = await sessionsRes.json();
          const sessions = Array.isArray(sessionsData) ? sessionsData : [];
          sessions.forEach(session => {
            activities.push({
              ...session,
              type: 'session',
              title: `Reading session with ${session.studentName || 'student'}`,
              createdAt: session.createdAt,
              sessionId: session._id,
              studentId: session.studentId || session._id?.replace('session_', '')
            });
          });
        }

        // Process new students - only include students belonging to the current user
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          const students = Array.isArray(studentsData) ? studentsData : [];
          students.forEach(student => {
            if (student.userId === session.user.id) {
              activities.push({
                ...student,
                type: 'student',
                title: `Added ${student.name}`,
                createdAt: student.createdAt,
                studentId: student._id
              });
            }
          });
        }

        // Sort all activities by date and take top 10
        const sorted = activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setActivities(sorted.slice(0, 10)); // Always take top 10
      } catch (err) {
        setError(err.message);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchActivities();
  }, [session]);

  const handleActivityClick = (activity) => {
    switch (activity.type) {
      case 'personalized':
      case 'generated':
        if (activity.storyId) {
          router.push(`/dashboard/social-stories/${activity.storyId}/read`);
        } else {
          router.push('/dashboard/social-stories');
        }
        break;
      case 'session':
        if (activity.studentId) {
          // Navigate to the student's story read page
          router.push(`/dashboard/students/${activity.studentId}`);
        } else {
          router.push('/dashboard/social-stories');
        }
        break;
      case 'student':
        if (activity.studentId) {
          router.push(`/dashboard/students/${activity.studentId}`);
        } else {
          router.push('/dashboard/students');
        }
        break;
      default:
        router.push('/dashboard');
    }
  };

  // Determine how many activities to show based on showAll state
  const displayedActivities = showAll ? activities : activities.slice(0, 3);

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg mb-1">Recent Activity</h2>
      <div className="border-b border-gray-100 mb-2" />
      <div className="space-y-2">
        {loading ? (
          <div className="text-gray-400 text-sm py-6 text-center">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-sm py-6 text-center">{error}</div>
        ) : activities.length === 0 ? (
          <div className="text-gray-400 text-sm py-6 text-center">No recent activity.</div>
        ) : (
          displayedActivities.map((activity, index) => (
            <div
              key={activity._id || index}
              className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors duration-150 group shadow-sm cursor-pointer"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow text-3xl group-hover:scale-110 transition-transform duration-200">
                {getActivityIcon(activity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm break-words whitespace-normal">
                  {activity.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {getActivityLabel(activity)}
                  {activity.student && activity.student.name ? (
                    <>
                      {activity.student.name}
                      {activity.student.age ? ` - Age ${activity.student.age}` : ''}
                    </>
                  ) : activity.studentName ? (
                    ` - ${activity.studentName}`
                  ) : activity.type === 'session' ? (
                    ' - Reading session'
                  ) : (
                    ''
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {activities.length > 3 && (
        <div className="pt-2 text-center">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium bg-transparent border-none p-0 m-0 cursor-pointer" 
            style={{textDecoration: 'none'}}
          >
            {showAll ? 'Show less' : 'See more...'}
          </button>
        </div>
      )}
    </div>
  );
}