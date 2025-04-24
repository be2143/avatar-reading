// Dashboard.js
"use client";
import React, { use, useState } from 'react';
import { Circle } from 'lucide-react';
import { Chewy } from "next/font/google";
import RoutineSummary from "./RoutineSummary";
import { Star } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { Clock } from "lucide-react";


const chewy = Chewy({ weight: "400", subsets: ["latin"] });

const profilePath = "/profile";

const Dashboard = () => {
  const [viewProfile, setViewProfile] = useState(false); // State to control profile view toggle

  const progressData = {
    weeklyRoutine: [
      { name: 'Monday', planned: 8, completed: 8, color: 'rgb(255, 149, 128)' },
      { name: 'Tuesday', planned: 7, completed: 6, color: 'rgb(198, 176, 255)' },
      { name: 'Wednesday', planned: 5, completed: 5, color: 'rgb(152, 255, 183)' },
      { name: 'Thursday', planned: 6, completed: 6, color: 'rgb(128, 206, 255)' },
      { name: 'Friday', planned: 8, completed: 6, color: 'rgb(255, 223, 128)' },
      { name: 'Saturday', planned: 7, completed: 6, color: 'rgb(255, 185, 185)' },
      { name: 'Sunday', planned: 8, completed: 8, color: 'rgb(182, 255, 182)' },
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
          <Link href="/profile">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer">
              <img src="girl-char.png" alt="user picture" className="w-28 h-28 rounded-full object-cover" />
            </div>
          </Link>

          {/* Greeting */}
          <p className={`text-6xl text-[#680A76] font-semibold ${chewy.className}`}>
            Hey, Aigyr!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg text-black font-semibold mb-4">Routine Achievement Board</h2>
              <div className="grid grid-cols-7 gap-4">
                {progressData.weeklyRoutine.map((skill) => {
                  const isAchieved = skill.completed >= skill.planned;

                  return (
                    <div key={skill.name} className="text-center text-black">
                      <div className="relative inline-block">
                        <Circle size={64} className="text-gray-200" />
                        <div
                          className="absolute top-0 left-0 w-16 h-16"
                          style={{
                            background: `conic-gradient(${skill.color} ${((skill.completed / skill.planned) * 100)}%, transparent 0)`,
                            borderRadius: '50%'
                          }}
                        />
                        {isAchieved && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400">
                            <Star size={24} className="fill-current" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="font-medium">{skill.name}</div>
                        <div className="text-sm text-gray-500">{skill.completed}/{skill.planned}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-white mt-6 p-6 rounded-lg shadow">
              <h2 className="text-lg text-black font-semibold mb-4">Your Learning Progress</h2>
              <div className="flex justify-between items-center">
                <h2 className="text-gray-500 text-sm">3/6 lessons completed</h2>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  15 mins per day
                </div>
              </div>
              {/* Progress Bar */}
              <div className="relative w-full h-4 bg-gray-200 rounded-md overflow-hidden my-4">
                <div className="absolute top-0 left-0 h-full bg-orange-300" style={{ width: "50%" }}></div>
              </div>
              <h2 className="text-lg text-black font-semibold mb-4">Continue watching:</h2>
              <div className="grid grid-cols-3 gap-6 mt-3">
                {recentLessons.map((card, index) => (
                  <div
                    key={index}
                    className={`${card.color} p-3 rounded-lg cursor-pointer transition-transform transform hover:scale-105 shadow-xl hover:border hover:border-grey-1200`}>
                    <img
                      src={card.image}
                      alt={`Lesson image ${index + 1}`}
                      className="object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <RoutineSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
