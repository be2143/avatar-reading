'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, User, Upload, Sparkles, Shield, BookOpen, Filter, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import StoriesTour from '@/components/StoriesTour';
import { useSession } from 'next-auth/react';

export default function SocialStoriesPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('');
  const [selectedStudentIdFilter, setSelectedStudentIdFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stories, setStories] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentNameMap, setStudentNameMap] = useState({});

  const router = useRouter();
  const { data: session, status } = useSession();

  const fetchStories = useCallback(async () => {
    if (status === 'loading') return;

    try {
      setLoading(true);
      setError(null);

      let apiUrl = '/api/stories';
      let params = new URLSearchParams();

      if (activeTab === 'general') {
        params.append('type', 'general');
        if (selectedSourceFilter) {
          params.append('source', selectedSourceFilter);
        }
      } else if (activeTab === 'personalized') {
        if (!session?.user?.id) {
          setError("Please log in to view personalized stories.");
          setLoading(false);
          return;
        }
        params.append('type', 'personalized');
        if (selectedStudentIdFilter) {
          params.append('studentId', selectedStudentIdFilter);
        }
      }

      const queryString = params.toString();
      if (queryString) {
        apiUrl = `${apiUrl}?${queryString}`;
      }

      const res = await fetch(apiUrl);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Failed to fetch stories');
      }

      const data = await res.json();
      setStories(data);

    } catch (err) {
      console.error("Error fetching stories:", err);
      setError(err.message);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedStudentIdFilter, selectedSourceFilter, session, status]);

  const fetchMyStudents = useCallback(async () => {
    if (status === 'loading') return;

    if (!session?.user?.id) {
      setStudentsLoading(false);
      return;
    }

    try {
      setStudentsLoading(true);
      const res = await fetch('/api/students/my-students');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch students for filter');
      }

      if (Array.isArray(data.students)) {
        setMyStudents(data.students);
      } else {
        console.error("API /api/students/my-students did not return an array for 'students':", data);
        setMyStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students for filter:', err);
      setMyStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    if (myStudents.length > 0) {
      const nameMap = {};
      myStudents.forEach(student => {
        nameMap[student._id] = student.name;
      });
      setStudentNameMap(nameMap);
    }
  }, [myStudents]);

  useEffect(() => {
    fetchStories();
    fetchMyStudents();
  }, [fetchStories, fetchMyStudents]);

  const handleReadStory = (storyId) => {
    router.push(`/dashboard/social-stories/${storyId}/read`);
  };

  const handleCreateStory = () => {
    router.push(`/dashboard/social-stories/create`);
  };

  const handleUploadStory = () => {
    router.push(`/dashboard/social-stories/upload`);
  };

  const handlePersonalizeStory = (storyId) => {
    router.push(`/dashboard/social-stories/${storyId}/personalize`);
  };

  const displayedStories = stories.filter(story => {
    const normalizedStoryCategory = story.category ? story.category.toLowerCase().trim() : '';
    const matchesCategory = !selectedCategory || normalizedStoryCategory === selectedCategory;

    const matchesSearch = !searchTerm ||
      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (story.description && story.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSource = !selectedSourceFilter || story.source === selectedSourceFilter;

    return matchesCategory && matchesSearch && matchesSource;
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
    const simplifiedCategoryMap = {
      'social skills': 'social',
      'school routines': 'routine',
      'community': 'community',
      'emotions': 'emotions',
      'healthy habits': 'routine',
      'family relationships': 'social',
      'digital world/technology': 'emotions',
      'understanding adults': 'social',
      'time management': 'routine',
      'social': 'social',
      'school': 'routine',
    };

    const normalizedCategory = category ? category.toLowerCase().trim() : '';
    const mappedCategory = simplifiedCategoryMap[normalizedCategory] || 'default';

    const colors = {
      'social': 'bg-pink-50 text-pink-700 border-pink-200',
      'routine': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'community': 'bg-green-50 text-green-700 border-green-200',
      'emotions': 'bg-amber-50 text-amber-700 border-amber-200',
      'default': 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return colors[mappedCategory];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      <StoriesTour />
      <div className="bg-white backdrop-blur-sm border-b border-purple-100 px-6 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">
                Social Stories Library
              </h1>
              <p className="text-gray-600 mt-2">Discover and create engaging social stories for learning</p>
            </div>
            <div className="flex gap-3" id="stories-actions">
              <button
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                id="stories-upload-btn"
                onClick={handleUploadStory}
              >
                <Upload size={20} />
                Upload Story
              </button>
              <button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                id="stories-generate-btn"
                onClick={handleCreateStory}
              >
                <Sparkles size={20} />
                Generate New Story
              </button>
            </div>
          </div>
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-8 py-4 font-semibold text-sm transition-all duration-200 relative ${activeTab === 'general'
                ? 'text-purple-600 bg-purple-50 rounded-t-lg border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                }`}
            >
              <BookOpen size={18} className="inline mr-2" />
              General Stories
            </button>
            <button
              onClick={() => setActiveTab('personalized')}
              className={`px-8 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-3 relative ${activeTab === 'personalized'
                ? 'text-purple-600 bg-purple-50 rounded-t-lg border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'
                }`}
            >
              <User size={18} className="inline mr-2" />
              Personalized Stories
            </button>
          </div>
        </div>
      </div>
      <div className="bg-white backdrop-blur-sm px-6 py-6 border-b border-gray-100 sticky top-[185px] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-4 items-center">
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
            <div className="relative w-full max-w-xs">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="">All Categories</option>
                  <option value="social">Social Skills</option>
                  <option value="routine">Routines</option>
                  <option value="community">Community</option>
                  <option value="emotions">Emotions</option>
                  <option value="digital">Digital World/Technology</option>
                  <option value="school">School</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Source Filter (only in general tab) */}
            {activeTab === 'general' && (
              <div className="relative w-full max-w-xs">
                <select
                  value={selectedSourceFilter}
                  onChange={(e) => setSelectedSourceFilter(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                >
                  <option value="">All Sources</option>
                  <option value="system">System Library</option>
                  <option value="generated">AI Generated</option>
                  <option value="uploaded">Uploaded</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* Student Filter (only in personalized tab) */}
            {activeTab === 'personalized' && (
              <div className="relative w-full max-w-xs">
                <select
                  value={selectedStudentIdFilter}
                  onChange={(e) => setSelectedStudentIdFilter(e.target.value)}
                  disabled={studentsLoading || !myStudents.length}
                  className={`w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all duration-200 appearance-none ${studentsLoading || !myStudents.length ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
                    }`}
                >
                  <option value="">
                    {studentsLoading ? 'Loading Students...' : myStudents.length === 0 ? 'No students found' : 'All Your Students'}
                  </option>
                  {myStudents.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.name}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className={`w-5 h-5 text-gray-400 ${studentsLoading || !myStudents.length ? 'opacity-70' : ''
                      }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
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
            ) : error ? (
              <div className="text-center py-20">
                <h3 className="2xl font-semibold text-red-600 mb-3">Error Loading Stories</h3>
                <p className="text-gray-600 text-lg mb-8">{error}</p>
                <button
                  onClick={fetchStories}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl flex items-center gap-2 mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
              </div>
            ) : displayedStories.length === 0 ? (
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
                  Showing {displayedStories.length} {displayedStories.length === 1 ? 'story' : 'stories'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {displayedStories.map(story => {
                    const sourceInfo = getSourceInfo(story);
                    let displayCategory = story.category ? story.category.charAt(0).toUpperCase() + story.category.slice(1) : '';
                    if (story.category && story.category.toLowerCase().trim() === 'school routines') {
                      displayCategory = 'Routines';
                    } else if (story.category && story.category.toLowerCase().trim() === 'digital world/technology') {
                      displayCategory = 'Digital World/Technology';
                    }

                    // Check for visualScenes image
                    const hasVisualImage = Array.isArray(story.visualScenes) && story.visualScenes.length > 0 && story.visualScenes[0].image;
                    const visualImageUrl = hasVisualImage ? story.visualScenes[0].image : null;

                    return (
                      <div key={`story-${story._id ?? story.id}`} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative z-10">
                        <div className="h-48 bg-gradient-to-br from-purple-100 via-pink-50 to-purple-200 flex items-center justify-center relative overflow-hidden">
                          {/* Background image if available */}
                          {visualImageUrl && (
                            <>
                              <img
                                src={visualImageUrl}
                                alt="Story scene background"
                                className="absolute inset-0 w-full h-full object-cover z-0"
                                style={{ filter: 'brightness(0.9)' }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                            </>
                          )}
                          {/* Show emoji or BookOpen icon only if there is no image */}
                          {!visualImageUrl && (
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-20">
                              {story.emoji ? (
                                <span className="text-3xl" role="img" aria-label="Story emoji">{story.emoji}</span>
                              ) : (
                                <BookOpen size={32} className="text-purple-500" />
                              )}
                            </div>
                          )}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${sourceInfo.bgColor} ${sourceInfo.textColor} ${sourceInfo.borderColor} flex items-center gap-1 backdrop-blur-sm z-20`}>
                            {sourceInfo.icon}
                            {sourceInfo.label}
                          </div>
                          {story.category && (
                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(story.category)} backdrop-blur-sm z-20`}>
                              {displayCategory}
                            </div>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 mb-3 text-lg leading-tight group-hover:text-purple-600 transition-colors duration-200">
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                          {story.isPersonalized && story.student && (
                              <span className="bg-purple-100 px-2 py-1 rounded-full">
                                {studentNameMap[story.student._id] ? studentNameMap[story.student._id] : "Personalized"}
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
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 story-read-btn"
                            >
                              Read Story
                            </button>
                            <button
                              onClick={() => handlePersonalizeStory(story._id || story.id)}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 py-3 px-4 text-sm font-semibold transition-all duration-200 rounded-xl border border-purple-200 hover:border-purple-300 story-personalize-btn">
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