'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadStoryPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [postedBy, setPostedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/stories/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      } else {
        const data = await response.json();
        console.log('Story uploaded:', data);
        // Optionally, navigate or reset form here
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      alert('Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-6">Upload a New Story</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2"
            required
          >
            <option value="">Select category</option>
            <option value="social">Social Skills</option>
            <option value="school">School Routines</option>
            <option value="community">Community</option>
            <option value="emotions">Emotions</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Age Group</label>
          <input
            type="text"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            placeholder="e.g. 6-8"
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Story Content</label>
          <textarea
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            rows={6}
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Posted By</label>
          <input
            type="text"
            value={postedBy}
            onChange={(e) => setPostedBy(e.target.value)}
            placeholder="Your name"
            className="mt-1 w-full border border-gray-300 rounded px-4 py-2"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading...' : 'Upload Story'}
        </button>
      </form>
    </div>
  );
}
