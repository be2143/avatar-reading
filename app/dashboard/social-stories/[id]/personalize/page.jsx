'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image'; // For Next.js Image component
import { BeatLoader } from 'react-spinners'; // For loading indicators

// Helper function to simulate AI calls (replace with actual API calls)
const simulateAIResponse = (type, data) => {
    return new Promise(resolve => {
        setTimeout(() => {
            if (type === 'text') {
                const personalizedText = data.originalStoryText
                    .replace("Dora", data.studentName || "the child")
                    .replace("UAE", "your neighborhood")
                    .replace("Dubai Zoo", "local park")
                    .replace("monkeys", "squirrels")
                    .replace("lion", "friendly dog")
                    .replace("giraffe", "tall tree") + "\n\n" +
                    `This version is customized for ${data.studentName} at a ${data.comprehensionLevel} level, focusing on ${data.learningPreferences} and addressing ${data.challenges}.`;
                resolve({ personalizedText });
            } else if (type === 'visuals') {
                const scenes = data.storyText.split('\n\n').filter(s => s.trim() !== '').map((text, index) => ({
                    id: index + 1,
                    text: text.substring(0, Math.min(text.length, 150)) + '...',
                    image: `https://via.placeholder.com/400x300.png?text=Scene+${index + 1}+for+${data.studentName}`,
                }));
                resolve({ visualScenes: scenes });
            }
        }, 2000);
    });
};


export default function PersonalizeStoryPage() {
    const { id: storyId } = useParams();
    const router = useRouter();

    // --- State Management ---
    const [originalStory, setOriginalStory] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [personalizationNotes, setPersonalizationNotes] = useState('');

    const [personalizedText, setPersonalizedText] = useState('');
    const [visualScenes, setVisualScenes] = useState([]);

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Fetch Initial Data (Original Story & Students) ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Fetch original story
                const storyRes = await fetch(`/api/stories/${storyId}`);
                if (!storyRes.ok) throw new Error('Failed to fetch original story');
                const storyData = await storyRes.json();
                setOriginalStory(storyData);
                // setPersonalizedText(storyData.story_content); // This initializes personalizedText with original. You might want this.

                // Fetch students
                const studentsRes = await fetch('/api/students');
                if (!studentsRes.ok) throw new Error('Failed to fetch students');
                const studentsData = await studentsRes.json();
                setStudents(studentsData);

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

    // --- Handlers ---
    const handleStudentChange = (e) => {
        const studentId = e.target.value;
        const student = students.find(s => s._id === studentId);

        // CORRECTED LINE: Use 'student' directly as it's the new value
        if (student) { // Only log if student was actually found
            console.log(`Student image: ${student.image}`); // Use 'student' here
        }
        setSelectedStudent(student || null); // Ensure selectedStudent is null if no student found
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
            setPersonalizedText(data.personalizedText);
            setCurrentStep(2);
        } catch (err) {
            console.error("Error personalizing text:", err);
            setError(err.message || "Failed to personalize text.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateVisuals = async () => {
        if (!selectedStudent || !personalizedText) {
            setError("Please personalize the text first and select a student.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/generate-visuals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizedStoryText: personalizedText,
                    mainCharacterImage: selectedStudent.image, // Base64 or URL of student image
                    mainCharacterName: selectedStudent.name,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate visuals.');
            }

            const data = await response.json();
            setVisualScenes(data.visualScenes);
            setCurrentStep(3);
        } catch (err) {
            console.error("Error generating visuals:", err);
            setError(err.message || "Failed to generate visuals.");
        } finally {
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
            const storyTitle = `Personalized: ${originalStory?.title || 'Untitled'} for ${selectedStudent.name}`;
            const storyDescription = originalStory?.description || '';

const payload = {
    title: storyTitle,
    description: storyDescription,
    // CHANGE THIS LINE:
    generatedText: personalizedText, // <-- Change `story_content` to `generatedText`
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

    // --- Loading & Error States ---
    if (isLoading && !originalStory && !students.length) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <BeatLoader color="#8B5CF6" />
            <p className="ml-3 text-gray-600">Loading data...</p>
        </div>
    );
    if (error) return (
        <div className="min-h-screen p-6 bg-gray-50">
            <p className="text-red-600 text-center">{error}</p>
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
            <div className="mb-6 flex items-center cursor-pointer text-purple-600 hover:text-purple-800" onClick={() => router.back()}>
                <span className="font-medium text-sm">← Back</span>
            </div>

            <h1 className="text-3xl font-bold text-purple-800 mb-6">Personalize a Story</h1>

            {/* Progress Steps */}
            <div className="flex justify-center mb-8">
                <div className={`flex items-center mx-4 ${currentStep === 1 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>1</span>
                    <span className="ml-2">Select Student & Customize Text</span>
                </div>
                <div className={`flex items-center mx-4 ${currentStep === 2 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>2</span>
                    <span className="ml-2">Generate Scenes</span>
                </div>
                <div className={`flex items-center mx-4 ${currentStep === 3 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full ${currentStep >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>3</span>
                    <span className="ml-2">Final Preview</span>
                </div>
            </div>

            {/* Main Content Area */}
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
                            {students.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.name} (Age: {student.age}, Grade: {student.comprehensionLevel})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedStudent && (
                        <div className="bg-purple-50 p-4 rounded-lg flex items-center mb-6">
                            {selectedStudent.image ? (
                                <Image
                                    src={selectedStudent.image.startsWith('data:image/')
                                        ? selectedStudent.image
                                        : `data:image/png;base64,${selectedStudent.image}`
                                    }
                                    alt={selectedStudent.name}
                                    width={64}
                                    height={64}
                                    className="rounded-full object-cover mr-4"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-purple-600 text-2xl font-bold mr-4">
                                    {selectedStudent.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="text-lg font-semibold text-purple-800">{selectedStudent.name}</p>
                                <p className="text-sm text-purple-600">
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

                    {personalizedText && currentStep >= 2 && (
                        <>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customized Story Text</h2>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 max-h-64 overflow-y-auto">
                                <p className="font-semibold text-orange-700 mb-2">Personalized for {selectedStudent?.name || 'Student'}</p>
                                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{personalizedText}</p>
                            </div>

                            {/* Generate Visuals Button (Step 2 Actions) */}
                            <button
                                onClick={handleGenerateVisuals}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                disabled={isLoading || currentStep > 2}
                            >
                                {isLoading && currentStep === 2 ? <BeatLoader size={8} color="#fff" /> : "Generate Visuals"}
                            </button>
                            {currentStep > 2 && (
                                <p className="mt-4 text-green-600 text-center">Visuals generated! Proceed to Step 3.</p>
                            )}
                        </>
                    )}

                    {visualScenes.length > 0 && currentStep >= 3 && (
                        <>
                            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Visual Scenes Preview</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {visualScenes.map((scene, index) => (
                                    <div key={scene.id || index} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                        <Image
                                            src={scene.image}
                                            alt={`Scene ${scene.id || index + 1}`}
                                            width={400}
                                            height={300}
                                            className="w-full h-auto object-cover"
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/400x300.png?text=Image+Not+Available"; e.target.alt = "Image Not Available"; }}
                                        />
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-gray-700">{scene.text.substring(0, 100)}...</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleSavePersonalizedStory}
                                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-lg font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                disabled={isLoading}
                            >
                                {isLoading ? <BeatLoader size={8} color="#fff" /> : "Save Personalized Story"}
                            </button>
                        </>
                    )}
                     {/* Loading indicator at the bottom if any async operation is happening */}
                     {isLoading && (
                        <div className="text-center mt-6">
                            <BeatLoader color="#8B5CF6" size={10} />
                            <p className="text-gray-600 mt-2">Processing...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}