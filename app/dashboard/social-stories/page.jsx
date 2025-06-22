'use client';

import { useState, useEffect } from 'react';
import { Plus, User } from 'lucide-react';

export default function SocialStoriesPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch stories from the API when component mounts
  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch('/api/stories');
        const data = await res.json();
        setStories(data);
      } catch (err) {
        console.error("Failed to fetch stories", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  // Filter stories based on active tab and category
  const filteredStories = stories.filter(story => {
    const matchesTab = activeTab === 'general' ? !story.isPersonalized : story.isPersonalized;
    const matchesCategory = !selectedCategory || story.category === selectedCategory;
    return matchesTab && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-purple-800">Social Stories Library</h1>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} />
            Create New Story
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mt-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'general'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            General Stories
          </button>
          <button
            onClick={() => setActiveTab('personalized')}
            className={`px-6 py-3 font-medium text-sm transition-colors flex items-center gap-2 ${
              activeTab === 'personalized'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            Personalized Stories
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            <option value="social">Social Skills</option>
            <option value="school">School Routines</option>
            <option value="community">Community</option>
            <option value="emotions">Emotions</option>
          </select>

          {activeTab === 'personalized' && (
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Students</option>
              <option value="student1">Alex Johnson</option>
              <option value="student2">Emma Davis</option>
              <option value="student3">Marcus Wilson</option>
            </select>
          )}
        </div>
      </div>

      {/* Story Cards */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading stories...</div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new story.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map(story => (
              <div key={story.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Story Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <User size={32} className="text-purple-400" />
                  </div>
                </div>

                {/* Story Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{story.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{story.description || story.explanation}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                      Read
                    </button>
                    <button className="text-purple-600 hover:text-purple-700 py-2 px-4 text-sm font-medium transition-colors">
                      Personalize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
