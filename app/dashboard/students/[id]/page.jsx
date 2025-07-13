'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams
import { User, BarChart3, Users, BookOpen, Edit, Phone, Calendar, Book, Building, Gamepad2, Clock, HelpCircle } from 'lucide-react';
import Image from 'next/image'; // Assuming you might use Next.js Image component for student image

const StudentProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [studentData, setStudentData] = useState(null); // State to hold fetched student data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = useParams(); // Get URL parameters
  const studentId = params.id; // Access the student ID from the URL

  // Re-introduce hardcoded data for recentSessions and aiRecommendations
  // Move these inside the component or outside if they don't depend on props/state
  const recentSessions = [
    { name: 'Playground Rules', date: 'June 8, 2025', status: 'Excellent', color: 'bg-green-100 text-green-800' },
    { name: 'Morning Routine', date: 'May 31, 2025', status: 'Needs Review', color: 'bg-red-100 text-red-800' }
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


  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) {
        setError("No student ID provided.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch student data');
        }
        const data = await res.json();
        setStudentData(data.student);
        console.log("Fetched student data:", data.student); // Debugging
      } catch (err) {
        console.error("Error fetching student:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]); // Re-run effect if studentId changes

  // Display loading, error, or no student selected states
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading student profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No student profile found.</p>
      </div>
    );
  }

  // Helper function to format date (e.g., from '2025-01-15T...' to 'January 15, 2025')
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  // Calculate fields for display (example, adjust as needed)
  const today = new Date();
  const startedDate = studentData.startedDate ? new Date(studentData.startedDate) : null;
  const activeMonths = startedDate
    ? (today.getFullYear() - startedDate.getFullYear()) * 12 +
      (today.getMonth() - startedDate.getMonth())
    : 0;

  // Placeholder/calculated stats (replace with actual data if available in your DB)
  const storiesCreated = studentData.personalizedStories?.length || 0;
  const avgEngagement = 'N/A'; // Needs actual data/logic
  const goalProgress = 'N/A'; // Needs actual data/logic
  const grade = 'N/A'; // If not stored directly, derive from age or comprehensionLevel

  // Map personalized stories from studentData
  const personalizedStoriesDisplay = studentData.personalizedStories?.map(story => ({
    title: story.title,
    category: story.category || 'Uncategorized',
    // Calculate timeAgo more robustly, ensuring createdAt exists
    timeAgo: story.createdAt ? `${Math.floor((Date.now() - new Date(story.createdAt)) / (1000 * 60 * 60 * 24))} days ago` : 'N/A',
    sessions: 0, // Placeholder, needs actual session data
    status: 'Good', // Placeholder, needs actual status logic
    icon: '📚', // You might want more dynamic icons based on category
    statusColor: 'bg-yellow-500', // Placeholder
    _id: story._id // Store story ID for navigation
  })) || [];

  // Assuming you have goals and notes in your student schema or want to add them
  const goals = studentData.goals || 'No goals set.';
  const notes = studentData.notes || 'No notes available.';


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
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {/* Updated condition: Check if studentData.image exists AND is not an empty string */}
                    {studentData.image && typeof studentData.image === 'string' && studentData.image.trim() !== '' ? (
                        // Optional: Add a console.log here to see what the 'src' value is before the error
                        // console.log("Attempting to load image from src:", studentData.image),
                        <Image
                            src={studentData.image}
                            alt={`${studentData.name}'s profile image`}
                            width={64}
                            height={64}
                            objectFit="cover"
                            // Add unoptimized prop if using base64 or external URLs NOT configured in next.config.js domains
                            unoptimized={studentData.image.startsWith('data:') || (!studentData.image.startsWith('http://') && !studentData.image.startsWith('https://'))}
                        />
                    ) : (
                        <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{studentData.name}</h1>
                <p className="text-gray-600">Age {studentData.age} years old | Grade: {grade}</p>
                <p className="text-gray-600">Diagnosis: {studentData.diagnosis || 'N/A'}</p>
                <p className="text-gray-600">Started: {formatDate(studentData.startedDate)} | Active: {activeMonths} months</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex space-x-4">
              <div className="bg-green-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{storiesCreated}</div>
                <div className="text-sm text-gray-600">Stories Created</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{avgEngagement}</div>
                <div className="text-sm text-gray-600">Avg. Engagement</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{goalProgress}</div>
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
                      <p className="text-gray-900">{formatDate(studentData.birthday)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Parent/Guardian
                      </label>
                      <p className="text-gray-900">{studentData.guardian || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Contact
                      </label>
                      <p className="text-gray-900">{studentData.contact || 'N/A'}</p>
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
                      <p className="text-gray-700">{goals}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Progress
                      </label>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        {/* Note: studentData.goalProgress is hardcoded "78%", should be numeric if used for width */}
                        <div className="bg-green-600 h-2 rounded-full" style={{width: goalProgress === 'N/A' ? '0%' : goalProgress}}></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{goalProgress} Complete</p>
                    </div>
                  </div>
                )}

                {/* Notes Content */}
                {activeTab === 'Notes' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Notes
                    </label>
                    <p className="text-gray-700">{notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Personalized Stories */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{studentData.name}'s Personalized Stories</h2>
              </div>
              <div className="p-6 space-y-4">
                {personalizedStoriesDisplay.length > 0 ? (
                  personalizedStoriesDisplay.map((story, index) => (
                    <div key={story._id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
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
                        {/* You'll want to add actual navigation here */}
                        <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700">
                          Read
                        </button>
                        <button className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50">
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center">No personalized stories yet.</p>
                )}
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
                {/* Assuming recentSessions might also come from DB if tracking sessions */}
                {/* For now, using hardcoded data */}
                {recentSessions.map((session, index) => ( // THIS LINE WAS CAUSING THE ERROR
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
                {/* Assuming AI recommendations are either static or pulled from a separate API */}
                {/* For now, using hardcoded data */}
                {aiRecommendations.map((rec, index) => ( // THIS LINE WOULD HAVE CAUSED A SIMILAR ERROR
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