// components/FeatureUsage.js
import React, { useState, useEffect } from 'react';

const FeatureUsage = () => {
  const [features, setFeatures] = useState([]);
  const [avgUsageTime, setAvgUsageTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeatureUsageData();
  }, []);

  const fetchFeatureUsageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-analysis/feature-usage');
      if (!response.ok) {
        throw new Error('Failed to fetch feature usage data');
      }
      
      const result = await response.json();
      setFeatures(result.features || getDefaultFeatures());
      setAvgUsageTime(result.avgUsageTime || 0);
    } catch (err) {
      console.error('Error fetching feature usage data:', err);
      setError(err.message);
      setFeatures(getDefaultFeatures());
      setAvgUsageTime(0);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultFeatures = () => [
    { name: 'General Story Reading', usage: 'No Data', color: 'text-gray-600' },
    { name: 'Story Generation', usage: 'No Data', color: 'text-gray-600' },
    { name: 'Personalization', usage: 'No Data', color: 'text-gray-600' }
  ];

  const getUsageColor = (usage) => {
    switch (usage) {
      case 'Most Used':
        return 'text-blue-600';
      case 'High Usage':
        return 'text-blue-600';
      case 'Medium Usage':
        return 'text-green-600';
      case 'Low Usage':
        return 'text-yellow-600';
      case 'No Data':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Feature Usage
        </h3>
        <div className="space-y-4">
          {getDefaultFeatures().map((feature, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Feature Usage
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading data</div>
          <button 
            onClick={fetchFeatureUsageData}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
          {avgUsageTime > 0 ? `${avgUsageTime.toFixed(1)} min` : 'No data'}
        </div>
        <div className="text-sm text-gray-600">
          per story
        </div>
      </div>
    </div>
  );
};

export default FeatureUsage;