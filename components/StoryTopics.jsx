// components/StoryTopics.js
import React, { useState, useEffect } from 'react';

const StoryTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStoryTopicsData();
  }, []);

  const fetchStoryTopicsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-analysis/story-topics');
      if (!response.ok) {
        throw new Error('Failed to fetch story topics data');
      }
      
      const result = await response.json();
      setTopics(result.topics || getDefaultTopics());
    } catch (err) {
      console.error('Error fetching story topics data:', err);
      setError(err.message);
      setTopics(getDefaultTopics());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTopics = () => [
    { name: 'No Data Available', percentage: 0 }
  ];

  const getBarWidth = (percentage) => {
    if (percentage === 0) return '0%';
    const maxPercentage = Math.max(...topics.map(t => t.percentage));
    return `${(percentage / maxPercentage) * 100}%`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Most Common Story Topics
        </h3>
        <div className="space-y-6">
          {[1, 2, 3, 4].map((index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-200 h-2 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Most Common Story Topics
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading data</div>
          <button 
            onClick={fetchStoryTopicsData}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter out topics with 0 percentage for better visualization
  const filteredTopics = topics.filter(topic => topic.percentage > 0);

  if (filteredTopics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Most Common Story Topics
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400">No story topics available</div>
          <div className="text-sm text-gray-500 mt-1">Create some stories to see topic distribution</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Most Common Story Topics
      </h3>
      <div className="space-y-6">
        {filteredTopics.map((topic, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {topic.name}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {topic.percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: getBarWidth(topic.percentage) }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryTopics;