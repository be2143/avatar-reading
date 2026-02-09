// components/StoryLengthChart.js
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const StoryLengthChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStoryLengthData();
  }, []);

  const fetchStoryLengthData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/ai-analysis/story-length-distribution');
      if (!response.ok) {
        throw new Error('Failed to fetch story length data');
      }
      
      const result = await response.json();
      setData(result.data || getDefaultData());
    } catch (err) {
      console.error('Error fetching story length data:', err);
      setError(err.message);
      setData(getDefaultData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultData = () => [
    { name: 'Short (1-2 scenes)', value: 0, color: '#f8b4cb' },
    { name: 'Medium (3-5 scenes)', value: 0, color: '#a7e0a7' },
    { name: 'Long (6+ scenes)', value: 0, color: '#ffd93d' }
  ];

  const COLORS = ['#f8b4cb', '#a7e0a7', '#ffd93d'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Story Length Distribution
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Story Length Distribution
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-2">Error loading data</div>
            <button 
              onClick={fetchStoryLengthData}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter out zero values for better visualization
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Story Length Distribution
          </h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-400 text-center">
            <div>No story data available</div>
            <div className="text-sm">Create some stories to see the distribution</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Story Length Distribution
        </h3>
      </div>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {filteredData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-gray-600">{item.name}</span>
            </div>
            <span className="text-gray-800 font-medium">{item.value} stories</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryLengthChart;