'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function ReadStoryPage() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    const handleBack = () => {
        router.push('/dashboard/social-stories');
    };

    useEffect(() => {
        if (id) {
            fetchStory();
        }
    }, [id]);

    const fetchStory = async () => {
        try {
            const res = await fetch(`/api/stories/${id}`);
            const data = await res.json();
            setStory(data);
        } catch (err) {
            console.error('Failed to fetch story', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading story...</div>;
    if (!story) return <div className="p-6">Story not found.</div>;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            {/* Back Button */}
            <div className="mb-6 flex items-center cursor-pointer text-purple-600 hover:text-purple-800" onClick={handleBack}>
                <span className="font-medium text-sm">← Back to Stories</span>
            </div>
            <h1 className="text-3xl font-bold text-purple-800 mb-4">{story.title}</h1>
            <p className="text-gray-700 mb-6">{story.description}</p>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{story.story_content}</p>
            </div>
            <button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 mt-6 rounded-lg text-sm font-medium transition-colors"
            >
                Personalize Story
            </button>
        </div>
    );
}
