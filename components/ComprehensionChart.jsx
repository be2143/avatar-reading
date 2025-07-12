// components/ComprehensionChart.js
import React from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const ComprehensionChart = () => {
  const data = [
    { session: 'Session 1', short: 90, medium: 72, long: 62 },
    { session: 'Session 2', short: 88, medium: 81, long: 65 },
    { session: 'Session 3', short: 95, medium: 83, long: 68 },
    { session: 'Session 4', short: 97, medium: 95, long: 70 },
    { session: 'Session 5', short: 96, medium: 96, long: 72 },
    { session: 'Session 6', short: 98, medium: 95, long: 90 },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Comprehension Score Trend
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="session" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <Line 
              type="monotone" 
              dataKey="short" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="medium" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="long" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              iconType="line"
              wrapperStyle={{ paddingTop: '10px' }}
              formatter={(value) => {
                const labels = {
                  short: 'Short Stories (3-5 scenes)',
                  medium: 'Medium Stories (6-8 scenes)',
                  long: 'Long Stories (9-12 scenes)'
                };
                return <span style={{ color: '#666', fontSize: '12px' }}>{labels[value]}</span>;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComprehensionChart;