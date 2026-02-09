'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Globe, Share2, Book, Calendar, Eye, User, Play, Plus, Printer, MoreVertical, MoreHorizontal, Edit3, Star, ArrowRight } from 'lucide-react';
import BehavioralSurveyInline from '@/components/BehavioralSurveyInline';

export default function PersonalizedStoryReader() {
    const { id } = useParams();
    const { data: session } = useSession();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fixedVoices = [
        { id: 'Ivy', name: 'Ivy (English, child)' },
        { id: 'Justin', name: 'Justin (English, child)' },
        { id: 'Hala', name: 'Hala (English, Arabic - Gulf)' },
        { id: 'Zayd', name: 'Zayd (English, Arabic - Gulf)' },
        // { id: 'Farah', name: 'Farah (Arabic - Egypt)' },
        { id: 'Youssef', name: 'Youssef (English, Arabic - Egypt)' },
        { id: 'Alia', name: 'Alia (English, Arabic - Egypt)' },
        // { id: 'Ali', name: 'Ali (Arabic - Gulf)' }
    ];
    const [selectedVoiceId, setSelectedVoiceId] = useState();
    const speedOptions = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
    const [readerSpeed, setReaderSpeed] = useState(0.85);

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
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activityRating, setActivityRating] = useState(0);
    const [activityFeedback, setActivityFeedback] = useState('');
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [savedActivities, setSavedActivities] = useState([]);
    const [selectedSavedActivity, setSelectedSavedActivity] = useState(null);
    const [showBehavioralSurvey, setShowBehavioralSurvey] = useState(false);

    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const readingLanguageRef = useRef(null);
    const router = useRouter();
    const menuRef = useRef(null);
    const [language, setLanguage] = useState('en');

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

    const handleLanguageToggle = () => {
        // Stop reading if active to allow language change to take effect
        if (isReading) {
            handleStopReading();
        }
        setLanguage(language === 'ar' ? 'en' : 'ar');
    };

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
                // Reset reading language ref when completely stopping (not pausing)
                readingLanguageRef.current = null;
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
        // Load saved activities when story loads
        if (story?.savedActivities && story.savedActivities.length > 0) {
            setSavedActivities(story.savedActivities);
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

    // Helper function to determine if survey should be shown
    const shouldShowBehavioralSurvey = (sessionCount) => {
        // Show for all sessions
        return true;
    };

    const fetchStudentData = async (studentId) => {
        console.log('studentId: ', studentId);
        try {
            const res = await fetch(`/api/students/${studentId}`);
            if (res.ok) {
                const data = await res.json();
                setStudentData(data.student);
                // Behavioral survey will be shown inline based on shouldShowBehavioralSurvey
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
            // Use ElevenLabs for Egyptian voices, Polly for others
            const isElevenLabsVoice = selectedVoiceId === 'Youssef' || selectedVoiceId === 'Alia';
            const isArabicVoice = selectedVoiceId === 'Hala' || selectedVoiceId === 'Zayd' || selectedVoiceId === 'Youssef' || selectedVoiceId === 'Alia';
            const apiEndpoint = isElevenLabsVoice ? '/api/generate-speech-elevenlabs' : '/api/generate-speech-polly';

            // Explicitly decide whether content is Arabic (by language or Arabic voice selection)
            const isArabic = (language === 'ar' && hasArabicText) || isArabicVoice;

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId: selectedVoiceId, isArabic, speed: readerSpeed }),
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
                        const nextIndex = sceneIndexToUpdate + 1;
                        const nextText = getSceneTextByIndex(nextIndex);
                        fetchAndPlayAudio(nextText, nextIndex);
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
                        <div style="width: 100%; text-align: center; margin: 15px 0;">
                          <img src="${scene.image}" style="
                            max-width: 60%;
                            height: auto;
                            display: block;
                            margin: 0 auto;
                            border-radius: 6px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                          " />
                        </div>
                      ` : ''}
                      <div style="
                        font-size: 20px; 
                        line-height: 1.7; 
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
                        font-size: 20px; 
                        line-height: 1.7; 
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

        // Lock reading language at start so it remains consistent across scenes
        readingLanguageRef.current = language;

        let textToPlay = '';
        let initialSceneIndex = 0;

        if (story?.visualScenes?.length > 0) {
            // Use per-scene text based on current language
            textToPlay = getSceneTextByIndex(currentSceneIndex);
            initialSceneIndex = currentSceneIndex;
        } else if (story?.generatedText) {
            textToPlay = language === 'ar' && hasArabicText
                ? (story.story_content_arabic)
                : (story.generatedText || story.story_content);
        } else if (story?.story_content) {
            textToPlay = language === 'ar' && hasArabicText
                ? (story.story_content_arabic)
                : story.story_content;
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
                // Start from scene 0 in the selected language
                textToPlay = getSceneTextByIndex(0);
            } else if (story?.generatedText) {
                textToPlay = language === 'ar' && hasArabicText
                    ? (story.story_content_arabic)
                    : (story.generatedText || story.story_content);
            } else if (story?.story_content) {
                textToPlay = language === 'ar' && hasArabicText
                    ? (story.story_content_arabic)
                    : story.story_content;
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
            // Get previous feedback from story
            const previousFeedback = story.activityFeedback || [];

            const res = await fetch('/api/generate-activity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: story.student?.name || 'Student',
                    comprehension_level: story.student?.comprehensionLevel || 'not specified',
                    story_title: story.title,
                    story_content: story.generatedText || story.story_content || story.visualScenes?.[currentSceneIndex]?.text || '',
                    story_goal: story.goal || '',
                    diagnosis: story.student?.diagnosis || 'not specified',
                    learning_preferences: story.student?.learningPreferences || 'not specified',
                    challenges: story.student?.challenges || 'not specified',
                    additional_notes: story.student?.notes || 'not specified',
                    interests: story.student?.interests || 'not specified',
                    previous_feedback: previousFeedback
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to generate activity: ${res.statusText}`);
            }

            const data = await res.json();
            setSuggestedActivity(data.activity);
            setActivityRating(0);
            setActivityFeedback('');
            setShowFeedbackInput(false);
            setSelectedSavedActivity(null);
            setActivityCompleted(false);
            setActivityUsefulness(null);
        } catch (err) {
            console.error("Error generating activity:", err);
            setError(`Failed to generate activity: ${err.message}`);
        } finally {
            setIsGeneratingActivity(false);
        }
    };

    const handleActivityRating = async (rating) => {
        if (!suggestedActivity || !story) return;

        setActivityRating(rating);

        // If rating < 3, show feedback input
        if (rating < 3) {
            setShowFeedbackInput(true);
        } else {
            // If rating >= 3, save immediately
            await saveActivityRating(rating, null);
        }
    };

    const saveActivityRating = async (rating, feedback) => {
        if (!story || !id) return;

        try {
            const res = await fetch(`/api/stories/${id}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    activity: suggestedActivity,
                    rating: rating,
                    feedback: feedback || null
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Failed to save activity rating: ${res.statusText}`);
            }

            const data = await res.json();
            setStory(data.story);

            // Update saved activities if rating >= 3
            if (rating >= 3 && data.story.savedActivities) {
                setSavedActivities(data.story.savedActivities);
            }

            // Reset state
            if (rating >= 3) {
                setSuggestedActivity('');
                setActivityRating(0);
                setShowFeedbackInput(false);
                setActivityFeedback('');
            }

            alert('Activity rating saved successfully!');
        } catch (err) {
            console.error('Error saving activity rating:', err);
            alert('Failed to save activity rating. Please try again.');
        }
    };

    const handleSubmitFeedback = async () => {
        if (!activityFeedback.trim()) {
            alert('Please provide feedback before submitting.');
            return;
        }

        await saveActivityRating(activityRating, activityFeedback);
    };

    const useSavedActivity = (activity) => {
        setSelectedSavedActivity(activity);
        setSuggestedActivity(activity.activity);
        setActivityRating(0);
        setActivityFeedback('');
        setShowFeedbackInput(false);
    };

    const resetSessionState = () => {
        setSessionNotes('');
        setTimeSpent(0);
        setQuestionsAnswered(0);
        setSuggestedActivity('');
        setActivityCompleted(false);
        setActivityUsefulness(null);
        setComprehensionScore(null);
        setActivityRating(0);
        setActivityFeedback('');
        setShowFeedbackInput(false);
        setSelectedSavedActivity(null);
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

            alert('Behavioral score updated successfully!');
        } catch (error) {
            console.error('Error updating behavioral score:', error);
            alert('Failed to update behavioral score. Please try again.');
        }
    };

    const handleSaveSession = async () => {
        if (!story || !id) return;

        // Validate session notes is required
        if (!sessionNotes || !sessionNotes.trim()) {
            alert('Please add session notes before saving the session.');
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

            const newSessionCount = updatedStoryResponse.story?.sessions?.length || 0;
            setSessionNumber(newSessionCount + 1);
            resetSessionState();

            alert('Session saved successfully!');

            // Behavioral survey will be shown inline based on shouldShowBehavioralSurvey
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
    const hasArabicText = !!story.story_content_arabic;
    const hasEnglishLongText = !!story.story_content; // gate for Arabic voices and toggle visibility

    // For visual stories, align Arabic long text to scenes by splitting on blank lines
    const arabicScenes = hasArabicText
        ? story.story_content_arabic.split('\n\n').filter((s) => s.trim())
        : [];

    const getSceneTextByIndex = (index) => {
        if (!isVisualStory) return '';
        // Use readingLanguageRef only when actively reading, otherwise use current language state
        const lang = isReading ? (readingLanguageRef.current || language) : language;
        if (lang === 'ar' && hasArabicText) {
            return arabicScenes[index] || story.visualScenes[index]?.text || '';
        }
        return story.visualScenes[index]?.text || '';
    };

    const currentTextContent = isVisualStory
        ? getSceneTextByIndex(currentSceneIndex)
        : (language === 'ar' && hasArabicText
            ? story.story_content_arabic
            : (story.generatedText || story.story_content));
    const totalScenesForProgress = isVisualStory ? story.visualScenes.length : 1;
    const questionsTotal = isVisualStory ? story.visualScenes.length : 4;
    const isArabicDisplay = language === 'ar' && hasArabicText;

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

            <div className={`flex items-center gap-3 ${story?.goal ? '' : 'mb-6'}`}>
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
                            {/* Edit Story Option - Only show for non-system stories created by current user */}
                            {story.source !== 'system' && story.createdBy === session?.user?.id && (
                                <button
                                    onClick={() => {
                                        router.push(`/dashboard/social-stories/${story._id}/edit`);
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full px-4 py-2.5 text-sm text-gray-800 hover:bg-purple-50 transition-colors duration-150 text-left flex items-center gap-3"
                                >
                                    <Edit3 className="w-4 h-4 text-purple-600" />
                                    <span>Edit Story</span>
                                </button>
                            )}

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

            {story?.goal && (
                <div className="mb-6">
                    <p className="text-sm font-semibold text-purple-900 inline">Story Goal: </p>
                    <p className="text-sm text-purple-800 inline">{story.goal}</p>
                </div>
            )}
            <div className="flex items-center gap-3 mb-6">
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
                        {(
                            (language === 'ar' && hasArabicText)
                                ? fixedVoices.filter(v => v.id !== 'Ivy' && v.id !== 'Justin')
                                : fixedVoices
                        ).map((voice) => (
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

                {/* Reader speed selector */}
                <div className="relative w-full max-w-[160px]">
                    <select
                        value={readerSpeed}
                        onChange={(e) => {
                            setReaderSpeed(parseFloat(e.target.value));
                            handleStopReading();
                        }}
                        disabled={isReading || ((language === 'ar' && hasArabicText) && !(selectedVoiceId === 'Hala' || selectedVoiceId === 'Zayd'))}
                        className={`
      w-full px-4 py-2.5 pr-10 
      border border-gray-300 rounded-lg 
      bg-white text-gray-800
      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent
      transition-all duration-200
      appearance-none
      ${isReading || ((language === 'ar' && hasArabicText) && !(selectedVoiceId === 'Hala' || selectedVoiceId === 'Zayd')) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}
    `}
                    >
                        {speedOptions.map((s) => (
                            <option key={s} value={s}>{`Speed: ${s}`}</option>
                        ))}
                    </select>

                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                            className={`w-5 h-5 text-gray-400 ${isReading || ((language === 'ar' && hasArabicText) && !(selectedVoiceId === 'Hala' || selectedVoiceId === 'Zayd')) ? 'opacity-70' : ''}`}
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
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-purple-700">
                                        Scene {currentSceneIndex + 1}
                                    </h3>
                                    {hasEnglishLongText && (
                                        <button
                                            onClick={handleLanguageToggle}
                                            disabled={!hasArabicText || isReading}
                                            className={`px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium ${hasArabicText && !isReading
                                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Globe className="w-4 h-4 text-purple-500" />
                                            <span>{language === 'ar' ? 'Arabic' : 'English'}</span>
                                        </button>
                                    )}
                                </div>
                                <p className={`text-gray-800 leading-relaxed ${isArabicDisplay ? 'text-right' : ''}`} dir={isArabicDisplay ? 'rtl' : 'ltr'}>
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
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-purple-700">Story Content</h3>
                                    {hasEnglishLongText && (
                                        <button
                                            onClick={handleLanguageToggle}
                                            disabled={!hasArabicText || isReading}
                                            className={`px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium ${hasArabicText && !isReading
                                                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Globe className="w-4 h-4 text-purple-500" />
                                            <span>{language === 'ar' ? 'Arabic' : 'English'}</span>
                                        </button>
                                    )}
                                </div>
                                <p className={`text-gray-800 leading-relaxed whitespace-pre-line ${isArabicDisplay ? 'text-right' : ''}`} dir={isArabicDisplay ? 'rtl' : 'ltr'}>{currentTextContent}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            Reading Session with{' '}
                            {story?.isPersonalized && studentData ? (
                                <button
                                    onClick={() => router.push(`/dashboard/students/${studentData._id}`)}
                                    className="text-purple-600 hover:text-purple-800 underline font-semibold transition-colors"
                                >
                                    {studentData.name}
                                </button>
                            ) : (
                                <span>Student</span>
                            )}
                        </h3>
                        

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

                        {/* Story goal */}
                        {/* {story?.goal && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                                <p className="text-sm font-semibold text-purple-900 inline">Story Goal: </p>
                                <p className="text-sm text-purple-800 inline">{story.goal}</p>
                            </div>
                        )} */}

                        {/* Behavioral Survey */}
                        {story?.isPersonalized && studentData && (
                            <button
                                type="button"
                                onClick={() => setShowBehavioralSurvey(true)}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                            >
                                Take Behavioral Change Survey
                            </button>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Comprehension Check Activity</h3>

                        {/* Display saved activities if available */}
                        {savedActivities.length > 0 && !suggestedActivity && (
                            <div className="mb-4 space-y-2">
                                <p className="text-sm font-medium text-gray-600">Previously Saved Activities:</p>
                                {savedActivities.map((savedActivity, idx) => (
                                    <div key={idx} className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <p className="text-sm text-blue-800">{savedActivity.activity}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= savedActivity.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t border-gray-200">
                                    <button
                                        onClick={generateActivity}
                                        disabled={isGeneratingActivity}
                                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                        >
                                        {isGeneratingActivity ? (
                                            <>
                                                <span className="animate-spin">⏳</span>
                                                Generating New Activity...
                                            </>
                                        ) : (
                                            <>
                                                <span>🎯</span>
                                                Generate New Activity
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Generate activity button when no saved activities */}
                        {savedActivities.length === 0 && !suggestedActivity && (
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
                        )}

                        {/* Display suggested activity with rating */}
                        {suggestedActivity && (
                            <div className="space-y-4">
                                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                    <h4 className="font-medium text-green-800 mb-2">Suggested Activity:</h4>
                                    <p className="text-green-700 text-sm">{suggestedActivity}</p>
                                    {selectedSavedActivity && (
                                        <p className="text-xs text-green-600 mt-1 italic">(From saved activities)</p>
                                    )}
                                </div>

                                {/* Star Rating */}
                                {activityRating === 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rate this activity:
                                        </label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleActivityRating(star)}
                                                    className="focus:outline-none transition-transform hover:scale-110"
                                                >
                                                    <Star className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Show rating after selection */}
                                {activityRating > 0 && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">Your Rating:</p>
                                        <div className="flex gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-6 h-6 ${star <= activityRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Feedback input for low ratings */}
                                {showFeedbackInput && activityRating < 3 && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Please provide feedback to help improve future activities:
                                        </label>
                                        <textarea
                                            value={activityFeedback}
                                            onChange={(e) => setActivityFeedback(e.target.value)}
                                            placeholder="What could be improved about this activity?"
                                            className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                        />
                                        <button
                                            onClick={handleSubmitFeedback}
                                            disabled={!activityFeedback.trim()}
                                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                        >
                                            Submit Feedback
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {story?.isPersonalized && (
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-700">Session Notes<span className="text-red-500">*</span></h3>
                            </div>

                            <textarea
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                                placeholder="Add observations about engagement, understanding, or behavioral responses during this session... (Required)"
                                required
                                className="w-full h-32 mt-3 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleSaveSession}
                                disabled={!sessionNotes || !sessionNotes.trim()}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Save Session
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showBehavioralSurvey && story?.isPersonalized && studentData && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3">
                            <h3 className="text-lg font-semibold text-gray-800 px-4 pt-2">
                                Behavioral Change Survey for {studentData?.name || 'Student'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowBehavioralSurvey(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
                                aria-label="Close survey"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-8 pt-2">
                            <BehavioralSurveyInline
                                student={studentData}
                                onSaveScore={async (score) => {
                                    await handleSaveBehavioralScore(score);
                                    setShowBehavioralSurvey(false);
                                }}
                                storyGoal={story?.goal}
                            />
                        </div>
                    </div>
                </div>
            )}

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

        </div>
    );
}