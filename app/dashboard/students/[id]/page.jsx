'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import EditStudentModal from '@/components/EditStudentModal';
import BehavioralSurveyPopup from '@/components/BehavioralSurvey';
import BehavioralScoreChart from '@/components/BehavioralScoreChart';
import Link from 'next/link';
import AIRecommendations from '@/components/AIRecommendations';

const StudentProfileDashboard = () => {
  const [activeTab, setActiveTab] = useState('Profile');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State to control modal visibility
  const [saveError, setSaveError] = useState(null); // State to handle save errors
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [showBehavioralSurveyPopup, setShowBehavioralSurveyPopup] = useState(false);

  const params = useParams();
  const studentId = params.id;

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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString; // Return original string if invalid date
    }
  };

  // Function to calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return 'N/A';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const today = new Date();
  const startedDate = studentData.startedDate ? new Date(studentData.startedDate) : null;
  const activeMonths = startedDate
    ? (today.getFullYear() - startedDate.getFullYear()) * 12 +
    (today.getMonth() - startedDate.getMonth())
    : 0;

  const storiesCreated = studentData.personalizedStories?.length || 0;

  const totalSessions = studentData.personalizedStories?.reduce((sum, story) => sum + (story.sessions?.length || 0), 0) || 0;
  const totalTimeSpent = studentData.personalizedStories?.reduce((sum, story) =>
    sum + (story.sessions?.reduce((s, session) => s + (session.timeSpent || 0), 0) || 0)
    , 0) || 0;

  let avgEngagement = 'N/A';
  if (totalSessions > 0) {
    avgEngagement = `${(totalTimeSpent / totalSessions).toFixed(1)}s/session`;
  }



  let avgComprehensionScore = 'N/A';
  if (studentData.personalizedStories && studentData.personalizedStories.length > 0) {
    const allComprehensionScores = [];
    studentData.personalizedStories.forEach(story => {
      if (story.sessions && story.sessions.length > 0) {
        story.sessions.forEach(session => {
          console.log("Raw session.comprehensionScore: ", session.comprehensionScore, typeof session.comprehensionScore);
          const score = Number(session.comprehensionScore);
          if (!isNaN(score)) {
            allComprehensionScores.push(score);
            console.log("Pushed score:", score);
          } else {
            console.log("Skipped invalid score:", session.comprehensionScore);
          }
        });
      }
    });
    console.log('allComprehensionScores: ', allComprehensionScores);
    if (allComprehensionScores.length > 0) {
      const averageScore = allComprehensionScores.reduce((sum, score) => sum + score, 0) / allComprehensionScores.length;
      avgComprehensionScore = `${Math.round(averageScore)}/5`;
    }
  }

  // --- Formatting functions for better display ---
  const formatComprehensionLevel = (level) => {
    if (!level) return 'N/A';
    const levelMap = {
      'prek_k': 'Pre-K / Kindergarten',
      'early_elementary': 'Early Elementary (Grades 1-2)',
      'mid_elementary': 'Mid Elementary (Grades 3-5)',
      'middle_school': 'Middle School (Grades 6-8)',
      'high_school': 'High School (Grades 9-12)',
      'post_secondary': 'Post-Secondary / Adult'
    };
    return levelMap[level] || level;
  };

  const formatStoryLength = (length) => {
    if (!length) return 'N/A';
    const lengthMap = {
      'very_short': 'Very Short (1-3 sentences)',
      'short': 'Short (1-2 paragraphs)',
      'medium': 'Medium (3-5 paragraphs)',
      'long': 'Long (More than 5 paragraphs)'
    };
    return lengthMap[length] || length;
  };

  const formatSentenceLength = (length) => {
    if (!length) return 'N/A';
    const lengthMap = {
      'very_short': 'Very Short (1-5 words)',
      'short': 'Short (6-10 words)',
      'medium': 'Medium (11-15 words)',
      'long': 'Long (More than 15 words)'
    };
    return lengthMap[length] || length;
  };

  // --- Prepare Personalized Stories data ---
  const personalizedStoriesDisplay = studentData.personalizedStories?.map(story => {
    let status = 'Good';
    let statusColor = 'bg-yellow-100 text-yellow-800';

    if (story.sessions && story.sessions.length > 0) {
      const sortedSessions = [...story.sessions].sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate));
      const lastSession = sortedSessions[0];

      if (lastSession.timeSpent > 300) {
        status = 'Excellent';
        statusColor = 'bg-blue-100 text-blue-800';
      } else if (lastSession.timeSpent < 60) {
        status = 'Needs Review';
        statusColor = 'bg-red-100 text-red-800';
      }
    }


    return {
      title: story.title,
      category: story.category || 'Uncategorized',
      timeAgo: story.createdAt ? `${Math.floor((Date.now() - new Date(story.createdAt)) / (1000 * 60 * 60 * 24))} days ago` : 'N/A',
      sessions: story.sessions?.length || 0, // Get actual session count
      status: status,
      icon: story.emoji || '📚',
      statusColor: statusColor,
      _id: story._id
    };
  }) || [];

  // --- Prepare Recent Sessions data ---
  // Get the latest session for each story, but keep all sessions for notes
  const recentSessions = [];
  studentData.personalizedStories?.forEach(story => {
    if (story.sessions && story.sessions.length > 0) {
      // Find the most recent session for this story
      const latestSession = story.sessions.reduce((latest, session) => {
        const sessionDate = new Date(session.sessionDate);
        const latestDate = new Date(latest.sessionDate);
        return sessionDate > latestDate ? session : latest;
      });

      // Get all sessions for this story, sorted by date (newest first)
      const allStorySessions = story.sessions
        .sort((a, b) => new Date(b.sessionDate) - new Date(a.sessionDate))
        .map(session => ({
          sessionNum: session.sessionNum,
          date: session.sessionDate,
          notes: session.sessionNotes,
          timeSpent: session.timeSpent,
          comprehensionScore: session.comprehensionScore
        }));

      recentSessions.push({
        storyId: story._id,
        storyTitle: story.title,
        storyEmoji: story.emoji || '📖',
        date: latestSession.sessionDate,
        timeSpent: latestSession.timeSpent,
        sessionNum: latestSession.sessionNum,
        comprehensionScore: latestSession.comprehensionScore,
        status: (latestSession.timeSpent && latestSession.timeSpent > 120) ? 'Good Engagement' : (latestSession.timeSpent && latestSession.timeSpent < 30) ? 'Brief Engagement' : 'Normal',
        color: (latestSession.timeSpent && latestSession.timeSpent > 120) ? 'bg-green-100 text-green-800' : (latestSession.timeSpent && latestSession.timeSpent < 30) ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800',
        allSessions: allStorySessions
      });
    }
  });

  // Sort by most recent session date
  recentSessions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- Display Goals and Notes ---
  const goalsContent = studentData.goals || 'No specific goals have been set for this student.';
  const notesContent = studentData.notes || 'No general notes available for this student.';

  // --- Handlers for the Edit Modal ---
  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
    setSaveError(null); // Clear any previous save errors
  };

  // --- Handler for session expansion ---
  const handleSessionClick = (sessionIndex, event) => {
    event.preventDefault();
    event.stopPropagation();

    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionIndex)) {
        newSet.delete(sessionIndex);
      } else {
        newSet.add(sessionIndex);
      }
      return newSet;
    });
  };
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };
  const handleSaveStudent = async (updatedData) => {
    setSaveError(null); // Clear previous errors
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'PUT', // Or PATCH, depending on your API design
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update student data');
      }
      const result = await res.json();
      setStudentData(result.student); // Update the local state with the saved data
      alert('Student profile updated successfully!');
      return true; // Indicate success
    } catch (err) {
      console.error('Error saving student:', err);
      setSaveError(err.message);
      alert(`Error saving student: ${err.message}`);
      throw err; // Re-throw to allow modal to handle saving state
    }
  }

  // Function to save behavioral score
  const saveBehavioralScore = async (score) => {
    try {
      const res = await fetch(`/api/students/${studentId}/behavioral-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newScore: Number(score) }),
      });

      if (!res.ok) throw new Error('Failed to save score');

      // Update the local student state with new score
      setStudentData(prev => ({
        ...prev,
        currentBehavioralScore: Number(score),
      }));

      setShowBehavioralSurveyPopup(false);
      alert('Behavioral score updated successfully!');
      
      // Refresh the page to show updated data
      window.location.reload();
    } catch (err) {
      alert(`Error saving behavioral score: ${err.message}`);
    }
  };

  // Helper function to format time
  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    return parts.join('');
  };


  return (
    <div className="min-h-screen">
      <div className="p-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden border-2 border-purple-500 bg-purple-50">
                  {studentData.image && typeof studentData.image === 'string' && studentData.image.trim() !== '' ? (
                    <img
                      src={studentData.image}
                      alt={studentData.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-600" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{studentData.name}</h1>
                <p className="text-gray-600">Age {calculateAge(studentData.birthday)} years old</p>
                <p className="text-gray-600">Diagnosis: {studentData.diagnosis || 'N/A'}</p>
                <p className="text-gray-600">Started: {formatDate(studentData.startedDate)} | Active: {activeMonths} months</p>
              </div>
            </div>
            <div className="flex space-x-4">
            <div className="bg-green-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{storiesCreated}</div>
                <div className="text-sm text-gray-600">Stories Created</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{avgEngagement}</div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
              <div className="bg-yellow-100 rounded-lg p-4 text-center min-w-20">
                <div className="text-2xl font-bold text-gray-900">{avgComprehensionScore}</div>
                <div className="text-sm text-gray-600">Avg. Comprehension</div>
              </div>
              {/* <button
                onClick={() => setShowBehavioralSurveyPopup(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Progress Report
              </button>
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
          <div className="flex space-x-4 mt-6">
            <div className="bg-green-100 rounded-lg p-4 text-center min-w-20">
              <div className="text-2xl font-bold text-gray-900">{storiesCreated}</div>
              <div className="text-sm text-gray-600">Stories Created</div>
            </div>
            <div className="bg-blue-100 rounded-lg p-4 text-center min-w-20">
              <div className="text-2xl font-bold text-gray-900">{avgEngagement}</div>
              <div className="text-sm text-gray-600">Engagement</div>
            </div>
            <div className="bg-yellow-100 rounded-lg p-4 text-center min-w-20">
              <div className="text-2xl font-bold text-gray-900">{avgComprehensionScore}</div>
              <div className="text-sm text-gray-600">Avg. Comprehension</div> */}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
                </div>
                <button
                  onClick={handleOpenEditModal} // Attach handler to open modal
                  className="text-purple-600 hover:text-purple-700  text-sm"
                >
                  Edit
                </button>
              </div>
              <div className="p-6">
                <div className="flex space-x-6 mb-6">
                  {['Profile', 'Goals', 'Other'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`pb-2 border-b-2 font-medium text-sm ${activeTab === tab
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                {activeTab === 'Profile' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Full Name
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Date of Birth
                      </label>
                      <p className="text-gray-700 font-medium">{formatDate(studentData.birthday)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Parent/Guardian
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.guardian || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Contact
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.contact || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Comprehension Level
                      </label>
                      <p className="text-gray-700 font-medium">{formatComprehensionLevel(studentData.comprehensionLevel)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Preferred Story Length
                      </label>
                      <p className="text-gray-700 font-medium">{formatStoryLength(studentData.preferredStoryLength)}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Preferred Sentence Length
                      </label>
                      <p className="text-gray-700 font-medium">{formatSentenceLength(studentData.preferredSentenceLength)}</p>
                    </div>
                  </div>
                )}
                {activeTab === 'Goals' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Current Goals
                      </label>
                      <p className="text-gray-700 font-medium whitespace-pre-line">{goalsContent}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-purple-800">Current Score</span>
                        <span className="text-lg font-bold text-purple-900">
                          {studentData.currentBehavioralScore !== undefined ? `${studentData.currentBehavioralScore}/100` : 'Not set'}
                        </span>
                      </div>
                      {studentData.currentBehavioralScore !== undefined && (
                        <div className="w-full bg-purple-200 rounded-full h-3 mb-3">
                          <div
                            className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${studentData.currentBehavioralScore}%` }}
                          ></div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Reading Progress
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg text-center">
                            <div className="text-lg font-bold text-blue-900">{totalSessions}</div>
                            <div className="text-xs text-blue-700">Total Sessions</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg text-center">
                            <div className="text-lg font-bold text-green-900">{formatTime(totalTimeSpent)}</div>
                            <div className="text-xs text-green-700">Total Time</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 'Other' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Learning Preferences
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.learningPreferences || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Interests
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.interests || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Challenges
                      </label>
                      <p className="text-gray-700 font-medium">{studentData.challenges || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Notes
                      </label>
                      <p className="text-gray-700 font-medium whitespace-pre-line">{notesContent}</p>
                    </div>
                  </div>
                )}                  
              </div>
            </div>

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
                          {/* Display actual sessions count */}
                          <p className="text-sm text-gray-600">{story.category} • {story.timeAgo} • {story.sessions} sessions</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/social-stories/${story._id}/read`}>
                          <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700">
                            Read
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center">No personalized stories yet.</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-white p-4 rounded shadow space-y-4">
              <h2 className="font-semibold text-lg mb-1">Recent Sessions</h2>
              <div className="border-b border-gray-100 mb-2" />
              <div className="space-y-2">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session, index) => (
                    <div key={index} className="space-y-2">
                      <div
                        className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-purple-50 transition-colors duration-150 group shadow-sm cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/social-stories/${session.storyId}/read`}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white shadow text-3xl group-hover:scale-110 transition-transform duration-200">
                          {session.storyEmoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm break-words whitespace-normal">
                            {session.storyTitle}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            Session {session.sessionNum} • {formatDate(session.date)} • {session.timeSpent}s
                            {session.comprehensionScore && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {session.comprehensionScore}/5
                              </span>
                            )}
                          </div>
                        </div>
                        {session.allSessions && session.allSessions.length > 0 && (
                          <button
                            onClick={(e) => handleSessionClick(index, e)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-purple-600 transition-colors rounded-full hover:bg-purple-100"
                            title="View all session notes"
                          >
                            {expandedSessions.has(index) ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        )}
                      </div>
                      {session.allSessions && session.allSessions.length > 0 && expandedSessions.has(index) && (
                        <div className="ml-16 p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
                          <div className="text-xs text-gray-600 font-medium mb-2">All Session Notes:</div>
                          {session.allSessions.map((sessionData, sessionIndex) => (
                            <div key={sessionIndex} className="border-l-2 border-purple-200 pl-3">
                              <div className="text-xs text-gray-500 mb-1">
                                Session {sessionData.sessionNum} • {formatDate(sessionData.date)} • {sessionData.timeSpent}s
                                {sessionData.comprehensionScore && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Comprehension: {sessionData.comprehensionScore}/5
                                  </span>
                                )}
                              </div>
                              {sessionData.notes ? (
                                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {sessionData.notes}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400 italic">No notes for this session</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm py-6 text-center">No recent sessions found.</div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Progress Report</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <button
                    onClick={() => setShowBehavioralSurveyPopup(true)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Update Behavioral Score
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Behavioral Progress
                  </label>
                  
                  {/* Behavioral Score History */}
                  {studentData.behavioralScoreHistory && studentData.behavioralScoreHistory.length > 0 && (
                    <BehavioralScoreChart behavioralScoreHistory={studentData.behavioralScoreHistory} />
                  )}
                  
                  {(!studentData.behavioralScoreHistory || studentData.behavioralScoreHistory.length === 0) && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                        <BarChart3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No behavioral scores recorded yet.</p>
                      <p className="text-xs text-gray-400 mt-1">Click the button above to add the first score and start tracking progress.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
                      <AIRecommendations studentId={studentId} />

          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {isEditModalOpen && studentData && (
        <EditStudentModal
          student={studentData}
          onClose={handleCloseEditModal}
          onSave={handleSaveStudent}
        />
      )}

      {/* Behavioral Survey Popup */}
      {showBehavioralSurveyPopup && studentData && (
        <BehavioralSurveyPopup
          student={studentData}
          onClose={() => setShowBehavioralSurveyPopup(false)}
          onSaveScore={saveBehavioralScore}
        />
      )}

      {saveError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-md shadow-lg z-50">
          {saveError}
        </div>
      )}
    </div>
  );
};

export default StudentProfileDashboard;    