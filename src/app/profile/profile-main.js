"use client";
import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import bcrypt from 'bcryptjs';

const ProfileMain = () => {
  const [user, setUser] = useState(null);

  // Run this in Node.js to generate a hashed password
bcrypt.hash("password123", 10).then(console.log);


  useEffect(() => {
    const fetchedUserData = {
      name: 'Aigyr',
      email: 'aigyr@example.com',
      bio: 'Software Developer passionate about coding, learning, and technology.',
      profilePicture: '/girl-char.png',
      preferredCommunication: 'Symbols & Speech Output',
      textSize: 'Large',
      language: 'English',
      dailyRoutine: [
        { task: 'Morning Stretch', completed: true },
        { task: 'Breakfast', completed: true },
        { task: 'Speech Therapy', completed: false },
      ],
      learningProgress: {
        completedLessons: 8,
        totalLessons: 12,
      },
      wellBeing: {
        mood: 'Happy',
        energyLevel: 'High',
        suggestedActivities: ['Calm breathing exercise', 'Listen to favorite music'],
      },
      caregiver: {
        name: 'Sarah Doe',
        contact: 'sarah.doe@example.com',
      },
      recentActivities: [
        { activity: 'Completed 8/10 tasks for Monday.', date: 'March 17, 2025' },
        { activity: 'Watched a new lesson on React.', date: 'March 16, 2025' },
        { activity: 'Achieved daily goal for Tuesday.', date: 'March 15, 2025' },
      ],
    };
    setUser(fetchedUserData);
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 bg-[url('/bg.png')] min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
            <img src={user.profilePicture} alt="User Profile" className="w-28 h-28 rounded-full object-cover" />
          </div>
          <div>
            <h1 className="text-4xl font-semibold text-[#680A76]">{user.name}</h1>
            <p className="text-lg text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Communication Preferences</h2>
          <p className="mt-2 text-gray-600">Preferred Mode: {user.preferredCommunication}</p>
          <p className="mt-2 text-gray-600">Text Size: {user.textSize}</p>
          <p className="mt-2 text-gray-600">Language: {user.language}</p>
        </div>

        {/* Routine Section */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Daily Routine</h2>
          <ul className="mt-4 space-y-2">
            {user.dailyRoutine.map((task, index) => (
              <li key={index} className="text-gray-600">
                {task.completed ? '✅' : '⬜'} {task.task}
              </li>
            ))}
          </ul>
        </div>

        {/* Learning Progress */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Learning Progress</h2>
          <p className="mt-2 text-gray-600">
            {user.learningProgress.completedLessons}/{user.learningProgress.totalLessons} lessons completed
          </p>
          <div className="h-4 bg-gray-200 rounded-full mt-2">
            <div
              className="h-full bg-orange-300 rounded-full"
              style={{ width: `${(user.learningProgress.completedLessons / user.learningProgress.totalLessons) * 100}%` }}
            />
          </div>
        </div>

        {/* Well-Being & AI Insights */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Well-Being</h2>
          <p className="mt-2 text-gray-600">Mood: {user.wellBeing.mood}</p>
          <p className="mt-2 text-gray-600">Energy Level: {user.wellBeing.energyLevel}</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-700">Suggested Activities</h3>
          <ul className="mt-2 space-y-2">
            {user.wellBeing.suggestedActivities.map((activity, index) => (
              <li key={index} className="text-gray-600">• {activity}</li>
            ))}
          </ul>
        </div>

        {/* Caregiver Information */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Caregiver</h2>
          <p className="mt-2 text-gray-600">Name: {user.caregiver.name}</p>
          <p className="mt-2 text-gray-600">Contact: {user.caregiver.contact}</p>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <h2 className="text-xl font-medium text-gray-800">Recent Activities</h2>
          <ul className="mt-4 space-y-4">
            {user.recentActivities.map((activity, index) => (
              <li key={index} className="flex justify-between items-center">
                <span className="text-gray-600">{activity.activity}</span>
                <span className="text-sm text-gray-500">{activity.date}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Edit Profile Button */}
        <div className="mt-8 flex justify-center">
          <button className="bg-[#680A76] text-white py-2 px-6 rounded-lg hover:bg-[#560860] transition-all">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileMain;
