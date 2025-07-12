'use client';

import React, { useState } from 'react';
import { User, BarChart3, Users, BookOpen, Edit, Phone, Calendar, Book, Building, Gamepad2, Clock, HelpCircle } from 'lucide-react';

const StudentProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('Profile');

  const studentData = {
    name: 'Alex Chen',
    age: '8',
    diagnosis: 'Autism Spectrum Disorder',
    birthday: '2017-03-12',
    guardian: 'Lisa Chen',
    contact: '(971) 123-4567',
    comprehensionLevel: '1-3rd Grade',
    preferredStoryLength: '6-8 scenes',
    preferredSentenceLength: 'Short and simple',
    learningPreferences: 'Visual learner, prefers structured routines, responds well to positive reinforcement',
    interests: 'Trains, building blocks, animals, reading books',
    challenges: 'Social interactions, transitions, unexpected changes in routine',
    goals: 'Improve social interaction skills, handle routine changes better, enhance communication',
    notes: 'Responds well to visual cues and structured activities. Shows great progress with consistent routines.',
    image: '', // base64 string or empty
    // Calculated/display fields
    grade: '2nd Grade',
    startDate: 'January 15, 2025',
    activeMonths: 6,
    storiesCreated: 3,
    avgEngagement: '86%',
    goalProgress: '78%'
  };

  const recentSessions = [
    { name: 'Playground Rules', date: 'June 8, 2025', status: 'Excellent', color: 'bg-green-100 text-green-800' },
    { name: 'Morning Routine', date: 'May 31, 2025', status: 'Needs Review', color: 'bg-red-100 text-red-800' }
  ];

  const personalizedStories = [
    {
      title: 'Playground Rules',
      category: 'Social Interactions',
      timeAgo: '3 days ago',
      sessions: 1,
      status: 'Excellent',
      icon: '📚',
      statusColor: 'bg-blue-500'
    },
    {
      title: 'Morning Routine',
      category: 'Daily Routines',
      timeAgo: '1 week ago',
      sessions: 8,
      status: 'Needs Review',
      icon: '🌅',
      statusColor: 'bg-orange-400'
    },
    {
      title: 'Asking for Help',
      category: 'Social Interactions',
      timeAgo: '2 weeks ago',
      sessions: 6,
      status: 'Good',
      icon: '🤝',
      statusColor: 'bg-yellow-500'
    }
  ];

  const aiRecommendations = [
    {
      type: 'Personalization Suggestion',
      title: 'For Alex Chen: Add visual cues to "Morning Routine" story based on his preference for visual learning',
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      type: 'New Story Suggestion',
      title: 'Consider creating "Handling Unexpected Changes" for Alex Chen based on recent session notes',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      type: 'Success Pattern',
      title: 'Stories with peer interaction themes show 23% higher engagement for Alex Chen',
      color: 'bg-green-50 border-green-200'
    }
  ];

  const sidebarItems = [
    { icon: User, label: 'Overview', active: false },
    { icon: BookOpen, label: 'Social Stories', active: true },
    { icon: BarChart3, label: 'AI Analysis', active: false },
    { icon: Users, label: 'Students', active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="p-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              </div>
              
              {/* Student Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{studentData.name}</h1>
                <p className="text-gray-600">Age {studentData.age} years old | Grade: {studentData.grade}</p>
                <p className="text-gray-600">Diagnosis: {studentData.diagnosis}</p>
                <p className="text-gray-600">Started: {studentData.startDate} | Active: {studentData.activeMonths} months</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex space-x-4">
              <div className="bg-green-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{studentData.storiesCreated}</div>
                <div className="text-sm text-gray-600">Stories Created</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{studentData.avgEngagement}</div>
                <div className="text-sm text-gray-600">Avg. Engagement</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{studentData.goalProgress}</div>
                <div className="text-sm text-gray-600">Goal Progress</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Student Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Edit
                </button>
              </div>
              
              <div className="p-6">
                {/* Tabs */}
                <div className="flex space-x-6 mb-6">
                  {['Profile', 'Goals', 'Notes'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 border-b-2 font-medium text-sm ${
                        activeTab === tab 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Profile Content */}
                {activeTab === 'Profile' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-900">{studentData.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Date of Birth
                      </label>
                      <p className="text-gray-900">{studentData.birthday}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Parent/Guardian
                      </label>
                      <p className="text-gray-900">{studentData.guardian}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Contact
                      </label>
                      <p className="text-gray-900">{studentData.contact}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Comprehension Level
                      </label>
                      <p className="text-gray-900">{studentData.comprehensionLevel}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Preferred Story Length
                      </label>
                      <p className="text-gray-900">{studentData.preferredStoryLength}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Preferred Sentence Length
                      </label>
                      <p className="text-gray-700 text-sm">{studentData.preferredSentenceLength}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Learning Preferences
                      </label>
                      <p className="text-gray-700 text-sm">{studentData.learningPreferences}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Interests
                      </label>
                      <p className="text-gray-700 text-sm">{studentData.interests}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Challenges
                      </label>
                      <p className="text-gray-700 text-sm">{studentData.challenges}</p>
                    </div>
                  </div>
                )}

                {/* Goals Content */}
                {activeTab === 'Goals' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Current Goals
                      </label>
                      <p className="text-gray-700">{studentData.goals}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Progress
                      </label>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: studentData.goalProgress}}></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{studentData.goalProgress} Complete</p>
                    </div>
                  </div>
                )}

                {/* Notes Content */}
                {activeTab === 'Notes' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Notes
                    </label>
                    <p className="text-gray-700">{studentData.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personalized Stories */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Alex's Personalized Stories</h2>
              </div>
              <div className="p-6 space-y-4">
                {personalizedStories.map((story, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{story.icon}</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{story.title}</h3>
                        <p className="text-sm text-gray-600">{story.category} • {story.timeAgo} • {story.sessions} sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        story.status === 'Excellent' ? 'bg-blue-100 text-blue-800' :
                        story.status === 'Needs Review' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {story.status}
                      </span>
                      <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700">
                        Read
                      </button>
                      <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Recent Sessions */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
              </div>
              <div className="p-6 space-y-4">
                {recentSessions.map((session, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{session.name}</h3>
                      <p className="text-sm text-gray-600">{session.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${session.color}`}>
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress Report */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Progress Report</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center h-32 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Progress Over Time Chart</p>
                    <p className="text-xs text-gray-500">Engagement, Comprehension & Behavioral Improvements</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">AI Recommendations</h2>
              </div>
              <div className="p-6 space-y-4">
                {aiRecommendations.map((rec, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${rec.color}`}>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">{rec.type}</h4>
                    <p className="text-sm text-gray-700">{rec.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileDashboard;