'use client';

import { useState, useEffect, useRef } from 'react';

export default function BehavioralScoreChart({ behavioralScoreHistory }) {
  const [chartData, setChartData] = useState(null);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(400);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (behavioralScoreHistory && behavioralScoreHistory.length > 0) {
      // Sort by date (newest first), take latest 5, then sort back (oldest to newest) for chart display
      const latestScores = behavioralScoreHistory
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((entry, index) => ({
          session: `Session ${index + 1}`,
          score: entry.score,
          date: new Date(entry.date).toLocaleDateString(),
          fullDate: new Date(entry.date)
        }));
      setChartData(latestScores);
    }
  }, [behavioralScoreHistory]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">No behavioral scores recorded yet.</p>
        <p className="text-xs text-gray-400 mt-1">Start tracking progress to see trends.</p>
      </div>
    );
  }

  const maxScore = Math.max(...chartData.map(d => d.score), 10);
  const minScore = Math.min(...chartData.map(d => d.score), 0);
  const scoreRange = maxScore - minScore || 1;
  const chartHeight = 240;
  const chartWidth = containerWidth;
  const padding = 40;

  const getYPosition = (score) => {
    return padding + (chartHeight - 2 * padding) * (1 - (score - minScore) / scoreRange);
  };

  const getXPosition = (index) => {
    return padding + (index / (chartData.length - 1 || 1)) * (chartWidth - 2 * padding);
  };

  // Generate path for the line
  const generatePath = () => {
    if (chartData.length < 2) return '';
    let path = `M ${getXPosition(0)} ${getYPosition(chartData[0].score)}`;
    for (let i = 1; i < chartData.length; i++) {
      path += ` L ${getXPosition(i)} ${getYPosition(chartData[i].score)}`;
    }
    return path;
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Behavioral Score Trend</h3>
        {/* <div className="text-xs text-gray-500">
          {chartData.length} score{chartData.length !== 1 ? 's' : ''} recorded
        </div> */}
      </div>
      <div className="relative bg-white border border-gray-200 rounded-lg p-4">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="mx-auto block"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Y-axis labels */}
          {[0, 2, 4, 6, 8, 10].map((tick) => {
            const y = getYPosition(tick);
            return (
              <g key={tick}>
                <line
                  x1={padding - 5}
                  y1={y}
                  x2={padding}
                  y2={y}
                  stroke="#9ca3af"
                  strokeWidth="1"
                />
                <text
                  x={padding - 10}
                  y={y + 3}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {tick}
                </text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {chartData.map((data, index) => (
            <g key={index}>
              <line
                x1={getXPosition(index)}
                y1={chartHeight - padding + 5}
                x2={getXPosition(index)}
                y2={chartHeight - padding}
                stroke="#9ca3af"
                strokeWidth="1"
              />
              <text
                x={getXPosition(index)}
                y={chartHeight - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {data.date}
              </text>
            </g>
          ))}
          {/* Data line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Data points */}
          {chartData.map((data, index) => (
            <circle
              key={index}
              cx={getXPosition(index)}
              cy={getYPosition(data.score)}
              r="4"
              fill="#a78bfa"
              stroke="white"
              strokeWidth="2"
            />
          ))}
          {/* Score labels on points */}
          {chartData.map((data, index) => (
            <text
              key={`label-${index}`}
              x={getXPosition(index)}
              y={getYPosition(data.score) - 10}
              textAnchor="middle"
              className="text-xs font-medium fill-purple-700"
            >
              {data.score}
            </text>
          ))}
        </svg>
        {/* Legend */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-gray-600">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Behavioral Score (0-10)</span>
          </div>
        </div>
      </div>
    </div>
  );
} 