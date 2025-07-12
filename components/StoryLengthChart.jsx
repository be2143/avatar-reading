// components/StoryLengthChart.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const StoryLengthChart = () => {
  const data = [
    { name: 'Short (3-5 scenes)', value: 35, color: '#f8b4cb' },
    { name: 'Medium (6-8 scenes)', value: 50, color: '#a7e0a7' },
    { name: 'Short (9-12 scenes)', value: 15, color: '#ffd93d' }
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Story Length Distribution
        </h3>
        <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold">H</span>
        </div>
      </div>
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">H</span>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center text-sm">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-gray-600">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryLengthChart;