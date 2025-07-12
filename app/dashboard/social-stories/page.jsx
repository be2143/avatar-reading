'use client';

import { useState, useEffect } from 'react';
import { Plus, User, Upload, Sparkles, Shield, BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SocialStoriesPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const handleReadStory = (storyId) => {
    router.push(`/dashboard/social-stories/${storyId}/read`);
  };

  const handleCreateStory = () => {
    router.push(`/dashboard/social-stories/create`);
  };

  const handleUploadStory = () => {
    router.push(`/dashboard/social-stories/upload`);
  };

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

  const filteredStories = stories.filter(story => {
    const matchesTab = activeTab === 'general' ? !story.isPersonalized : story.isPersonalized;
    const matchesCategory = !selectedCategory || story.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesCategory && matchesSearch;
  });

  const getSourceInfo = (story) => {
    switch (story.source) {
      case 'generated':
        return {
          icon: <Sparkles size={14} />,
          label: 'AI Generated',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-700',
          borderColor: 'border-emerald-200'
        };
      case 'uploaded':
        return {
          icon: <Upload size={14} />,
          label: story.authorName ? `By ${story.authorName}` : 'Uploaded',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'system':
      default:
        return {
          icon: <Shield size={14} />,
          label: 'System Library',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200'
        };
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'social': 'bg-pink-50 text-pink-700 border-pink-200',
      'school': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'community': 'bg-green-50 text-green-700 border-green-200',
      'emotions': 'bg-amber-50 text-amber-700 border-amber-200'
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">
                Social Stories Library
              </h1>
              <p className="text-gray-600 mt-2">Discover and create engaging social stories for learning</p>
            </div>
            <div className="flex gap-3">
              <button 
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                onClick={handleUploadStory}
              >
                <Upload size={20} />
                Upload Story
              </button>
              <button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5" 
                onClick={handleCreateStory}
              >
                <Sparkles size={20} />
                Generate New Story
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-8 py-4 font-semibold text-sm transition-all duration-200 relative ${
                activeTab === 'general'
                  ? 'text-purple-600 bg-purple-50 rounded-t-lg border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <BookOpen size={18} className="inline mr-2" />
              General Stories
            </button>
            <button
              onClick={() => setActiveTab('personalized')}
              className={`px-8 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-3 relative ${
                activeTab === 'personalized'
                  ? 'text-purple-600 bg-purple-50 rounded-t-lg border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
              }`}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              Personalized Stories
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/60 backdrop-blur-sm px-6 py-6 border-b border-gray-100 sticky top-[185px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-80">
              <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm min-w-48"
              >
                <option value="">All Categories</option>
                <option value="social">Social Skills</option>
                <option value="school">School Routines</option>
                <option value="community">Community</option>
                <option value="emotions">Emotions</option>
              </select>
            </div>

            {/* Student Filter */}
            {activeTab === 'personalized' && (
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80 backdrop-blur-sm min-w-48"
              >
                <option value="">All Students</option>
                <option value="student1">Alex Johnson</option>
                <option value="student2">Emma Davis</option>
                <option value="student3">Marcus Wilson</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Story Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading stories...</p>
                </div>
              </div>
            ) : filteredStories.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen size={40} className="text-purple-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No stories found</h3>
                <p className="text-gray-600 text-lg mb-8">Try adjusting your filters or create a new story to get started.</p>
                <button 
                  onClick={handleCreateStory}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Sparkles size={20} />
                  Create Your First Story
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-gray-600">
                  Showing {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredStories.map(story => {
                    const sourceInfo = getSourceInfo(story);
                    return (
                      <div key={`story-${story._id ?? story.id}`} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative z-10">
                        <div className="h-48 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 flex items-center justify-center relative overflow-hidden">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <BookOpen size={32} className="text-purple-500" />
                          </div>
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${sourceInfo.bgColor} ${sourceInfo.textColor} ${sourceInfo.borderColor} flex items-center gap-1 backdrop-blur-sm`}>
                            {sourceInfo.icon}
                            {sourceInfo.label}
                          </div>
                          {story.category && (
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(story.category)} backdrop-blur-sm`}>
                              {story.category.charAt(0).toUpperCase() + story.category.slice(1)}
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight group-hover:text-purple-600 transition-colors duration-200">
                            {story.title}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                            {story.description || story.explanation || 'A helpful social story to guide learning and understanding.'}
                          </p>
                          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                            {story.ageGroup && (
                              <span className="bg-gray-100 px-2 py-1 rounded-full">
                                {story.ageGroup}
                              </span>
                            )}
                            {story.storyLength && (
                              <span className="bg-gray-100 px-2 py-1 rounded-full">
                                {story.storyLength}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReadStory(story._id || story.id)}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105"
                            >
                              Read Story
                            </button>
                            <button className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 py-3 px-4 text-sm font-semibold transition-all duration-200 rounded-xl border border-purple-200 hover:border-purple-300">
                              Personalize
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
