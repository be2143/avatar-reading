// components/FeatureUsage.js
import React from 'react';

const FeatureUsage = () => {
  const features = [
    { name: 'General Story Reading', usage: 'Most Used', color: 'text-blue-600' },
    { name: 'Story Generation', usage: 'Medium Usage', color: 'text-green-600' },
    { name: 'Personalization', usage: 'High Usage', color: 'text-blue-600' }
  ];

  const getUsageColor = (usage) => {
    switch (usage) {
      case 'Most Used':
        return 'text-blue-600';
      case 'High Usage':
        return 'text-blue-600';
      case 'Medium Usage':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Feature Usage
      </h3>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div key={index} className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-700">
              {feature.name}
            </span>
            <span className={`text-sm font-medium ${getUsageColor(feature.usage)}`}>
              {feature.usage}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600 mb-1">
          Avg. Story Usage Time
        </div>
        <div className="text-3xl font-bold text-gray-800 mb-1">
          12.5 min
        </div>
        <div className="text-sm text-gray-600">
          per story
        </div>
      </div>
    </div>
  );
};

export default FeatureUsage;