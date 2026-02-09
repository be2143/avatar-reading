import { useEffect, useState } from 'react';
import { Lightbulb, Clock, BookOpen, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function AIRecommendations({ studentId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchRecommendations();
    }
  }, [studentId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/ai-recommendations?studentId=${studentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      setError(err.message);
      // Fallback to mock data for demo
      setRecommendations(generateMockRecommendations());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendations = () => {
    return [
      {
        id: 1,
        type: 'reading_reminder',
        priority: 'high',
        title: 'Reading Session Due',
        description: 'Alex hasn\'t read a story in 3 days. Consider starting a reading session with "Morning Routine" story.',
        icon: 'Clock',
        color: 'bg-red-50 border-red-200 text-red-800',
        action: 'Start Reading',
        actionUrl: `/dashboard/social-stories/1/read`
      },
      {
        id: 2,
        type: 'story_suggestion',
        priority: 'medium',
        title: 'New Story Recommendation',
        description: 'Based on Alex\'s interest in animals and recent progress, consider creating a story about "Going to the Zoo".',
        icon: 'BookOpen',
        color: 'bg-blue-50 border-blue-200 text-blue-800',
        action: 'Create Story',
        actionUrl: '/dashboard/social-stories/create'
      },
      {
        id: 3,
        type: 'progress_insight',
        priority: 'low',
        title: 'Positive Progress Detected',
        description: 'Alex shows 23% improvement in comprehension when stories include visual cues. Continue this approach.',
        icon: 'TrendingUp',
        color: 'bg-green-50 border-green-200 text-green-800',
        action: 'View Details',
        actionUrl: '/dashboard/ai-analysis'
      },
      {
        id: 4,
        type: 'personalization_tip',
        priority: 'medium',
        title: 'Personalization Opportunity',
        description: 'Add more peer interaction themes to stories. Alex engages 40% longer with social scenarios.',
        icon: 'Lightbulb',
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        action: 'Personalize Story',
        actionUrl: '/dashboard/social-stories/1/personalize'
      },
      {
        id: 5,
        type: 'goal_reminder',
        priority: 'high',
        title: 'Goal Progress Update',
        description: 'Alex is 75% toward the "Independent Reading" goal. Consider more challenging stories.',
        icon: 'CheckCircle',
        color: 'bg-purple-50 border-purple-200 text-purple-800',
        action: 'Update Goals',
        actionUrl: `/dashboard/students/${studentId}`
      }
    ];
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Clock: Clock,
      BookOpen: BookOpen,
      TrendingUp: TrendingUp,
      Lightbulb: Lightbulb,
      CheckCircle: CheckCircle,
      AlertCircle: AlertCircle
    };
    return icons[iconName] || Lightbulb;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: 'bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full',
      medium: 'bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full',
      low: 'bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'
    };
    return badges[priority] || badges.medium;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg mb-1">Session Recommendations</h2>
        <div className="border-b border-gray-100 mb-2" />
        <div className="text-gray-400 text-sm py-6 text-center">Analyzing student data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-semibold text-lg mb-1">Session Recommendations</h2>
        <div className="border-b border-gray-100 mb-2" />
        <div className="text-red-500 text-sm py-6 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow space-y-4">
      <h2 className="font-semibold text-lg mb-1">Session Recommendations</h2>
      <div className="border-b border-gray-100 mb-2" />
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="text-gray-400 text-sm py-6 text-center">No recommendations available.</div>
        ) : (
          recommendations.map((recommendation) => {
            const IconComponent = getIconComponent(recommendation.icon);
            return (
              <div
                key={recommendation.id}
                className={`p-3 rounded-lg border ${recommendation.color} hover:shadow-md transition-shadow duration-200`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="w-5 h-5 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm">{recommendation.title}</h3>
                    </div>
                    {recommendation.bullets && Array.isArray(recommendation.bullets) ? (
                      <ul className="text-sm text-gray-700 mb-2 space-y-1 list-disc list-inside">
                        {recommendation.bullets.map((bullet, index) => (
                          <li key={index} className="leading-relaxed">{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-700 mb-2">{recommendation.description}</p>
                    )}
                    {recommendation.action && recommendation.actionUrl && (
                      <div className="mt-3">
                        <a
                          href={recommendation.actionUrl}
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          {recommendation.action}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 