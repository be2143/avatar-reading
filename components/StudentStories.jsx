'use client';
import React, { useState, useEffect } from 'react';
import { Book, Calendar, Eye, User, Play, Plus, Printer } from 'lucide-react';

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

  const getStoryIcon = (emoji) => {
    if (!emoji) return ' 4d6';
    const cat = emoji.toLowerCase();
    if (cat.includes('social')) return ' 4dd';
    if (cat.includes('routine') || cat.includes('daily')) return ' 70b';
    if (cat.includes('help') || cat.includes('ask')) return ' 621';
    if (cat.includes('emotion') || cat.includes('feeling')) return ' 60a';
    if (cat.includes('school') || cat.includes('learn')) return ' 3eb';
    return ' 4d6';
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
    window.location.href = `/dashboard/social-stories/${story._id}/read`;
  };

  const handleViewStory = (story) => {
    window.location.href = `/dashboard/social-stories/${story._id}/read`;
  };

  const handleSeeProfile = () => {
    window.location.href = `/dashboard/students/${student._id}`;
  };

  const handleCreateStory = () => {
    window.location.href = `/dashboard/social-stories/create?studentId=${student._id}`;
  };

  const handlePrintStory = async (story) => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    try {
      // Dynamically import html2pdf.js
      const html2pdf = (await import('html2pdf.js')).default;

      // Rest of your existing PDF generation code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      tempDiv.innerHTML = `
      <div id="pdf-content" style="font-family: Arial;">
        <!-- Header -->
        <div style="
          border-bottom: 2px solid #7c3aed; 
          padding-bottom: 15px; 
          margin-bottom: 30px; 
          text-align: center;
        ">
          <h1 style="
            color: #7c3aed; 
            font-size: 28px; 
            margin: 0 0 10px 0; 
            font-weight: bold;
          ">${story.title}</h1>

          <div style="
            color: #6b7280; 
            font-size: 12px;
          ">Student: ${student.name} | Date: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <!-- Story Content -->
        ${story.visualScenes.map((scene, index) => `
          <div style="
            page-break-after: ${index < story.visualScenes.length - 1 ? 'always' : 'auto'}; 
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background-color: #fafafa;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            ${scene.image ? `
              <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                margin: 15px 0;
              ">
                <img src="${scene.image}" style="
                  max-width: 60%; 
                  height: auto; 
                  border-radius: 6px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  display: block;
                " />
              </div>
            ` : ''}
            <div style="
              font-size: 20px; 
              line-height: 1.7; 
              color: #374151;
              text-align: justify;
              width: 100%;
            ">${scene.text}</div>
          </div>
        `).join('')}t
        
        <!-- Footer -->
        <div style="
          border-top: 2px solid #7c3aed; 
          padding-top: 15px; 
          margin-top: 30px; 
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        ">
          <div style="margin-bottom: 5px;">
            Voxy-Social Stories Platform
          </div>
          <div>
            Page ${story.visualScenes.length > 0 ? '1' : '1'} of ${story.visualScenes.length > 0 ? story.visualScenes.length : '1'} | 
            ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
        </div>
        <div></div>
      </div>
    `;

      const convertImagesToDataUrls = async () => {
        const images = tempDiv.querySelectorAll('img');
        for (const img of images) {
          try {
            const dataUrl = await getImageDataUrl(img.src);
            img.src = dataUrl;
          } catch (error) {
            console.warn('Failed to convert image:', img.src);
            img.parentNode.removeChild(img);
          }
        }
      };

      const getImageDataUrl = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
          };
          img.onerror = reject;
          img.src = url;
        });
      };

      await convertImagesToDataUrls();

      const options = {
        margin: 15,
        filename: `${story.title.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          logging: true,
          useCORS: true,
          allowTaint: true
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      const element = tempDiv.querySelector('#pdf-content');
      await html2pdf().set(options).from(element).save();

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Clean up
      const tempDiv = document.getElementById('temp-pdf-div');
      if (tempDiv) {
        document.body.removeChild(tempDiv);
      }
    }
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
      </div>

      <div className="space-y-4">
        {stories.map((story) => (
          <div
            key={story._id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 bg-gray-50 hover:bg-white"
          >
            <div className="flex items-center space-x-4">
              <div className="text-3xl flex-shrink-0">
                {story.emoji ? (
                  <span role="img" aria-label="Story emoji">{story.emoji}</span>
                ) : (
                  <Book className="w-8 h-8 text-purple-400" />
                )}
              </div>
              <div className="flex-grow">
                <h4 className="font-semibold text-gray-800 text-lg mb-1">{story.title}</h4>
                {story.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2"><strong>Story Goal:</strong> {story.goal}</p>
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
                      <span> 3</span>
                      <span>Chapter: {story.chapter}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => handlePrintStory(story)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 border-2 border-purple-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 font-medium shadow-sm"
                >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={() => handleReadStory(story)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Read
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