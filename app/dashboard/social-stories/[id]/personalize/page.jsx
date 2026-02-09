'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BeatLoader } from 'react-spinners';
import Image from 'next/image';
import { BookOpen, Image as ImageIcon, Eye } from 'lucide-react';

export default function PersonalizeStoryPage() {
    const { id: storyId } = useParams();
    const router = useRouter();

    const [originalStory, setOriginalStory] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [personalizationNotes, setPersonalizationNotes] = useState('');

    const [personalizedText, setPersonalizedText] = useState('');
    const [visualScenes, setVisualScenes] = useState([]);

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedScene, setSelectedScene] = useState(0);

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
    };

    const handlePersonalizeText = async () => {
        if (!selectedStudent || !originalStory) {
            setError("Please select a student and ensure the original story is loaded.");
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

            console.log("Received personalized text: ", data.personalizedText);

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

        setIsLoading(true);
        setError(null);
        try {
            const storyTitle = originalStory?.title || 'Untitled';
            const storyDescription = originalStory?.description || '';

            const payload = {
                title: storyTitle,
                description: storyDescription,
                generatedText: personalizedText,
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Panel: Scene Thumbnails */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Scene Thumbnails</h3>
                            <div className="space-y-4">
                                {visualScenes.map((scene, index) => (
                                    <div
                                        key={scene.id || index}
                                        className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${selectedScene === index ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => setSelectedScene(index)}
                                    >
                                        {scene.error ? (
                                            <div className="w-full h-32 bg-red-50 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-red-600 text-xs font-medium">Failed</p>
                                                    <p className="text-red-500 text-xs">Scene {scene.id}</p>
                                                </div>
                                            </div>
                                        ) : scene.image && scene.image !== 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed' ? (
                                            <Image
                                                src={scene.image}
                                                alt={`Scene ${scene.id || index + 1}`}
                                                width={200}
                                                height={150}
                                                className="w-full h-32 object-cover"
                                                onError={(e) => { e.target.src = "https://placehold.co/400x400.png?text=Image+Not+Available"; e.target.alt = "Image Not Available"; }}
                                            />
                                        ) : (
                                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                                <div className="text-center">
                                                    <p className="text-gray-600 text-xs font-medium">No image</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-2">
                                            <p className="text-xs font-medium text-gray-700">Scene {index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Panel: Detailed Scene View */}
                        <div className="lg:col-span-2">
                            {selectedScene !== null && visualScenes[selectedScene] ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Story Title</h3>
                                        <span className="text-sm text-gray-500">Scene {selectedScene + 1}/{visualScenes.length}</span>
                                    </div>

                                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Scene Text */}
                                            <div className="lg:col-span-1">
                                                <div className="text-gray-800 leading-relaxed">
                                                    {visualScenes[selectedScene].text.split(' ').map((word, wordIndex) => {
                                                        // Highlight emotional words
                                                        const emotionalWords = ['sad', 'worried', 'happy', 'excited', 'angry', 'scared', 'nervous', 'confident'];
                                                        const isEmotional = emotionalWords.some(emotion =>
                                                            word.toLowerCase().includes(emotion)
                                                        );
                                                        return (
                                                            <span key={wordIndex}>
                                                                {isEmotional ? (
                                                                    <span className="font-bold text-purple-600">{word}</span>
                                                                ) : (
                                                                    word
                                                                )}
                                                                {' '}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Scene Image */}
                                            <div className="lg:col-span-1">
                                                {visualScenes[selectedScene].error ? (
                                                    <div className="w-full h-64 bg-red-50 flex items-center justify-center rounded-lg">
                                                        <div className="text-center">
                                                            <p className="text-red-600 text-sm font-medium">Failed to generate</p>
                                                            <p className="text-red-500 text-xs">Scene {visualScenes[selectedScene].id}</p>
                                                        </div>
                                                    </div>
                                                ) : visualScenes[selectedScene].image && visualScenes[selectedScene].image !== 'https://placehold.co/400x300/e0e0e0/000000?text=Image+Failed' ? (
                                                    <Image
                                                        src={visualScenes[selectedScene].image}
                                                        alt={`Scene ${visualScenes[selectedScene].id || selectedScene + 1}`}
                                                        width={400}
                                                        height={400}
                                                        className="w-full h-auto object-cover rounded-lg"
                                                        onError={(e) => { e.target.src = "https://placehold.co/400x400.png?text=Image+Not+Available"; e.target.alt = "Image Not Available"; }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                                                        <div className="text-center">
                                                            <p className="text-gray-600 text-sm font-medium">No image available</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <p>Select a scene to view details</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 text-center">
                        <button
                            onClick={handleSavePersonalizedStory}
                            className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <label htmlFor="student-select" className="block text-gray-700 text-sm font-medium mb-2">Choose Student:</label>
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
                            disabled={isLoading || !selectedStudent || !originalStory || currentStep > 1}
                        >
                            {isLoading && currentStep === 1 ? <BeatLoader size={8} color="#fff" /> : "Customize Text"}
                        </button>
                        {currentStep > 1 && (
                            <p className="mt-4 text-green-600 text-center">Text customized! Proceed to Step 2.</p>
                        )}
                    </div>

                    {/* Right Panel: Story Previews (Original, Customized Text, Visuals) */}
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Original Story</h2>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 max-h-64 overflow-y-auto">
                            <p className="font-semibold text-purple-700 mb-2">{originalStory?.title}</p>
                            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{originalStory?.story_content}</p>
                        </div>

                        {/* Customized Story Text Section - Now Editable */}
                        {personalizedText && currentStep >= 2 && (
                            <>
                                <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mb-4">
                                    <span className="mr-3 text-2xl">ℹ️</span>
                                    <span className="text-gray-700 text-base">Please review the personalized story text before proceeding. <span className="font-medium">Click the text to edit.</span></span>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Customized Story Text</h2>
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 max-h-64 overflow-y-auto">
                                    <p className="font-semibold text-orange-700 mb-2">Personalized for {selectedStudent?.name || 'Student'}</p>
                                    {/* MODIFICATION HERE: Changed from <p> to <textarea> */}
                                    <textarea
                                        className="w-full h-48 p-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 resize-y"
                                        value={personalizedText}
                                        onChange={handlePersonalizedTextChange} // New handler
                                        rows="8" // Adjust rows as needed
                                        disabled={isLoading || currentStep > 2} // Disable while loading or after visuals generated
                                    />
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
        </div>
    );
}