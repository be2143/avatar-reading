// app/dashboard/ai-analysis/page.jsx
'use client';

import React from 'react';
import MetricCard from '@/components/MetricCard';
import ComprehensionChart from '@/components/ComprehensionChart';
import StoryLengthChart from '@/components/StoryLengthChart';
import StoryTopics from '@/components/StoryTopics';
import FeatureUsage from '@/components/FeatureUsage';

export default function AIAnalysisPage() {
  const metrics = [
    {
      title: 'Stories This Month',
      value: '7',
      subtitle: 'Stories Delivered',
      change: '+23% vs last month',
      changeColor: 'green'
    },
    {
      title: 'Personalization Rate',
      value: '73%',
      subtitle: 'vs 27% library stories',
      change: '+8% this month',
      changeColor: 'green'
    },
    {
      title: 'Avg Comprehension',
      value: '85%',
      subtitle: 'Comprehension Score',
      change: '+18% improvement',
      changeColor: 'green'
    },
    {
      title: 'Behavior Success',
      value: '78%',
      subtitle: 'Target behavior observed',
      change: '80% show improvement',
      changeColor: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">System Insights</h1>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ComprehensionChart />
          <StoryLengthChart />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StoryTopics />
          <FeatureUsage />
        </div>
      </div>
    </div>
  );
}
