'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

export default function AvatarReadingPage() {
    const { id } = useParams();
    const router = useRouter();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isReading, setIsReading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generatingVideoSceneIndex, setGeneratingVideoSceneIndex] = useState(-1);
    const [currentVideoUrl, setCurrentVideoUrl] = useState(null);
    const [language, setLanguage] = useState('en');

    const videoAvatarRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        if (id) {
            fetchStory();
        }
    }, [id]);

    useEffect(() => {
        if (story && story.visualScenes && story.visualScenes.length > 0) {
            // Auto-start reading when story loads
            handleStartReading();
        }
    }, [story]);

    const fetchStory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/stories/${id}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError('Story not found.');
                } else {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Failed to fetch story: ${res.statusText}`);
                }
            } else {
                const data = await res.json();
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

    const hasArabicText = story ? !!story.story_content_arabic : false;
    const arabicScenes = hasArabicText && story?.story_content_arabic
        ? story.story_content_arabic.split('\n\n').filter((s) => s.trim())
        : [];

    const getSceneTextByIndex = useCallback((index) => {
        if (!story?.visualScenes || story.visualScenes.length === 0) return '';
        const lang = language;
        if (lang === 'ar' && hasArabicText) {
            return arabicScenes[index] || story.visualScenes[index]?.text || '';
        }
        return story.visualScenes[index]?.text || '';
    }, [story, language, hasArabicText, arabicScenes]);

    // Generate video for a scene if it doesn't exist
    const generateVideoForScene = async (sceneId, text) => {
        if (!story || !id) return null;

        const scene = story.visualScenes?.find(s => s.id === sceneId);
        if (scene?.video) {
            console.log(`[Video] Scene ${sceneId} already has video:`, scene.video);
            return scene.video;
        }

        setIsGeneratingVideo(true);
        setGeneratingVideoSceneIndex(sceneId);

        try {
            const response = await fetch('/api/generate-avatar-video-klingai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storyId: id,
                    sceneId: sceneId,
                    text: text,
                    language: language,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to generate video: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`[Video] Generated video for scene ${sceneId}:`, data.videoUrl);

            // Refresh story to get updated video URL
            await fetchStory();

            return data.videoUrl;
        } catch (err) {
            console.error(`[Video] Error generating video for scene ${sceneId}:`, err);
            return null;
        } finally {
            setIsGeneratingVideo(false);
            setGeneratingVideoSceneIndex(-1);
        }
    };

    // Play video for a scene
    const fetchAndPlayVideo = async (text, sceneIndexToUpdate = -1) => {
        if (!text) return;

        if (isPaused && videoRef.current?.src) {
            try {
                await videoRef.current.play();
                setIsReading(true);
                setIsPaused(false);
                return;
            } catch (err) {
                console.error("Error resuming video:", err);
            }
        }

        setIsReading(true);
        setIsPaused(false);
        setError(null);

        try {
            const sceneId = sceneIndexToUpdate !== -1 
                ? story.visualScenes[sceneIndexToUpdate]?.id 
                : null;

            if (sceneIndexToUpdate !== -1) {
                setCurrentSceneIndex(sceneIndexToUpdate);
            }

            // Generate or get video URL
            let videoUrl = null;
            if (sceneId !== null && sceneId !== undefined) {
                videoUrl = await generateVideoForScene(sceneId, text);
            }

            if (!videoUrl) {
                throw new Error('Failed to get video URL for scene');
            }

            setCurrentVideoUrl(videoUrl);

            // Play audio from hidden video element
            if (videoRef.current) {
                videoRef.current.src = videoUrl;
                videoRef.current.load();
                videoRef.current.muted = false; // Ensure audio is enabled

                videoRef.current.onended = () => {
                    if (story?.visualScenes && sceneIndexToUpdate !== -1 && sceneIndexToUpdate < story.visualScenes.length - 1) {
                        setTimeout(() => {
                            const nextIndex = sceneIndexToUpdate + 1;
                            const nextText = getSceneTextByIndex(nextIndex);
                            fetchAndPlayVideo(nextText, nextIndex);
                        }, 1000);
                    } else {
                        handleStopReading();
                    }
                };

                videoRef.current.onerror = (e) => {
                    console.error("Video playback error:", e);
                    setIsReading(false);
                };

                await videoRef.current.play();
            }

            // Sync visible avatar video with hidden audio video
            if (videoAvatarRef.current) {
                videoAvatarRef.current.src = videoUrl;
                videoAvatarRef.current.load();
                videoAvatarRef.current.muted = true; // Mute the visible video
                await videoAvatarRef.current.play();
            }

        } catch (err) {
            console.error("Error in fetchAndPlayVideo:", err);
            setIsReading(false);
        }
    };

    const handleStartReading = useCallback(() => {
        if (!story || !story.visualScenes || story.visualScenes.length === 0) {
            return;
        }

        const textToPlay = getSceneTextByIndex(currentSceneIndex);
        if (!textToPlay) {
            alert('Current scene has no text to read.');
            return;
        }

        fetchAndPlayVideo(textToPlay, currentSceneIndex);
    }, [story, currentSceneIndex, getSceneTextByIndex]);

    const handleRestartReading = () => {
        handleStopReading();
        setCurrentSceneIndex(0);
        setTimeout(() => {
            const textToPlay = getSceneTextByIndex(0);
            if (textToPlay) {
                fetchAndPlayVideo(textToPlay, 0);
            }
        }, 100);
    };

    const handleStopReading = () => {
        if (videoRef.current) {
            videoRef.current.onended = null;
            videoRef.current.onerror = null;
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            videoRef.current.src = '';
            videoRef.current.load();
        }
        setIsReading(false);
        setIsPaused(false);
        setCurrentVideoUrl(null);
    };

    const handleSceneNavigation = (index) => {
        handleStopReading();
        setCurrentSceneIndex(index);
    };

    if (loading) return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <p className="text-white">Loading story...</p>
        </div>
    );

    if (!story) return (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <p className="text-red-400">{error || 'Story not found or an error occurred.'}</p>
        </div>
    );

    const currentScene = story.visualScenes?.[currentSceneIndex];
    const sceneVideoUrl = currentScene?.video || currentVideoUrl;

    return (
        <div className="fixed inset-0 bg-black z-50 m-0 p-0" style={{ margin: 0, padding: 0 }}>
            {/* Scene image - fullscreen */}
            <img
                src={story.visualScenes[currentSceneIndex]?.image}
                alt={`Scene ${currentSceneIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                    e.target.src = "https://via.placeholder.com/800x600/E5E7EB/6B7280?text=Image+Not+Available";
                }}
            />

            {/* Hidden video element for audio playback */}
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
                muted={false}
            />

            {/* Avatar video overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full shadow-lg z-10">
                {sceneVideoUrl ? (
                    <video
                        ref={videoAvatarRef}
                        key={sceneVideoUrl}
                        src={sceneVideoUrl}
                        className="w-44 h-44 rounded-full object-cover border-2 border-white"
                        playsInline
                        loop={false}
                        muted={true}
                        autoPlay
                    />
                ) : isGeneratingVideo && generatingVideoSceneIndex === currentScene?.id ? (
                    <div className="w-44 h-44 rounded-full border-2 border-white flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                            <div className="animate-spin mb-1 text-lg">⏳</div>
                            <div className="text-xs">Generating...</div>
                        </div>
                    </div>
                ) : (
                    <img
                        src="/avatar/avatar.png"
                        alt="Story reader"
                        className="w-44 h-44 rounded-full object-cover border-2 border-white"
                    />
                )}
            </div>


        </div>
    );
}
