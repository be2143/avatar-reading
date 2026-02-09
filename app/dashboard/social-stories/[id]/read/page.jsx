'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { Share2, Book, Calendar, Eye, User, Play, Plus, Printer, MoreVertical, MoreHorizontal } from 'lucide-react';
import BehavioralSurveyPopup from '@/components/BehavioralSurvey';

export default function PersonalizedStoryReader() {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fixedVoices = [
        { id: 'Ivy', name: 'Ivy' },
        { id: 'Justin', name: 'Justin' },
    ];
    const [selectedVoiceId, setSelectedVoiceId] = useState();

    const [isReading, setIsReading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [readingProgress, setReadingProgress] = useState(0);
    const [timeSpent, setTimeSpent] = useState(0);
    const [sessionNotes, setSessionNotes] = useState('');
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [sessionNumber, setSessionNumber] = useState(1);
    const [isImageExpanded, setIsImageExpanded] = useState(false);
    const [suggestedActivity, setSuggestedActivity] = useState('');
    const [activityUsefulness, setActivityUsefulness] = useState(null);
    const [activityCompleted, setActivityCompleted] = useState(false);
    const [isGeneratingActivity, setIsGeneratingActivity] = useState(false);
    const [comprehensionScore, setComprehensionScore] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [showBehavioralSurveyPopup, setShowBehavioralSurveyPopup] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);


    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const router = useRouter();
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Modified stop reading function - doesn't stop timer
    const handleStopReading = useCallback((keepProgress = false) => {
        if (audioRef.current) {
            if (keepProgress) {
                audioRef.current.pause();
                setIsPaused(true);
            } else {
                audioRef.current.onended = null;
                audioRef.current.onerror = null;
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioRef.current.src = '';
                audioRef.current.load();
                setIsPaused(false);
            }
        }
        setIsReading(false);
        // Timer continues running
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }

        timerRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => {
            handleStopReading();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [handleStopReading]);

    const handleBack = () => {
        handleStopReading();
        router.back();
    };

    useEffect(() => {
        if (id) {
            fetchStory();
        }
    }, [id]);

    useEffect(() => {
        console.log('Story:', story);
        if (story && story.student) {
            console.log('Fetching student data for story:', story.student);
            fetchStudentData(story.student);
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
                setSessionNumber((data.sessions?.length || 0) + 1);
            }
        } catch (err) {
            console.error('Error fetching story:', err);
            setError(`Failed to load story: ${err.message}`);
            setStory(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentData = async (studentId) => {
        console.log('studentId: ', studentId);
        try {
            const res = await fetch(`/api/students/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setStudentData(data.student);
                // Show popup when student data is loaded
                setShowBehavioralSurveyPopup(true);
            } else {
                console.error('Failed to fetch student data:', res.status, res.statusText);
            }
        } catch (err) {
            console.error('Error fetching student data:', err);
        }
    };

    useEffect(() => {
        if (isReading && story && story.visualScenes && story.visualScenes.length > 0) {
            const progress = Math.round(((currentSceneIndex + 1) / story.visualScenes.length) * 100);
            setReadingProgress(progress);
        }
    }, [currentSceneIndex, isReading, story]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const fetchAndPlayAudio = async (text, sceneIndexToUpdate = -1) => {
        if (!selectedVoiceId || !text || !audioRef.current) return;

        if (isPaused && audioRef.current.src) {
            try {
                await audioRef.current.play();
                setIsReading(true);
                setIsPaused(false);
                return;
            } catch (err) {
                console.error("Error resuming audio:", err);
            }
        }

        setIsReading(true);
        setIsPaused(false);
        setError(null);

        try {
            const response = await fetch('/api/generate-speech', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId: selectedVoiceId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to generate speech: ${response.statusText}`);
            }

            const data = await response.json();
            const audioDataUrl = data.audio;


            if (sceneIndexToUpdate !== -1) {
                setCurrentSceneIndex(sceneIndexToUpdate);
            }

            audioRef.current.src = audioDataUrl;
            audioRef.current.load();

            audioRef.current.onended = () => {
                if (story?.visualScenes && sceneIndexToUpdate !== -1 && sceneIndexToUpdate < story.visualScenes.length - 1) {
                    setTimeout(() => {
                        fetchAndPlayAudio(story.visualScenes[sceneIndexToUpdate + 1].text, sceneIndexToUpdate + 1);
                    }, 1000);
                } else {
                    handleStopReading();
                    setReadingProgress(100);
                }
            };

            audioRef.current.onerror = (e) => {
                console.error("Audio playback error:", e);
            };

            await audioRef.current.play();

        } catch (err) {
            console.error("Error in fetchAndPlayAudio:", err);
        }
    };

    const handlePrintStory = async (story) => {
        if (typeof window === 'undefined') return;

        try {
            const html2pdf = (await import('html2pdf.js')).default;

            // Determine footer text based on story source
            let footerText;
            if (story.source === 'uploaded') {
                footerText = story.authorName ? `Story by ${story.authorName}` : 'Uploaded story';
            } else if (story.source === 'generated') {
                footerText = 'Generated by AI with Voxy-Social Stories';
            } else {
                footerText = 'From the System Library';
            }

            // Determine content to display based on story type
            const hasVisualScenes = story.visualScenes && story.visualScenes.length > 0;
            const hasTextContent = story.generatedText || story.story_content;
            const totalPages = hasVisualScenes ? story.visualScenes.length : 1;

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
              ">Date: ${new Date().toLocaleDateString()}</div>
            </div>
            
            <!-- Story Content -->
            ${hasVisualScenes
                    ? story.visualScenes.map((scene, index) => `
                    <div style="
                      page-break-after: ${index < story.visualScenes.length - 1 ? 'always' : 'auto'}; 
                      margin-bottom: 30px;
                      padding: 20px;
                      border: 1px solid #e5e7eb;
                      border-radius: 8px;
                      background-color: #fafafa;
                    ">
                      ${scene.image ? `
                        <div style="text-align: center; margin: 15px 0;">
                          <img src="${scene.image}" style="
                            max-width: 100%; 
                            height: auto; 
                            border-radius: 6px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          " />
                        </div>
                      ` : ''}
                      <div style="
                        font-size: 16px; 
                        line-height: 1.6; 
                        color: #374151;
                        text-align: justify;
                      ">${scene.text}</div>
                    </div>
                  `).join('')
                    : `
                    <div style="
                      margin-bottom: 30px;
                      padding: 20px;
                      border: 1px solid #e5e7eb;
                      border-radius: 8px;
                      background-color: #fafafa;
                    ">
                      <div style="
                        font-size: 16px; 
                        line-height: 1.6; 
                        color: #374151;
                        text-align: justify;
                        white-space: pre-line;
                      ">${story.generatedText || story.story_content}</div>
                    </div>
                  `
                }
            
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
                ${footerText}
              </div>
              <div>
                Page 1 of ${totalPages} | 
                ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        `;

            // Image conversion logic
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

            if (hasVisualScenes) {
                await convertImagesToDataUrls();
            }

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
            const tempDiv = document.getElementById('temp-pdf-div');
            if (tempDiv) {
                document.body.removeChild(tempDiv);
            }
        }
    };

    const handleStartReading = () => {
        if (!selectedVoiceId) {
            alert('Please select a voice first.');
            return;
        }

        if (isPaused && audioRef.current.src) {
            try {
                audioRef.current.play();
                setIsReading(true);
                setIsPaused(false);
                return;
            } catch (err) {
                console.error("Error resuming audio:", err);
            }
        }

        let textToPlay = '';
        let initialSceneIndex = 0;

        if (story?.visualScenes?.length > 0) {
            textToPlay = story.visualScenes[currentSceneIndex]?.text;
            initialSceneIndex = currentSceneIndex;
        } else if (story?.generatedText) {
            textToPlay = story.generatedText;
        } else if (story?.story_content) {
            textToPlay = story.story_content;
        } else {
            alert('No story content available to read.');
            return;
        }

        if (!textToPlay) {
            alert('Current scene has no text to read.');
            return;
        }

        setReadingProgress(0);

        fetchAndPlayAudio(textToPlay, isVisualStory ? initialSceneIndex : -1);
    };

    const handleRestartReading = () => {
        handleStopReading();
        setCurrentSceneIndex(0);
        setReadingProgress(0);

        setTimeout(() => {
            let textToPlay = '';
            if (story?.visualScenes?.length > 0) {
                textToPlay = story.visualScenes[0].text;
            } else if (story?.generatedText) {
                textToPlay = story.generatedText;
            } else if (story?.story_content) {
                textToPlay = story.story_content;
            }

            if (textToPlay) {
                fetchAndPlayAudio(textToPlay, isVisualStory ? 0 : -1);
            }
        }, 100);
    };

    const handleSceneNavigation = (index) => {
        handleStopReading();
        setCurrentSceneIndex(index);
    };

    const generateActivity = async () => {
        if (!story) return;

        setIsGeneratingActivity(true);
        try {
            const res = await fetch('/api/generate-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: story.student?.name || 'Student',
                    comprehension_level: story.student?.comprehensionLevel || 'not specified',
                    story_title: story.title,
                    story_content: story.generatedText || story.story_content || story.visualScenes?.[currentSceneIndex]?.text || '',
                    interests: story.student?.interests || 'not specified'
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to generate activity: ${res.statusText}`);
            }

            const data = await res.json();
            setSuggestedActivity(data.activity);
            setActivityCompleted(false);
            setActivityUsefulness(null);
        } catch (err) {
            console.error("Error generating activity:", err);
            setError(`Failed to generate activity: ${err.message}`);
        } finally {
            setIsGeneratingActivity(false);
        }
    };

    const resetSessionState = () => {
        setSessionNotes('');
        setTimeSpent(0);
        setQuestionsAnswered(0);
        setSuggestedActivity('');
        setActivityCompleted(false);
        setActivityUsefulness(null);
        setComprehensionScore(null);
    };

    const handleSaveBehavioralScore = async (newScore) => {
        if (!studentData || !studentData._id) {
            console.error('Student data or ID is missing');
            return;
        }

        try {
            const response = await fetch(`/api/students/${studentData._id}/behavioral-score`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newScore: newScore }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update behavioral score');
            }

            setStudentData(prev => ({
                ...prev,
                currentBehavioralScore: newScore
            }));

            setShowBehavioralSurveyPopup(false);
            alert('Behavioral score updated successfully!');
        } catch (error) {
            console.error('Error updating behavioral score:', error);
            alert('Failed to update behavioral score. Please try again.');
        }
    };

    const handleSaveSession = async () => {
        if (!story || !id) return;

        if (!comprehensionScore) {
            alert('Please select a comprehension score before saving the session.');
            return;
        }

        handleStopReading();

        // Stop timer when saving session
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setLoading(true);

        const sessionData = {
            sessionNotes,
            timeSpent,
            sessionNum: sessionNumber,
            comprehensionScore,
        };

        try {
            const res = await fetch(`/api/stories/${id}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to save session: ${res.statusText}`);
            }

            const updatedStoryResponse = await res.json();
            setStory(updatedStoryResponse.story);

            setSessionNumber((prev) => prev + 1);
            resetSessionState();

            alert('Session saved successfully!');

            // Show popup when student exists in the story
            if (story.student) {
                setShowBehavioralSurveyPopup(true);
            }
        } catch (err) {
            console.error('Error saving session:', err);
            setError(`Failed to save session: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
            <p className="ml-3 text-gray-600">Loading story...</p>
        </div>
    );

    if (!story) return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
            <p className="text-red-600">{error || 'Story not found or an error occurred.'}</p>
        </div>
    );

    const isVisualStory = story.visualScenes && story.visualScenes.length > 0;
    const currentTextContent = isVisualStory
        ? story.visualScenes[currentSceneIndex]?.text
        : story.generatedText || story.story_content;
    const totalScenesForProgress = isVisualStory ? story.visualScenes.length : 1;
    const questionsTotal = isVisualStory ? story.visualScenes.length : 4;

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <button
                onClick={handleBack}
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
                Back to Stories
            </button>

            <div className="mb-6 flex">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-800 to-pink-600 bg-clip-text text-transparent">

                    {story.title}</h1>

                {/* Three-dot menu */}
                <div className="ml-2 relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-full hover:bg-purple-100 transition-colors"
                        aria-label="Story options"
                    >
                        <MoreHorizontal className="w-6 h-6 text-gray-600" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-100 overflow-hidden">
                            {/* Print Story Option */}
                            <button
                                onClick={() => {
                                    handlePrintStory(story);
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors duration-150 text-left flex items-center gap-3"
                            >
                                <Printer className="w-4 h-4 text-purple-600" />
                                <span>Print Story</span>
                            </button>

                            {/* Personalize Story Option */}
                            <button
                                onClick={() => {
                                    router.push(`/dashboard/social-stories/${story._id}/personalize`);
                                    setIsMenuOpen(false);
                                }}
                                className="block w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors duration-150 text-left flex items-center gap-3"
                            >
                                <Plus className="w-4 h-4 text-purple-600" />
                                <span>Personalize Story</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="relative w-full max-w-xs">
                    <select
                        value={selectedVoiceId}
                        onChange={(e) => {
                            setSelectedVoiceId(e.target.value);
                            handleStopReading();
                        }}
                        disabled={isReading}
                        className={`
      w-full px-4 py-2.5 pr-10 
      border border-gray-300 rounded-lg 
      bg-white text-gray-800
      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent
      transition-all duration-200
      appearance-none
      ${isReading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
    `}
                    >
                        <option value="">Select Voice</option>
                        {fixedVoices.map((voice) => (
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>

                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                            className={`w-5 h-5 text-gray-400 ${isReading ? 'opacity-70' : ''}`}
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

                {!isReading ? (
                    <div className="flex gap-2">
                        <button
                            onClick={handleStartReading}
                            disabled={!selectedVoiceId || (!story.generatedText && !story.story_content && (!story.visualScenes || story.visualScenes.length === 0))}
                            className="h-11 px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>▶</span>
                            {isPaused ? 'Continue Reading' : 'Start Reading'}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStopReading(true)}
                            className="h-11 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center gap-2"
                        >
                            <span>⏸</span>
                            Pause
                        </button>
                        <button
                            onClick={handleRestartReading}
                            className="h-11 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
                        >
                            <span>↻</span>
                            Restart
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">

                    {isVisualStory ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="relative h-96 flex justify-center items-center bg-gray-100">
                                <img
                                    src={story.visualScenes[currentSceneIndex]?.image}
                                    alt={`Scene ${currentSceneIndex + 1}`}
                                    className="max-h-full w-auto object-contain"
                                    onError={(e) => {
                                        e.target.src = "https://via.placeholder.com/600x400/E5E7EB/6B7280?text=Image+Not+Available";
                                    }}
                                />
                                <button
                                    onClick={() => setIsImageExpanded(true)}
                                    className="absolute bottom-4 right-4 w-10 h-10 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                    title="Expand image"
                                >
                                    <span className="text-sm">⛶</span>
                                </button>

                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-lg">
                                    <button
                                        onClick={() => handleSceneNavigation(Math.max(0, currentSceneIndex - 1))}
                                        disabled={currentSceneIndex === 0 || isReading}
                                        className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                        title="Previous scene"
                                    >
                                        <span className="text-sm font-bold">‹</span>
                                    </button>

                                    <div className="flex gap-2">
                                        {story.visualScenes.map((_, index) => (
                                            <div
                                                key={index}
                                                className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentSceneIndex
                                                    ? 'bg-purple-600'
                                                    : index < currentSceneIndex
                                                        ? 'bg-purple-300'
                                                        : 'bg-gray-300'
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handleSceneNavigation(Math.min(story.visualScenes.length - 1, currentSceneIndex + 1))}
                                        disabled={currentSceneIndex === story.visualScenes.length - 1 || isReading}
                                        className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                        title="Next scene"
                                    >
                                        <span className="text-sm font-bold">›</span>
                                    </button>
                                </div>

                                {isReading && (
                                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                                        <span className="text-sm">Reading...</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-purple-700 mb-3">
                                    Scene {currentSceneIndex + 1}
                                </h3>
                                <p className="text-gray-800 leading-relaxed">
                                    {currentTextContent}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="relative bg-gradient-to-br from-purple-100 to-blue-100 h-96 flex justify-center items-center">
                                <div className="text-center p-8">
                                    <h2 className="text-2xl font-bold text-purple-800 mb-2">{story.title}</h2>
                                    <p className="text-purple-600">Audio Story</p>
                                </div>
                                {isReading && (
                                    <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                                        <span className="text-sm">Reading...</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-purple-700 mb-3">Story Content</h3>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{currentTextContent}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Session Progress</h3>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-green-100 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-700">{formatTime(timeSpent)}</div>
                                <div className="text-xs text-green-600">Time Spent</div>
                            </div>

                            <div className="bg-blue-100 p-3 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-700">{sessionNumber}</div>
                                <div className="text-xs text-blue-600">Session</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Comprehension Check & Activity</h3>

                        {!suggestedActivity ? (
                            <button
                                onClick={generateActivity}
                                disabled={isGeneratingActivity}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isGeneratingActivity ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Generating Activity...
                                    </>
                                ) : (
                                    <>
                                        <span>🎯</span>
                                        Generate Comprehension Activity
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <h4 className="font-medium text-green-800 mb-2">Suggested Activity:</h4>
                                    <p className="text-green-700 text-sm">{suggestedActivity}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-gray-700">Session Notes</h3>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Evaluate the student comprehension: <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => setComprehensionScore(rating)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${comprehensionScore === rating
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                            title={`${rating} - ${rating === 1 ? 'Not satisfactory' : rating === 5 ? 'Very well' : 'Somewhat useful'}`}
                                        >
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    1 = Not satisfactory, 5 = Very well
                                </p>
                                {comprehensionScore && (
                                    <p className="text-sm text-purple-600 p-3 mt-2 font-medium">
                                        Selected: {comprehensionScore}/5 - {comprehensionScore === 1 ? 'Not satisfactory' : comprehensionScore === 2 ? 'Somewhat satisfactory' : comprehensionScore === 3 ? 'Satisfactory' : comprehensionScore === 4 ? 'Good' : 'Very well'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <textarea
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Add observations about engagement, understanding, or behavioral responses during this session..."
                            className="w-full h-32 mt-3 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleSaveSession}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                            Save Session
                        </button>
                    </div>
                </div>
            </div>

            {isImageExpanded && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setIsImageExpanded(false)}
                            className="absolute top-4 right-4 z-10 p-2 w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 hover:scale-110"
                            title="Close"
                        >
                            <span className="text-lg">×</span>
                        </button>

                        <img
                            src={story.visualScenes[currentSceneIndex]?.image}
                            alt={`Scene ${currentSceneIndex + 1}`}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onError={(e) => {
                                e.target.src = "https://via.placeholder.com/800x600/E5E7EB/6B7280?text=Image+Not+Available";
                            }}
                        />

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-white bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-lg">
                            <button
                                onClick={() => handleSceneNavigation(Math.max(0, currentSceneIndex - 1))}
                                disabled={currentSceneIndex === 0 || isReading}
                                className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                title="Previous scene"
                            >
                                <span className="text-sm font-bold">‹</span>
                            </button>

                            <div className="flex gap-2">
                                {story.visualScenes.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentSceneIndex
                                            ? 'bg-purple-600'
                                            : index < currentSceneIndex
                                                ? 'bg-purple-300'
                                                : 'bg-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => handleSceneNavigation(Math.min(story.visualScenes.length - 1, currentSceneIndex + 1))}
                                disabled={currentSceneIndex === story.visualScenes.length - 1 || isReading}
                                className="w-8 h-8 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 flex items-center justify-center"
                                title="Next scene"
                            >
                                <span className="text-sm font-bold">›</span>
                            </button>
                        </div>

                        {isReading && (
                            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full flex items-center gap-2">
                                <span className="text-sm">Reading...</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showBehavioralSurveyPopup && (
                <BehavioralSurveyPopup
                    student={studentData || { name: 'Student', currentBehavioralScore: 'N/A' }}
                    onClose={() => setShowBehavioralSurveyPopup(false)}
                    onSaveScore={handleSaveBehavioralScore}
                />
            )}
        </div>
    );
}