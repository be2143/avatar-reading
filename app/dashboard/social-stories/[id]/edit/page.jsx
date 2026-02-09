"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, Save, RefreshCw, Eye } from 'lucide-react';

export default function EditStoryPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
    const [regeneratingScene, setRegeneratingScene] = useState(null);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [modalInstructions, setModalInstructions] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [language, setLanguage] = useState('en');

    // Form data for editing
    const [formData, setFormData] = useState({
        title: '',
        story_content: '',
        story_content_arabic: '',
        visualScenes: [],
        visibility: 'private'
    });

    useEffect(() => {
        fetchStory();
    }, [id]);

    const fetchStory = async () => {
        try {
            const response = await fetch(`/api/stories/${id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch story');
            }
            const data = await response.json();
            
            // Check if this is a system story - system stories cannot be edited
            if (data.source === 'system') {
                setError('System stories cannot be edited. Only user-created stories can be modified.');
                setLoading(false);
                return;
            }
            
            // Check if this story was created by the current user
            if (data.createdBy !== session?.user?.id) {
                setError('You can only edit stories that you created.');
                setLoading(false);
                return;
            }
            
            setStory(data);
            setFormData({
                title: data.title || '',
                story_content: data.story_content || '',
                story_content_arabic: data.story_content_arabic || '',
                visualScenes: data.visualScenes || [],
                visibility: data.visibility || 'private'
            });
        } catch (err) {
            setError(`Failed to load story: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveStory = async () => {
        setSaving(true);
        setError('');

        try {
            const response = await fetch(`/api/stories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formData.title,
                    story_content: formData.story_content,
                    story_content_arabic: formData.story_content_arabic,
                    visualScenes: formData.visualScenes,
                    visibility: formData.visibility
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save story');
            }

            alert("Story updated successfully!");
            router.push(`/dashboard/social-stories/${id}/read`);
        } catch (err) {
            setError(`Failed to save story: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const regenerateScene = async (sceneIndex, instructions = '', previewOnly = false) => {
        setRegeneratingScene(sceneIndex);
        setError('');

        const sceneToRegenerate = formData.visualScenes[sceneIndex];
        if (!sceneToRegenerate) {
            setError("Scene not found for regeneration.");
            setRegeneratingScene(null);
            return;
        }

        try {
            // Send request with available data - character info is optional
            const requestBody = {
                sceneText: sceneToRegenerate.text,
                instructions,
                currentImageUrl: sceneToRegenerate.image,
                storyId: id, // Send story ID so API can look up character image
                sceneIndex: sceneIndex, // Send scene index so API can find previous/next scenes
            };

            // Add character info if available (for better consistency)
            if (story?.initialCartoonBaseImageUrl) {
                requestBody.mainCharacterImage = story.initialCartoonBaseImageUrl;
            }
            if (story?.mainCharacterName) {
                requestBody.mainCharacterName = story.mainCharacterName;
            }

            const response = await fetch('/api/stories/regenerate-scene', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to regenerate scene from API');
            }

            const data = await response.json();

            if (previewOnly) {
                // Show preview modal with the new image
                setPreviewImage({
                    newImageUrl: data.imageUrl,
                    currentImageUrl: sceneToRegenerate.image,
                    sceneIndex: sceneIndex,
                    instructions: instructions
                });
                setShowPreviewModal(true);
                setShowRegenerateModal(false);
                return true;
            } else {
                // Directly update the scene
                const updatedScenes = [...formData.visualScenes];
                updatedScenes[sceneIndex] = {
                    ...updatedScenes[sceneIndex],
                    image: data.imageUrl,
                    error: false,
                    loading: false,
                };
                setFormData(prev => ({ ...prev, visualScenes: updatedScenes }));
                setError('');
                return true;
            }
        } catch (err) {
            setError(`Failed to regenerate scene: ${err.message}`);
            return false;
        } finally {
            setRegeneratingScene(null);
        }
    };

    const confirmPreviewImage = () => {
        if (!previewImage) return;

        const { newImageUrl, sceneIndex } = previewImage;
        const updatedScenes = [...formData.visualScenes];
        updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            image: newImageUrl,
            error: false,
            loading: false,
        };
        setFormData(prev => ({ ...prev, visualScenes: updatedScenes }));
        setShowPreviewModal(false);
        setPreviewImage(null);
        setError('');
    };

    const cancelPreviewImage = () => {
        setShowPreviewModal(false);
        setPreviewImage(null);
    };

    const handleSceneTextEdit = (sceneIndex, newText) => {
        const updatedScenes = [...formData.visualScenes];
        updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            text: newText
        };
        setFormData(prev => ({ ...prev, visualScenes: updatedScenes }));
    };

    const handleArabicSceneTextEdit = (sceneIndex, newText) => {
        const currentArabic = formData.story_content_arabic || '';
        const parts = currentArabic.split('\n\n');
        while (parts.length <= sceneIndex) parts.push('');
        parts[sceneIndex] = newText;
        const joined = parts.join('\n\n');
        setFormData(prev => ({ ...prev, story_content_arabic: joined }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-gray-600">Loading story...</p>
                </div>
            </div>
        );
    }

    if (error && !story) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-1 text-sm font-medium mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <div className="flex justify-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-700">Edit Story</h1>
                </div>

                {error && (
                    <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <div className="bg-white p-8 rounded-lg shadow-md">
                    {/* Story Title */}
                    <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Story Title</h3>
                        <input
                            type="text"
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* Story Content - Only show for stories without visual scenes */}
                    {formData.visualScenes.length === 0 && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-4">Story Content</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* English Story Text */}
                                <div>
                                    <label htmlFor="storyContentEn" className="block text-sm font-medium text-gray-700 mb-2">Story Text (English)</label>
                                    <textarea
                                        id="storyContentEn"
                                        value={formData.story_content}
                                        onChange={(e) => setFormData(prev => ({ ...prev, story_content: e.target.value }))}
                                        rows="10"
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500 resize-y"
                                    />
                                </div>
                                
                                {/* Arabic Story Text */}
                                <div>
                                    <label htmlFor="storyContentAr" className="block text-sm font-medium text-gray-700 mb-2">Story Text (Arabic)</label>
                                    <textarea
                                        id="storyContentAr"
                                        value={formData.story_content_arabic || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, story_content_arabic: e.target.value }))}
                                        rows="10"
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-purple-500 focus:border-purple-500 resize-y"
                                        dir="rtl"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visibility Settings - Only for non-personalized stories */}
                    {!story.isPersonalized && (
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-4">Story Visibility</h3>
                            <div className="space-y-2">
                                <span className="block text-sm font-medium text-gray-700">Choose Story Visibility</span>
                                <div className="flex space-x-4">
                                    <label
                                        className={`flex-1 text-center py-2 px-4 rounded-md cursor-pointer transition-all duration-200 ease-in-out
                                            ${formData.visibility === 'private' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="private"
                                            checked={formData.visibility === 'private'}
                                            onChange={() => setFormData(prev => ({ ...prev, visibility: 'private' }))}
                                            className="sr-only"
                                        />
                                        Private - Only visible to me
                                    </label>
                                    <label
                                        className={`flex-1 text-center py-2 px-4 rounded-md cursor-pointer transition-all duration-200 ease-in-out
                                            ${formData.visibility === 'public' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                                        }
                                    >
                                        <input
                                            type="radio"
                                            name="visibility"
                                            value="public"
                                            checked={formData.visibility === 'public'}
                                            onChange={() => setFormData(prev => ({ ...prev, visibility: 'public' }))}
                                            className="sr-only"
                                        />
                                        Public - Visible to all users
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visual Scenes - Only show if story has visual scenes */}
                    {formData.visualScenes.length > 0 && (
                        <div>
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1 border-r pr-6">
                                    <h4 className="text-lg font-semibold mb-4">Scene Navigation</h4>
                                    <div className="flex flex-col gap-2">
                                        {formData.visualScenes.map((scene, index) => (
                                            <button
                                                key={scene.id || index}
                                                onClick={() => setSelectedSceneIndex(index)}
                                                className={`block w-full text-left p-3 rounded-lg ${selectedSceneIndex === index ? 'bg-purple-100 text-purple-800 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                Scene {index + 1}: {scene.text.substring(0, 40)}...
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="lg:col-span-2">
                                    {formData.visualScenes[selectedSceneIndex] && (
                                        <div className="bg-white border rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-semibold">
                                                    Scene {selectedSceneIndex + 1}
                                                </h4>
                                            </div>
                                            <div className="mb-4 relative">
                                                <img
                                                    key={formData.visualScenes[selectedSceneIndex].id}
                                                    src={formData.visualScenes[selectedSceneIndex].image}
                                                    alt={`Scene ${selectedSceneIndex + 1}`}
                                                    className="w-full h-80 object-contain rounded-md bg-gray-100"
                                                    onError={(e) => { e.target.src = "https://placehold.co/600x400/e0e0e0/000000?text=Image+Load+Error"; }}
                                                    loading="lazy"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log('Regenerate button clicked!'); // Debug log
                                                        const existing = formData.visualScenes[selectedSceneIndex]?.instructions || '';
                                                        setModalInstructions(existing);
                                                        setShowRegenerateModal(true);
                                                    }}
                                                    disabled={regeneratingScene === selectedSceneIndex}
                                                    className="absolute top-3 right-3 z-10 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl border border-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    title="Regenerate this scene"
                                                >
                                                    {regeneratingScene === selectedSceneIndex ? (
                                                        <>
                                                            <svg
                                                                className="animate-spin h-4 w-4 text-white"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <circle
                                                                    className="opacity-25"
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                ></circle>
                                                                <path
                                                                    className="opacity-75"
                                                                    fill="currentColor"
                                                                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 00-10 10h4z"
                                                                ></path>
                                                            </svg>
                                                            <span className="text-sm font-medium">Regenerating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Regenerate</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* English Scene Text */}
                                                    <div>
                                                        <label htmlFor="sceneTextEn" className="block text-sm font-medium text-gray-700 mb-2">Scene Text (English)</label>
                                                        <textarea
                                                            id="sceneTextEn"
                                                            value={formData.visualScenes[selectedSceneIndex].text}
                                                            onChange={(e) => handleSceneTextEdit(selectedSceneIndex, e.target.value)}
                                                            rows="6"
                                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 resize-y focus:ring-purple-500 focus:border-purple-500"
                                                        />
                                                    </div>

                                                    {/* Arabic Scene Text */}
                                                    <div>
                                                        <label htmlFor="sceneTextAr" className="block text-sm font-medium text-gray-700 mb-2">Scene Text (Arabic)</label>
                                                        <textarea
                                                            id="sceneTextAr"
                                                            value={(formData.story_content_arabic || '').split('\n\n')[selectedSceneIndex] || ''}
                                                            onChange={(e) => handleArabicSceneTextEdit(selectedSceneIndex, e.target.value)}
                                                            rows="6"
                                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 resize-y focus:ring-purple-500 focus:border-purple-500"
                                                            dir="rtl"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mt-4">
                                                    <span className="mr-3 text-2xl">ℹ️</span>
                                                    <span className="text-gray-700 text-base">Review and edit both English and Arabic texts so they match per scene.</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Save Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSaveStory}
                            disabled={saving}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                        >
                            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Regenerate Modal */}
                {showRegenerateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl mx-4 p-5">
                            <h4 className="text-lg font-semibold mb-3">Regenerate Scene {selectedSceneIndex + 1}</h4>
                            <div className="mb-4">
                                <img
                                    src={formData.visualScenes[selectedSceneIndex]?.image}
                                    alt={`Current Scene ${selectedSceneIndex + 1}`}
                                    className="w-full h-64 object-contain rounded-md bg-gray-100"
                                />
                            </div>
                            <label htmlFor="modalInstructions" className="block text-sm font-medium text-gray-700 mb-1">Describe changes (optional)</label>
                            <textarea
                                id="modalInstructions"
                                rows="3"
                                value={modalInstructions}
                                onChange={(e) => setModalInstructions(e.target.value)}
                                className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g., Make background a sunny park and add a red ball"
                                disabled={regeneratingScene === selectedSceneIndex}
                            />
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRegenerateModal(false)}
                                    disabled={regeneratingScene === selectedSceneIndex}
                                    className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const ok = await regenerateScene(selectedSceneIndex, modalInstructions || '', true);
                                    }}
                                    disabled={regeneratingScene === selectedSceneIndex}
                                    className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {regeneratingScene === selectedSceneIndex ? 'Generating Preview…' : 'Generate Preview'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreviewModal && previewImage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4 p-6">
                            <h4 className="text-xl font-semibold mb-4">Preview New Scene</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Current Image */}
                                <div>
                                    <h5 className="text-lg font-medium mb-3 text-gray-700">Current Scene</h5>
                                    <img
                                        src={previewImage.currentImageUrl}
                                        alt="Current Scene"
                                        className="w-full h-64 object-contain rounded-md bg-gray-100 border"
                                    />
                                </div>

                                {/* New Image */}
                                <div>
                                    <h5 className="text-lg font-medium mb-3 text-green-700">New Scene Preview</h5>
                                    <img
                                        src={previewImage.newImageUrl}
                                        alt="New Scene Preview"
                                        className="w-full h-64 object-contain rounded-md bg-gray-100 border border-green-300"
                                    />
                                </div>
                            </div>

                            {/* Instructions Display */}
                            {previewImage.instructions && (
                                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h6 className="font-medium text-blue-900 mb-2">Applied Instructions:</h6>
                                    <p className="text-blue-800">{previewImage.instructions}</p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={cancelPreviewImage}
                                    className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmPreviewImage}
                                    className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                                >
                                    Use This Scene
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
