'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BeatLoader } from 'react-spinners';
import Image from 'next/image';
import { BookOpen, Image as ImageIcon, Eye, Globe, Loader2 } from 'lucide-react';

export default function PersonalizeStoryPage() {
    const { id: storyId } = useParams();
    const router = useRouter();

    const [originalStory, setOriginalStory] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [personalizationNotes, setPersonalizationNotes] = useState('');
    const [storyGoal, setStoryGoal] = useState('');

    const [personalizedText, setPersonalizedText] = useState('');
    const [visualScenes, setVisualScenes] = useState([]);
    const [personalizedTextArabic, setPersonalizedTextArabic] = useState('');
    const [language, setLanguage] = useState('en');
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [modalInstructions, setModalInstructions] = useState('');
    const [regeneratingScene, setRegeneratingScene] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedScene, setSelectedScene] = useState(0);
    const [isTranslating, setIsTranslating] = useState(false);
    const [storyEvaluation, setStoryEvaluation] = useState(null);
    const [isEvaluating, setIsEvaluating] = useState(false);

    function Stepper({ currentStep }) {
        const steps = [
            {
                number: 1,
                title: "Generate Text",
                icon: BookOpen,
                active: currentStep === 1,
                complete: currentStep > 1
            },
            {
                number: 2,
                title: "Generate Visuals",
                icon: ImageIcon,
                active: currentStep === 2,
                complete: currentStep > 2
            },
            {
                number: 3,
                title: "Review Story",
                icon: Eye,
                active: currentStep === 3,
                complete: currentStep > 3
            }
        ];

        return (
            <div className="flex justify-center mb-8 gap-8">
                {steps.map((step) => (
                    <div key={step.number} className="flex flex-col items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                    ${step.complete ? 'bg-purple-600' : step.active ? 'bg-purple-600' : 'bg-gray-400'}`}
                        >
                            <step.icon className="w-5 h-5" />
                        </div>
                        <p className={`text-sm mt-2  ${step.complete || step.active ? 'text-purple-700 font-semibold' : 'text-gray-600'}`}>
                            {step.title}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const storyRes = await fetch(`/api/stories/${storyId}`);
                if (!storyRes.ok) throw new Error('Failed to fetch original story');
                const storyData = await storyRes.json();
                setOriginalStory(storyData);

                const studentsRes = await fetch('/api/students/my-students');
                if (!studentsRes.ok) throw new Error('Failed to fetch students');
                const studentsData = await studentsRes.json();

                if (studentsData && Array.isArray(studentsData.students)) {
                    setStudents(studentsData.students);
                } else {
                    console.error("API response for students is not in the expected format (missing 'students' array):", studentsData);
                    setError("Received invalid student data from server.");
                    setStudents([]);
                }

            } catch (err) {
                console.error("Error fetching initial data:", err);
                setError(err.message || "Failed to load initial data.");
            } finally {
                setIsLoading(false);
            }
        };

        if (storyId) {
            fetchData();
        }
    }, [storyId]);

    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        const student = students.find(s => s._id === studentId);
        if (student && student.image) {
            console.log(`Student image URL: ${student.image}`);
        } else if (student) {
            console.log(`Student ${student.name} has no image URL.`);
        }
        setSelectedStudent(student || null);
    };

    // --- New Handler for editing personalized text ---
    const handlePersonalizedTextChange = (e) => {
        setPersonalizedText(e.target.value);
        // Clear evaluation when text is edited (user might want to re-evaluate)
        if (storyEvaluation) {
            setStoryEvaluation(null);
        }
    };

    const evaluateStoryQuality = async (storyText) => {
        setIsEvaluating(true);
        try {
            const response = await fetch('/api/stories/evaluate-quality-personalized', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storyText: storyText || personalizedText,
                    storyTitle: originalStory?.title || 'Personalized Story',
                    description: `Personalized for ${selectedStudent?.name || 'student'}. ${personalizationNotes || ''}`,
                    category: originalStory?.category || 'Not specified',
                    ageGroup: selectedStudent?.ageGroup || originalStory?.ageGroup || 'Not specified',
                    storyLength: selectedStudent?.preferredStoryLength || originalStory?.storyLength || 'Not specified',
                    storyGoal: storyGoal || 'Not specified',
                    studentName: selectedStudent?.name || 'Not specified',
                    studentAge: selectedStudent?.age || 'Not specified',
                    diagnosis: selectedStudent?.diagnosis || 'Not specified',
                    comprehensionLevel: selectedStudent?.comprehensionLevel || 'Not specified',
                    preferredSentenceLength: selectedStudent?.preferredSentenceLength || 'Not specified',
                    preferredStoryLength: selectedStudent?.preferredStoryLength || 'Not specified',
                    learningPreferences: selectedStudent?.learningPreferences || 'Not specified',
                    challenges: selectedStudent?.challenges || 'Not specified',
                    additionalNotes: personalizationNotes || 'Not specified',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setStoryEvaluation(data.evaluation);
            } else {
                console.warn('Failed to evaluate story quality');
                setStoryEvaluation(null);
            }
        } catch (err) {
            console.error('Error evaluating story quality:', err);
            setStoryEvaluation(null);
        } finally {
            setIsEvaluating(false);
        }
    };

    // Function to regenerate Arabic translation when English text changes
    const regenerateArabicTranslation = async (englishText) => {
        if (!englishText.trim()) return;
        
        setIsTranslating(true);
        try {
            const translationResponse = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: englishText,
                    targetLanguage: 'arabic'
                })
            });

            if (translationResponse.ok) {
                const translationData = await translationResponse.json();
                setPersonalizedTextArabic(translationData.translatedText);
                console.log('✅ Arabic translation regenerated');
            } else {
                console.warn('⚠️ Failed to regenerate Arabic translation');
            }
        } catch (error) {
            console.error('❌ Error regenerating Arabic translation:', error);
        } finally {
            setIsTranslating(false);
        }
    };

    const handlePersonalizeText = async () => {
        if (!selectedStudent || !originalStory) {
            setError("Please select a student and ensure the original story is loaded.");
            return;
        }

        if (!storyGoal.trim()) {
            setError("Please enter a goal for this story before customizing the text.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/personalize-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent._id,
                    studentName: selectedStudent.name,
                    age: selectedStudent.age,
                    diagnosis: selectedStudent.diagnosis,
                    guardian: selectedStudent.guardian,
                    comprehensionLevel: selectedStudent.comprehensionLevel,
                    preferredStoryLength: selectedStudent.preferredStoryLength,
                    preferredSentenceLength: selectedStudent.preferredSentenceLength,
                    learningPreferences: selectedStudent.learningPreferences,
                    interests: selectedStudent.interests,
                    challenges: selectedStudent.challenges,
                    originalStoryText: originalStory.story_content,
                    originalStoryTitle: originalStory.title,
                    additionalNotes: personalizationNotes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to personalize text.');
            }

            const data = await response.json();

            setPersonalizedText(data.scenes);
            setPersonalizedTextArabic(data.scenesArabic || '');

            console.log("Received personalized text: ", data.personalizedText);

            // Evaluate personalized story quality after generation
            await evaluateStoryQuality(data.scenes);

            setCurrentStep(2);
        } catch (err) {
            console.error("Error personalizing text:", err);
            setError(err.message || "Failed to personalize text.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePersonalizeVisuals = async () => {
        if (!selectedStudent || !personalizedText) {
            setError("Please personalize the text first and select a student.");
            return;
        }

        setIsLoading(true);
        setError(null);

        // Split the story into scenes and create placeholder scenes immediately
        const scenes = personalizedText.split('\n\n').filter(s => s.trim());
        const placeholderScenes = scenes.map((sceneText, index) => ({
            id: index + 1,
            text: sceneText,
            image: null, // Will be updated when generated
            error: false,
            loading: true
        }));

        setVisualScenes(placeholderScenes);
        setCurrentStep(2.5); // Set to 2.5 for image generation

        try {
            // Start batch generation
            const response = await fetch('/api/stories/generate-scenes-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizedStoryText: personalizedText,
                    studentId: selectedStudent._id,
                    mainCharacterName: selectedStudent.name,
                    learningPreferences: selectedStudent.learningPreferences,
                    challenges: selectedStudent.challenges,
                    additionalNotes: personalizationNotes,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.includes('No cartoon image available')) {
                    throw new Error(`No cartoon image available for ${selectedStudent.name}. Please try again after some time.`);
                }
                throw new Error(errorData.error || 'Failed to start batch generation.');
            }

            const data = await response.json();
            const batchId = data.batchId;

            console.log(`🎨 [FRONTEND] Started batch generation with ID: ${batchId}`);

            // Poll for progress
            const pollProgress = async () => {
                try {
                    const progressResponse = await fetch(`/api/stories/generate-scenes-batch?batchId=${batchId}`);

                    if (!progressResponse.ok) {
                        throw new Error('Failed to check progress');
                    }

                    const progressData = await progressResponse.json();

                    // Update visual scenes with completed ones
                    const updatedScenes = progressData.scenes.map((scene, index) => ({
                        id: scene.id,
                        text: scene.text,
                        image: scene.completed ? scene.image : null,
                        error: scene.error,
                        loading: !scene.completed
                    }));

                    setVisualScenes(updatedScenes);

                    // Continue polling if not complete
                    if (!progressData.completed) {
                        setTimeout(pollProgress, 2000); // Poll every 2 seconds
                    } else {
                        console.log(`✅ Batch generation completed for ${selectedStudent.name}`);
                        
                        // Image generation completed - now translate to Arabic
                        console.log('🎨 Image generation completed, translating to Arabic...');
                        
                        try {
                            // Reconstruct the final English story text from the generated scenes
                            const finalEnglishText = updatedScenes
                                .map(scene => scene.text)
                                .join('\n\n');
                            
                            console.log('🔄 Translating final English story text to Arabic...');
                            
                            // Translate the complete final English story text to Arabic
                            const translationResponse = await fetch('/api/translate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    text: finalEnglishText,
                                    targetLanguage: 'arabic'
                                })
                            });

                            if (translationResponse.ok) {
                                const translationData = await translationResponse.json();
                                console.log('✅ Final English story translated to Arabic');
                                
                                // Update the Arabic text state
                                setPersonalizedTextArabic(translationData.translatedText);
                            } else {
                                console.warn('⚠️ Arabic translation failed, proceeding without it');
                            }
                            
                        } catch (translationError) {
                            console.error('❌ Arabic translation error:', translationError);
                        }
                        
                        setIsLoading(false);
                        setCurrentStep(3); // Move to final preview
                    }

                } catch (error) {
                    console.error('Error polling progress:', error);
                    setError('Failed to check generation progress');
                    setIsLoading(false);
                }
            };

            // Start polling
            pollProgress();

        } catch (err) {
            console.error("Error starting batch generation:", err);
            setError(err.message || "Failed to start batch generation.");
            // Reset to step 2 on error
            setCurrentStep(2);
            setVisualScenes([]);
            setIsLoading(false);
        }
    };

    const handleSavePersonalizedStory = async () => {
        if (!selectedStudent || !personalizedText) {
            setError("Cannot save: text or student missing.");
            return;
        }

        if (!storyGoal || !storyGoal.trim()) {
            setError("Please enter a goal for this story.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const storyTitle = originalStory?.title || 'Untitled';
            const storyDescription = originalStory?.description || '';

            const payload = {
                title: storyTitle,
                description: storyDescription,
                generatedText: personalizedText,
                generatedTextArabic: personalizedTextArabic,
                category: originalStory?.category,
                ageGroup: selectedStudent.ageGroup || originalStory?.ageGroup,
                storyLength: selectedStudent.preferredStoryLength || originalStory?.storyLength,
                specificScenarios: `Personalized for ${selectedStudent.name}. Notes: ${personalizationNotes}`,
                isPersonalized: true,
                student: selectedStudent._id,
                isGenerated: true,
                hasImages: visualScenes && visualScenes.length > 0,
                visualScenes: visualScenes,
                source: 'generated',
                visibility: 'private', // Default personalized stories to private
                goal: storyGoal.trim(), // Add goal to payload
            };

            const res = await fetch('/api/stories/save-personalized', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save personalized story.');
            }

            const data = await res.json();
            alert('Personalized story saved successfully!');
            router.push(`/dashboard/social-stories/${data.story._id}/read`);
        } catch (err) {
            console.error("Error saving personalized story:", err);
            setError(err.message || "Failed to save personalized story.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !originalStory && !students.length) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <BeatLoader color="#8B5CF6" />
            <p className="ml-3 text-gray-600">Loading data...</p>
        </div>
    );
    if (error) return (
        <div className="min-h-screen p-6 bg-gray-50 flex flex-col items-center justify-center">
            <p className="text-red-600 text-center mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Retry</button>
        </div>
    );
    if (!originalStory) return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
            <p className="text-gray-600">Original story not found.</p>
        </div>
    );

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="px-3 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-1 text-sm font-medium"
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

            <div className="flex justify-center">
                <h1 className="text-3xl font-bold text-purple-700 mb-6">Personalize a Story</h1>
            </div>

            <Stepper currentStep={currentStep} />

            {/* Main Content Area */}
            {currentStep === 2.5 ? (
                // Full-page image generation view
                <div className="bg-white p-8 rounded-lg shadow-md">

                    <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <p className="text-gray-600">ℹ️ Creating images for each scene. This may take a few minutes. Please wait and do not close the page...</p>
                        {/* Progress Bar */}
                        <div className="mt-6">
                            <div className="w-full bg-yellow-200 rounded-full h-3">
                                <div
                                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${Math.round((visualScenes.filter(s => s.image && !s.loading).length / visualScenes.length) * 100)}%`
                                    }}
                                ></div>
                            </div>
                            <p className="text-center text-yellow-800 text-lg mt-3 font-medium">
                                Scene {visualScenes.filter(s => s.image && !s.loading).length} of {visualScenes.length} is generating...
                            </p>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visualScenes.map((scene, index) => (
                            <div key={scene.id || index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                {scene.error ? (
                                    <div className="w-full h-48 bg-red-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-red-600 text-sm font-medium">Failed to generate</p>
                                            <p className="text-red-500 text-xs">Scene {scene.id}</p>
                                        </div>
                                    </div>
                                ) : scene.image && scene.image !== 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed' && !scene.loading ? (
                                    <Image
                                        src={scene.image}
                                        alt={`Scene ${scene.id || index + 1}`}
                                        width={400}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                        onError={(e) => { e.target.src = "https://placehold.co/400x400.png?text=Image+Not+Available"; e.target.alt = "Image Not Available"; }}
                                    />
                                ) : scene.loading ? (
                                    <div className="w-full h-48 bg-purple-100 flex items-center justify-center">
                                        <div className="text-center">
                                            <BeatLoader color="#8B5CF6" size={6} />
                                            <p className="text-purple-700 text-sm mt-2">Generating Scene {scene.id}...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-gray-600 text-sm font-medium">Waiting...</p>
                                        </div>
                                    </div>
                                )}
                                <div className="p-3">
                                    <p className="text-sm font-medium text-gray-700">{scene.text.substring(0, 100)}...</p>
                                    {scene.error && (
                                        <p className="text-xs text-red-500 mt-1">Generation failed</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : currentStep === 3 ? (
                // Step 3: Review Generated Visual Story - Two-column layout with thumbnails and detailed view
                <div className="bg-white p-8 rounded-lg shadow-md">
                  {/* Success Banner */}
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <span className="mr-3 text-2xl">✅</span>
                      <span className="text-green-800 font-medium">All scenes generated successfully! Your visual social story is ready for review.</span>
                    </div>
                  </div>
              
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Panel: Scene Navigation */}
                    <div className="lg:col-span-1 border-r pr-6">
                      <h3 className="text-lg font-semibold mb-4">Scene Navigation</h3>
                      <div className="flex flex-col gap-2">
                        {visualScenes.map((scene, index) => (
                          <button
                            key={scene.id || index}
                            onClick={() => setSelectedScene(index)}
                                        className={`block w-full text-left p-3 rounded-lg ${selectedScene === index
                                ? 'bg-purple-100 text-purple-800 font-semibold' 
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            Scene {index + 1}: {scene.text.substring(0, 40)}...
                          </button>
                        ))}
                      </div>
                    </div>
              
                    {/* Right Panel: Detailed Scene View */}
                    <div className="lg:col-span-2">
                      {selectedScene !== null && visualScenes[selectedScene] ? (
                        <div className="bg-white border rounded-lg p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                              Scene {selectedScene + 1}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {selectedScene + 1}/{visualScenes.length}
                            </span>
                          </div>
              
                          <div className="mb-4 relative">
                            {visualScenes[selectedScene].error ? (
                              <div className="w-full h-80 bg-red-50 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                  <p className="text-red-600 text-sm font-medium">Failed to generate</p>
                                  <p className="text-red-500 text-xs">Scene {visualScenes[selectedScene].id}</p>
                                </div>
                              </div>
                            ) : visualScenes[selectedScene].image && 
                               visualScenes[selectedScene].image !== 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed' ? (
                              <Image
                                src={visualScenes[selectedScene].image}
                                alt={`Scene ${visualScenes[selectedScene].id || selectedScene + 1}`}
                                width={600}
                                height={400}
                                className="w-full h-80 object-contain rounded-md bg-gray-100"
                                onError={(e) => { 
                                  e.target.src = "https://placehold.co/400x400.png?text=Image+Not+Available"; 
                                  e.target.alt = "Image Not Available"; 
                                }}
                              />
                            ) : (
                              <div className="w-full h-80 bg-gray-100 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                  <p className="text-gray-600 text-sm font-medium">No image available</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Regenerate Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalInstructions('');
                                setShowRegenerateModal(true);
                              }}
                              disabled={regeneratingScene === selectedScene}
                              className="absolute top-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md hover:shadow-lg border border-gray-200 hover:border-purple-200 transition-all duration-300 ease-in-out group disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden w-10 hover:w-32 px-2 hover:px-3 h-10"
                              title="Regenerate this scene"
                            >
                              {regeneratingScene === selectedScene ? (
                                <svg
                                  className="animate-spin h-5 w-5 text-purple-600 flex-shrink-0"
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
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-purple-600 group-hover:text-purple-700 flex-shrink-0 transition-colors duration-300"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                                </svg>
                              )}
              
                              {/* Text that appears on hover */}
                              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75 text-sm font-medium text-purple-700">
                                Regenerate
                              </span>
                            </button>
                          </div>
              
                          {/* Scene Text with Language Toggle - Now Editable for Both Languages */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-md font-semibold text-gray-800">Scene Text</h4>
                            </div>
                            
                            {/* Editable Text Areas for Both Languages */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* English Scene Text */}
                              <div>
                                <label htmlFor="sceneTextEn" className="block text-sm font-medium text-gray-700 mb-2">Scene Text (English)</label>
                                <textarea
                                  id="sceneTextEn"
                                  value={visualScenes[selectedScene].text}
                                  onChange={async (e) => {
                                    const updatedScenes = [...visualScenes];
                                    updatedScenes[selectedScene] = {
                                      ...updatedScenes[selectedScene],
                                      text: e.target.value
                                    };
                                    setVisualScenes(updatedScenes);
                                    
                                    // Also update the main personalizedText to keep in sync
                                    const scenesText = updatedScenes.map(scene => scene.text).join('\n\n');
                                    setPersonalizedText(scenesText);
                                    
                                    // Regenerate Arabic translation for the updated text
                                    await regenerateArabicTranslation(scenesText);
                                  }}
                                  rows="6"
                                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 resize-y focus:ring-purple-500 focus:border-purple-500"
                                ></textarea>
                              </div>
              
                              {/* Arabic Scene Text */}
                              <div>
                                <label htmlFor="sceneTextAr" className="block text-sm font-medium text-gray-700 mb-2">
                                  Scene Text (Arabic)
                                  {isTranslating && (
                                    <span className="ml-2 text-xs text-blue-600 flex items-center">
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      Translating...
                                    </span>
                                  )}
                                </label>
                                <textarea
                                  id="sceneTextAr"
                                  value={(personalizedTextArabic || '').split('\n\n')[selectedScene] || ''}
                                  onChange={(e) => {
                                    const currentArabic = personalizedTextArabic || '';
                                    const parts = currentArabic.split('\n\n');
                                    
                                    // Pad array to ensure index exists
                                    while (parts.length <= selectedScene) parts.push('');
                                    parts[selectedScene] = e.target.value;
                                    
                                    const joined = parts.join('\n\n');
                                    setPersonalizedTextArabic(joined);
                                  }}
                                  rows="6"
                                  className="w-full border border-gray-300 rounded-md shadow-sm p-2 resize-y focus:ring-purple-500 focus:border-purple-500"
                                  dir="rtl"
                                ></textarea>
                              </div>
                            </div>
              
                            <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mt-4">
                              <span className="mr-3 text-2xl">ℹ️</span>
                              <span className="text-gray-700 text-base">Review and edit both English and Arabic texts so they match per scene.</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <p>Select a scene to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
              
                  {/* Save Button - Aligned to Right */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSavePersonalizedStory}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      disabled={isLoading}
                    >
                      {isLoading ? <BeatLoader size={8} color="#fff" /> : "Approve & Save"}
                    </button>
                  </div>
                </div>
              ) : (
                // Regular two-column layout for other steps
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel: Student Selection & Personalization Controls (Step 1) */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Selection</h2>
                        <div className="mb-6">
                            <label htmlFor="student-select" className="block text-gray-700 text-sm font-medium mb-2">Choose Student:<span className="text-red-500">*</span></label>
                            <select
                                id="student-select"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                onChange={handleStudentChange}
                                value={selectedStudent?._id || ''}
                                disabled={isLoading || currentStep > 1}
                            >
                                <option value="">-- Select a Student --</option>
                                {Array.isArray(students) && students.map(student => (
                                    <option key={student._id} value={student._id}>
                                        {student.name} (Age: {student.age}, Comp. Level: {student.comprehensionLevel})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedStudent && (
                            <div className="bg-blue-50 border border-blue-400 rounded-lg p-4 flex items-center mb-6">
                                {selectedStudent.image ? (
                                    <img
                                        src={selectedStudent.image}
                                        alt={selectedStudent.name}
                                        className="w-20 h-20 rounded-full object-cover mr-4 border-2 border-blue-400"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-2xl font-bold mr-4">
                                        {selectedStudent.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-lg font-semibold text-blue-900">{selectedStudent.name}</p>
                                    <p className="text-sm text-blue-700">
                                        Age: {selectedStudent.age} • Comp. Level: {selectedStudent.comprehensionLevel}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                        <label htmlFor="student-select" className="block text-gray-700 text-sm font-medium mb-2">Enter Goal for this Story:<span className="text-red-500">*</span></label>
                            <textarea
                                id="story-goal"
                                rows="3"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={storyGoal}
                                onChange={(e) => setStoryGoal(e.target.value)}
                                placeholder="e.g., 'Practice sharing toys with peers' or 'Learn to raise hand before speaking during class'"
                                disabled={isLoading || currentStep > 1}
                                required
                            ></textarea>
                        </div>

                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Story Text Customization</h2>
                        <p className="text-gray-600 mb-4">
                            The AI will adapt the story based on the student's profile. You can add more specific notes here.
                        </p>
                        <div className="mb-6">
                            <label htmlFor="personalization-notes" className="block text-gray-700 text-sm font-medium mb-2">Additional Personalization Notes (optional):</label>
                            <textarea
                                id="personalization-notes"
                                rows="4"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={personalizationNotes}
                                onChange={(e) => setPersonalizationNotes(e.target.value)}
                                placeholder="e.g., 'Make the main character love dinosaurs,' or 'Focus on emotion regulation.'"
                                disabled={isLoading || currentStep > 1}
                            ></textarea>
                        </div>

                        <button
                            onClick={handlePersonalizeText}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading || !selectedStudent || !originalStory || !storyGoal.trim()}
                        >
                            {isLoading && currentStep === 1 ? (
                                <BeatLoader size={8} color="#fff" />
                            ) : personalizedText ? (
                                "Regenerate Text"
                            ) : (
                                "Customize Text"
                            )}
                        </button>
                        {currentStep > 1 && (
                            <p className="mt-4 text-green-600 text-center">Text customized! Proceed to Step 2.</p>
                        )}
                    </div>

                    {/* Right Panel: Story Previews (Original, Customized Text, Visuals) */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        {(!personalizedText && currentStep === 1) && (
                            <>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Original Story</h2>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 max-h-100 overflow-y-auto">
                                    <p className="font-semibold text-purple-700 mb-2">{originalStory?.title}</p>
                                    <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{originalStory?.story_content}</p>
                                </div>
                            </>
                        )}

                        {/* Customized Story Text Section - Now Editable */}
                        {personalizedText && currentStep >= 2 && (
                            <>
                                <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mb-4">
                                    <span className="mr-3 text-2xl">ℹ️</span>
                                    <span className="text-gray-700 text-base">Please review the personalized story text before proceeding. <span className="font-medium">Click the text to edit.</span></span>
                                </div>
                            
                                
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold text-gray-800">Customized Story Text</h2>
                                    <button
                                        type="button"
                                        onClick={() => setLanguage(prev => (prev === 'en' ? 'ar' : 'en'))}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm transition-colors duration-200"
                                        aria-label={`Switch language to ${language === 'en' ? 'Arabic' : 'English'}`}
                                    >
                                        <Globe className="w-4 h-4 text-purple-500" />
                                        {language === 'en' ? 'English' : 'Arabic'}
                                    </button>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6 max-h-100 overflow-y-auto">
                                    <p className="font-semibold text-purple-700 mb-2">Personalized for {selectedStudent?.name || 'Student'}</p>
                                    <textarea
                                        className="w-full h-96 p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 resize-y"
                                        value={language === 'en' ? (personalizedText || '') : (personalizedTextArabic || '')}
                                        onChange={(e) => {
                                            if (language === 'en') {
                                                handlePersonalizedTextChange(e);
                                            } else {
                                                setPersonalizedTextArabic(e.target.value);
                                            }
                                        }}
                                        rows="8"
                                        disabled={isLoading || currentStep > 2}
                                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                                    />
                                </div>

                                 {/* Story Quality Evaluation */}
                                 {isEvaluating && (
                                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <span className="text-blue-800 font-medium">Evaluating story quality...</span>
                                        </div>
                                    </div>
                                )}
                                
                                {storyEvaluation && !isEvaluating && (
                                    <div className="mb-6 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">Story Quality Evaluation</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    storyEvaluation.overallScore >= 4 ? 'bg-green-100 text-green-800' :
                                                    storyEvaluation.overallScore >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    Overall: {storyEvaluation.overallScore}/5
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Score Breakdown */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                            {Object.entries(storyEvaluation.scores || {}).map(([key, value]) => (
                                                <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-600 mb-1 capitalize">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full ${
                                                                    value >= 4 ? 'bg-green-500' :
                                                                    value >= 3 ? 'bg-yellow-500' :
                                                                    'bg-red-500'
                                                                }`}
                                                                style={{ width: `${(value / 5) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700">{value}/5</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Summary */}
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-700 leading-relaxed">{storyEvaluation.summary}</p>
                                        </div>
                                        
                                        {/* Strengths */}
                                        {storyEvaluation.strengths && storyEvaluation.strengths.length > 0 && (
                                            <div className="mb-3">
                                                <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Strengths:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                    {storyEvaluation.strengths.map((strength, idx) => (
                                                        <li key={idx}>{strength}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* Weaknesses */}
                                        {storyEvaluation.weaknesses && storyEvaluation.weaknesses.length > 0 && (
                                            <div className="mb-3">
                                                <h4 className="text-sm font-semibold text-orange-700 mb-2">⚠ Areas for Improvement:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                    {storyEvaluation.weaknesses.map((weakness, idx) => (
                                                        <li key={idx}>{weakness}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        
                                        {/* Suggestions */}
                                        {storyEvaluation.suggestions && storyEvaluation.suggestions.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-blue-700 mb-2">💡 Suggestions:</h4>
                                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                                    {storyEvaluation.suggestions.map((suggestion, idx) => (
                                                        <li key={idx}>{suggestion}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                        


                                {/* Action Buttons */}
                                <div className="flex gap-3 mb-4">
                                    <button
                                        onClick={() => evaluateStoryQuality(personalizedText)}
                                        disabled={isEvaluating || !personalizedText.trim()}
                                        className="flex-1 px-4 py-2 bg-purple-200 text-purple-800 rounded-lg hover:bg-purple-300 disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isEvaluating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Evaluating...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Re-evaluate Quality
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Generate Visuals Button (Step 2 Actions) */}
                                <button
                                    onClick={handlePersonalizeVisuals}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                    disabled={isLoading || currentStep > 2}
                                >
                                    {isLoading && currentStep === 2 ? (
                                        <div className="flex items-center justify-center">
                                            <BeatLoader size={8} color="#fff" />
                                            <span className="ml-2">Generating visuals...</span>
                                        </div>
                                    ) : "Generate Visuals"}
                                </button>
                                {isLoading && currentStep === 2 && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-blue-700 text-sm text-center">
                                            🎨 Generating visual scenes in parallel (2 at a time)...<br />
                                            <span className="text-xs">You'll see images appear as they're generated</span>
                                        </p>
                                    </div>
                                )}
                                {currentStep > 2 && !isLoading && (
                                    <p className="mt-4 text-green-600 text-center">✅ Visuals generated! Proceed to Step 3.</p>
                                )}
                            </>
                        )}
                        {isLoading && (
                            <div className="text-center mt-6">
                                <BeatLoader color="#8B5CF6" size={10} />
                                <p className="mt-2 text-gray-600">Processing...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Regenerate Modal */}
            {showRegenerateModal && selectedScene !== null && visualScenes[selectedScene] && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50"></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-xl mx-4 p-5">
                        <h4 className="text-lg font-semibold mb-3">Regenerate Scene {selectedScene + 1}</h4>
                        <div className="mb-4">
                            <img
                                src={visualScenes[selectedScene]?.image}
                                alt={`Current Scene ${selectedScene + 1}`}
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
                            disabled={regeneratingScene === selectedScene}
                        ></textarea>
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowRegenerateModal(false)}
                                disabled={regeneratingScene === selectedScene}
                                className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setRegeneratingScene(selectedScene);
                                    try {
                                        const res = await fetch('/api/stories/regenerate-scene', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                sceneText: (language === 'ar' && (personalizedTextArabic || '').split('\n\n')[selectedScene]) ? (personalizedTextArabic || '').split('\n\n')[selectedScene] : visualScenes[selectedScene].text,
                                                // For personalize page: prefer student's image as main character reference
                                                mainCharacterImage: selectedStudent?.cartoonImage || visualScenes[selectedScene]?.image || '',
                                                studentImage: selectedStudent?.cartoonImage || '',
                                                mainCharacterName: selectedStudent?.name || originalStory?.title || 'Main Character',
                                                instructions: modalInstructions,
                                                currentImageUrl: visualScenes[selectedScene]?.image,
                                            }),
                                        });
                                        if (!res.ok) throw new Error('Failed to regenerate');
                                        const data = await res.json();
                                        setPreviewImage({ newImageUrl: data.imageUrl, currentImageUrl: visualScenes[selectedScene]?.image, sceneIndex: selectedScene, instructions: modalInstructions });
                                        setShowPreviewModal(true);
                                        setShowRegenerateModal(false);
                                    } catch (e) {
                                        console.error('Regenerate failed', e);
                                    } finally {
                                        setRegeneratingScene(null);
                                    }
                                }}
                                disabled={regeneratingScene === selectedScene}
                                className="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                            >
                                {regeneratingScene === selectedScene ? 'Generating Preview…' : 'Generate Preview'}
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
                            <div>
                                <h5 className="text-lg font-medium mb-3 text-gray-700">Current Scene</h5>
                                <img src={previewImage.currentImageUrl} alt="Current Scene" className="w-full h-64 object-contain rounded-md bg-gray-100 border" />
                            </div>
                            <div>
                                <h5 className="text-lg font-medium mb-3 text-green-700">New Scene Preview</h5>
                                <img src={previewImage.newImageUrl} alt="New Scene Preview" className="w-full h-64 object-contain rounded-md bg-gray-100 border border-green-300" />
                            </div>
                        </div>
                        {previewImage.instructions && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h6 className="font-medium text-blue-900 mb-2">Applied Instructions:</h6>
                                <p className="text-blue-800">{previewImage.instructions}</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowPreviewModal(false); setPreviewImage(null); }}
                                className="px-4 py-2 text-sm rounded-md border hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!previewImage) return;
                                    const { newImageUrl, sceneIndex } = previewImage;
                                    const updated = [...visualScenes];
                                    updated[sceneIndex] = { ...updated[sceneIndex], image: newImageUrl, error: false, loading: false };
                                    setVisualScenes(updated);
                                    setShowPreviewModal(false);
                                    setPreviewImage(null);
                                }}
                                className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                            >
                                Use This Scene
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}