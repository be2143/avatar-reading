'use client';
import React, { useState, useEffect } from 'react';
import { Book, Calendar, Eye, User, Play, Plus } from 'lucide-react';

const StudentStories = ({ student }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student && student._id) {
      fetchStudentStories();
    }
  }, [student]);

  const fetchStudentStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch student with populated stories
      const response = await fetch(`/api/students/${student._id}/stories`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch student stories');
      }
      
      const data = await response.json();
      setStories(data.stories || []);
    } catch (err) {
      console.error('Error fetching student stories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getStoryIcon = (category) => {
    if (!category) return '📖';
    const cat = category.toLowerCase();
    if (cat.includes('social')) return '🛝';
    if (cat.includes('routine') || cat.includes('daily')) return '✋';
    if (cat.includes('help') || cat.includes('ask')) return '😡';
    if (cat.includes('emotion') || cat.includes('feeling')) return '😊';
    if (cat.includes('school') || cat.includes('learn')) return '🏫';
    return '📖';
  };

  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-100 text-gray-600';
    const cat = category.toLowerCase();
    if (cat.includes('social')) return 'bg-blue-100 text-blue-700';
    if (cat.includes('routine') || cat.includes('daily')) return 'bg-green-100 text-green-700';
    if (cat.includes('help') || cat.includes('ask')) return 'bg-orange-100 text-orange-700';
    if (cat.includes('emotion') || cat.includes('feeling')) return 'bg-pink-100 text-pink-700';
    if (cat.includes('school') || cat.includes('learn')) return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-600';
  };

  const handleReadStory = (story) => {
    // Navigate to story reading page
    window.location.href = `/dashboard/stories/${story._id}/read`;
  };

  const handleViewStory = (story) => {
    // Navigate to story details page
    window.location.href = `/dashboard/stories/${story._id}`;
  };

  const handleSeeProfile = () => {
    // Navigate to student profile
    window.location.href = `/dashboard/students/${student._id}`;
  };

  const handleCreateStory = () => {
    // Navigate to create story page for this student
    window.location.href = `/dashboard/stories/create?studentId=${student._id}`;
  };

  if (!student) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Student</h3>
        <p className="text-gray-500">Choose a student from above to view their personalized stories.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
          <Book className="w-5 h-5 text-purple-600" />
          {student.name}'s Personalized Stories
        </h3>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Error loading stories</div>
          <div className="text-gray-500 text-sm mb-4">{error}</div>
          <button 
            onClick={fetchStudentStories}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Stories Yet</h3>
        <p className="text-gray-500 mb-6">Create personalized stories for {student.name} to get started.</p>
        <div className="flex justify-center space-x-4">
          <button 
            onClick={handleCreateStory}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create First Story
          </button>
          <button 
            onClick={handleSeeProfile}
            className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Book className="w-5 h-5 text-purple-600" />
          {student.name}'s Personalized Stories
        </h3>
        <button 
          onClick={handleCreateStory}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          New Story
        </button>
      </div>
      
      <div className="space-y-4">
        {stories.map((story) => (
          <div
            key={story._id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gray-50 hover:bg-white"
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl flex-shrink-0">
                {getStoryIcon(story.category)}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-800 text-lg mb-1">{story.title}</h4>
                {story.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{story.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {story.category && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(story.category)}`}>
                      {story.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatTimeAgo(story.createdAt)}
                  </span>
                  {story.chapter && (
                    <>
                      <span>•</span>
                      <span>Chapter: {story.chapter}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 flex-shrink-0">
              <button 
                onClick={() => handleReadStory(story)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Read
              </button>
              <button 
                onClick={() => handleViewStory(story)}
                className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200">
        <button 
          onClick={handleSeeProfile}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          See Profile
        </button>
      </div>
    </div>
  );
};

export default StudentStories;