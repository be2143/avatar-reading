'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadStoryPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMyStory, setIsMyStory] = useState(true); 
  const [otherAuthorName, setOtherAuthorName] = useState(''); 

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let postedBy = '';

      if (isMyStory) {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        postedBy = session?.user?.name || 'Anonymous';
      } else {
        postedBy = otherAuthorName.trim();
        if (!postedBy) {
          alert('Please enter the author\'s name.');
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/stories/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          ageGroup,
          story_content: storyContent,
          postedBy, 
          isPersonalized: false, 
        }),
      });

      if (!response.ok) {
        console.error('Story upload failed');
        alert('Failed to upload story. Please try again.');
      } else {
        const data = await response.json();
        console.log('Story uploaded:', data);
        router.push('/dashboard/social-stories'); 
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 p-6 bg-white rounded shadow">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-6 px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <h1 className="text-2xl font-semibold text-purple-700 mb-6">Upload a New Story</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        {/* Category Select */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
            required
          >
            <option value="">Select category</option>
            <option value="social">Social Skills</option>
            <option value="routine">Routines</option>
            <option value="community">Community</option>
            <option value="emotions">Emotions</option>
            <option value="digital">Digital world/Technology</option>
          </select>
        </div>

        {/* Age Group Select */}
        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">Age Group <span className="text-red-500">*</span></label>
          <select
            id="ageGroup"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
            required
          >
            <option value="">Select age group</option>
            <option value="3-5">3–5 years</option>
            <option value="6-8">6–8 years</option>
            <option value="9-12">9–12 years</option>
            <option value="13+">13+ years</option>
          </select>
        </div>

        {/* Story Content Textarea */}
        <div>
          <label htmlFor="storyContent" className="block text-sm font-medium text-gray-700">Story Content <span className="text-red-500">*</span></label>
          <textarea
            id="storyContent"
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            rows={6}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
            required
          ></textarea>
        </div>

        {/* Story Ownership Selection with Button Styling */}
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">Who wrote this story?</span>
          <div className="flex space-x-4">
            <label
              className={`flex-1 text-center py-2 px-4 rounded-md cursor-pointer transition-all duration-200 ease-in-out
                ${isMyStory ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }
            >
              <input
                type="radio"
                name="storyOwnership"
                value="myStory"
                checked={isMyStory}
                onChange={() => setIsMyStory(true)}
                className="sr-only" // Visually hide the default radio button
              />
              By me
            </label>
            <label
              className={`flex-1 text-center py-2 px-4 rounded-md cursor-pointer transition-all duration-200 ease-in-out
                ${!isMyStory ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
              }
            >
              <input
                type="radio"
                name="storyOwnership"
                value="otherAuthor"
                checked={!isMyStory}
                onChange={() => setIsMyStory(false)}
                className="sr-only" // Visually hide the default radio button
              />
              By someone else
            </label>
          </div>
        </div>

        {/* Conditional Input for Other Author's Name */}
        {!isMyStory && (
          <div>
            <label htmlFor="otherAuthor" className="block text-sm font-medium text-gray-700">Author's Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="otherAuthor"
              value={otherAuthorName}
              onChange={(e) => setOtherAuthorName(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
              required={!isMyStory} // Only required if 'By someone else' is selected
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? 'Uploading...' : 'Upload Story'}
        </button>
      </form>
    </div>
  );
}