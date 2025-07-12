// components/StoryTopics.js
import React from 'react';

const StoryTopics = () => {
  const topics = [
    { name: 'Waiting Turn', percentage: 34 },
    { name: 'Handling Transitions', percentage: 28 },
    { name: 'Social Greetings', percentage: 19 },
    { name: 'Other', percentage: 19 }
  ];

  const getBarWidth = (percentage) => {
    return `${(percentage / 34) * 100}%`; // 34 is the max percentage
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Most Common Story Topics
      </h3>
      <div className="space-y-6">
        {topics.map((topic, index) => (
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
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
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