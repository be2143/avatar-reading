'use client'; // This MUST be the very first line

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

// Make sure your component is a direct functional component export
export default function ReadStoryPage() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Ensure this state is defined

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
            if (!res.ok) {
                if (res.status === 404) {
                    console.error('Story not found.');
                    setStory(null);
                    setError('Story not found.');
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to fetch story: ${res.statusText}`);
                }
            } else {
                const data = await res.json();
                console.log('Fetched story:', data);
                setStory(data);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching story:', err);
            setError(`Failed to load story: ${err.message}`);
            setStory(null);
        } finally {
            setLoading(false);
        }
    };

    const handlePersonalizeClick = () => {
        // Use `id` directly from useParams
        console.log(`Navigating to personalize story with ID: ${id}`);
        router.push(`/dashboard/social-stories/${id}/personalize`);
    };

    if (loading) return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
            <p className="text-gray-600">Loading story...</p>
        </div>
    );

    if (!story) return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
            <p className="text-red-600">{error || 'Story not found or an error occurred.'}</p>
        </div>
    );

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            {/* Back Button */}
            <div className="mb-6 flex items-center cursor-pointer text-purple-600 hover:text-purple-800" onClick={handleBack}>
                <span className="font-medium text-sm">← Back to Stories</span>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md mb-6">
                <h1 className="text-3xl font-bold text-purple-800 mb-4">{story.title}</h1>
                {story.description && (
                    <p className="text-gray-700 mb-4 text-lg italic">{story.description}</p>
                )}

                {/* Display character details if available */}
                {story.mainCharacterDescription && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Main Character:</h3>
                        <p className="text-blue-700">{story.mainCharacterDescription}</p>
                        {story.otherCharacters && story.otherCharacters.length > 0 && (
                            <>
                                <h4 className="text-md font-medium text-blue-700 mt-3">Other Characters:</h4>
                                <ul className="list-disc list-inside text-blue-700">
                                    {story.otherCharacters.map((char, idx) => (
                                        <li key={idx}>{char}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {story.selectedStyle && (
                             <p className="text-sm text-blue-600 mt-2">Visual Style: {story.selectedStyle}</p>
                        )}
                    </div>
                )}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-purple-700 mb-3">Story Text:</h2>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-line">{story.story_content}</p>
                </div>
            </div>

            {/* Display Visual Scenes if available */}
            {story.hasImages && story.visualScenes && story.visualScenes.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-purple-800 mb-6">Visual Story Scenes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {story.visualScenes.map((scene, index) => (
                            <div key={scene.id || index} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <img
                                    src={scene.image}
                                    alt={`Scene ${scene.id || index + 1}`}
                                    className="w-full h-64 object-cover" // Increased height
                                    onError={(e) => { e.target.src = "https://via.placeholder.com/400x300.png?text=Image+Not+Available"; e.target.alt = "Image Not Available"; }}
                                    loading="lazy"
                                />
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-purple-700 mb-2">Scene {scene.id || index + 1}</h3>
                                    <p className="text-gray-800 leading-relaxed">{scene.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personalize Story Button - moved outside story details block for better flow */}
            <div className="mt-8 text-center">
                <button
                    onClick={handlePersonalizeClick}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors shadow-lg"
                >
                    Personalize Story
                </button>
            </div>
        </div>
    );
}