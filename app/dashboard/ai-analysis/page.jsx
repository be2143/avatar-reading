'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
// import ComprehensionChart from '@/components/ComprehensionChart';
import StoryLengthChart from '@/components/StoryLengthChart';
import StoryTopics from '@/components/StoryTopics';
// import FeatureUsage from '@/components/FeatureUsage';

export default function AIAnalysisPage() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-analysis/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const data = await response.json();
      console.log('Metrics Data: ', data.metrics);
      setMetrics(data.metrics || getDefaultMetrics());
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err.message);
      setMetrics(getDefaultMetrics());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultMetrics = () => [
    {
      title: 'Stories This Month',
      value: '0',
      subtitle: 'Stories Delivered',
      change: 'No data',
      changeColor: 'gray'
    },
    {
      title: 'Personalization Rate',
      value: '0%',
      subtitle: 'vs 0% library stories',
      change: 'No data',
      changeColor: 'gray'
    },
    {
      title: 'Avg. Reading Session Time',
      value: '0.0 min',
      subtitle: 'per story',
      change: 'No data',
      changeColor: 'gray'
    },
    {
      title: 'Behavior Success',
      value: '0%',
      subtitle: 'Target behavior observed',
      change: 'No data',
      changeColor: 'gray'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">System Insights</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {getDefaultMetrics().map((metric, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">System Insights</h1>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">Error loading metrics: {error}</p>
            <button 
              onClick={fetchMetrics}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">System Insights</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StoryLengthChart />
          <StoryTopics />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* <ComprehensionChart /> */}
          {/* <FeatureUsage /> */}
        </div>
      </div>
    </div>
  );
}
