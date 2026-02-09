// components/ComprehensionChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

console.log('ComprehensionChart: Component file loaded');

const ComprehensionChart = () => {
  console.log('ComprehensionChart: inside the component');

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log('ComprehensionChart: inside the component');

  useEffect(() => {
    const loadChartData = async () => {
      console.log('ComprehensionChart: trying to load chart data');
      try {
        setLoading(true);
        console.log('ComprehensionChart: before generateAllStudentsChartData');

        const data = await generateAllStudentsChartData();
        console.log('ComprehensionChart: after generateAllStudentsChartData');

        setChartData(data);
      } catch (error) {
        console.error('ComprehensionChart: Error loading chart data:', error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();

    console.log('ComprehensionChart: Chart data:', chartData);
  }, []); 

  const generateAllStudentsChartData = async () => {
      try {
        const response = await fetch('/api/ai-analysis/comprehension-chart');
        if (!response.ok) {
          console.error('Failed to fetch comprehension chart data:', response.status);
          return [];
        }
        const data = await response.json();
        console.log('Fetched chartData:', data.chartData);
        return data.chartData || [];
      } catch (error) {
        console.error('Error fetching comprehension chart data:', error);
        return [];
      }
  };

  // Tooltip component unchanged
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}/5
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comprehension Score Trend</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comprehension Score Trend</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center h-64 border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Comprehension Score Chart</p>
              <p className="text-xs text-gray-500">Complete reading sessions to see trends</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Comprehension Score Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="session" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={[0, 5]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {(() => {
              const colors = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
              const storyTitles = Object.keys(chartData[0] || {}).filter(key => key !== 'session');
              const colorMap = storyTitles.reduce((acc, title, index) => {
                acc[title] = colors[index % colors.length];
                return acc;
              }, {});
              return Object.keys(colorMap).map((storyTitle) => (
                <Line 
                  key={storyTitle}
                  type="monotone" 
                  dataKey={storyTitle} 
                  stroke={colorMap[storyTitle]} 
                  strokeWidth={3}
                  dot={{ fill: colorMap[storyTitle], strokeWidth: 2, r: 4 }}
                  name={storyTitle}
                />
              ));
            })()}
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="line"
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => (
                <span style={{ color: '#666', fontSize: '12px' }}>{value}</span>
              )}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComprehensionChart;