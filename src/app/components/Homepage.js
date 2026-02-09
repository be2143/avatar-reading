"use client";
import React from 'react';
import { Circle } from 'lucide-react';
import { Chewy } from "next/font/google";
import { useState, useEffect } from "react";
import RoutineSummary from "./RoutineSummary";

const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const Dashboard = () => {
  const progressData = {
    total: 36,
    completed: 12,
    skills: [
      { name: 'Monday', planned: 80, completed: 75, color: 'rgb(255, 149, 128)' },
      { name: 'Tuesday', planned: 70, completed: 60, color: 'rgb(198, 176, 255)' },
      { name: 'Wednesday', planned: 50, completed: 40, color: 'rgb(152, 255, 183)' },
      { name: 'Thursday', planned: 70, completed: 65, color: 'rgb(128, 206, 255)' },
      { name: 'Friday', planned: 70, completed: 65, color: 'rgb(128, 206, 255)' },
      { name: 'Saturday', planned: 70, completed: 65, color: 'rgb(128, 206, 255)' },
      { name: 'Sunday', planned: 70, completed: 65, color: 'rgb(128, 206, 255)' }
    ]
  };

  const recentLessons = [
    { image: '/mp1.png', color: 'bg-orange-200' },
    { image: '/mp2.png' },
    { image: '/mp3.png', color: 'bg-yellow-100' }
  ];

  return (
    <div className="p-6 bg-[url('/bg.png')] min-h-screen">
      <div className="max-w-5xl mx-auto">

        <header className="mb-8 flex items-center space-x-6">
          {/* Profile Picture */}
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105">
            <img src="girl-char.png" alt="user picture" className="w-28 h-28 rounded-full object-cover" />
          </div>

          {/* Greeting */}
          <p className={`text-6xl text-[#680A76] font-semibold ${chewy.className}`}>
            Hey, Aigyr!
            {/* REPLACE WITH ACTUAL USERNAME */}
          </p>
        </header>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Progress Section */}
          <div className="md:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg text-black font-semibold mb-4">Achievement Board</h2>
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-2">
                  {progressData.completed}/{progressData.total} lesson completed
                </div>
                <div className="h-4 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-orange-300 rounded-full"
                    style={{ width: `${(progressData.completed / progressData.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4">
                {progressData.skills.map((skill) => (
                  <div key={skill.name} className="text-center text-black">
                    <div className="relative inline-block">
                      <Circle
                        size={64}
                        className="text-gray-200"
                      />
                      <div
                        className="absolute top-0 left-0 w-16 h-16"
                        style={{
                          background: `conic-gradient(${skill.color} ${((skill.completed / skill.planned) * 100)}%, transparent 0)`,
                          borderRadius: '50%'
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-sm text-gray-500">{skill.completed}/{skill.planned}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-lg text-black font-semibold">Recent lessons watched:</p>
              <div className="grid grid-cols-3 gap-6 mt-3">
                {recentLessons.map((card, index) => (
                  <div
                    key={index}
                    className={`${card.color} p-6 rounded-lg cursor-pointer transition-transform transform hover:scale-105 shadow-xl`}
                  >
                    <img
                      src={card.image}
                      alt={`Lesson image ${index + 1}`} // Improved alt text
                      className="w-full h-30 object-cover rounded-lg mb-4"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RoutineSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
