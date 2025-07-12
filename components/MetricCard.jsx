// components/MetricCard.js
import React from 'react';

const MetricCard = ({ title, value, subtitle, change, changeColor = 'green' }) => {
  const getBackgroundColor = () => {
    switch (title.toLowerCase()) {
      case 'stories this month':
        return 'bg-red-100';
      case 'personalization rate':
        return 'bg-blue-100';
      case 'avg comprehension':
        return 'bg-yellow-100';
      case 'behavior success':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getChangeColor = () => {
    return changeColor === 'green' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`${getBackgroundColor()} p-6 rounded-lg shadow-sm`}>
      <div className="text-sm text-gray-600 font-medium mb-2">
        {title.toUpperCase()}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600 mb-2">
        {subtitle}
      </div>
      <div className={`text-sm font-medium ${getChangeColor()}`}>
        {change}
      </div>
    </div>
  );
};

export default MetricCard;