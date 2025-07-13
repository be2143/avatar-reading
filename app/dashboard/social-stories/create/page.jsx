// app/dashboard/social-stories/create/page.jsx
"use client";

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check, BookOpen, Image, Eye, Edit3, RefreshCw, Save } from 'lucide-react'; // Import Save icon

export default function CreateStoryPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
    const [regeneratingScene, setRegeneratingScene] = useState(null);
    const [saving, setSaving] = useState(false); // New state for saving status
    const [storyId, setStoryId] = useState(null); // New state to store the actual DB _id

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        ageGroup: '',
        storyLength: '',
        specificScenarios: '',
        generatedText: '',
        visualScenes: [], // Array of { id, title, text, image }
        mainCharacterDescription: '',
        otherCharacters: [],
        selectedStyle: 'cartoon',
        // finalStory: null, // This might become redundant if `story_content` + `visualScenes` is the final story
        dummyStoryId: Date.now().toString() // Generate a unique ID for initial API calls before DB _id
    });

    const [showGeneratedText, setShowGeneratedText] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            if (currentStep === 2 && showGeneratedText) {
                setShowGeneratedText(false);
            }
            setSelectedSceneIndex(0);
        } else {
            console.log('Navigate back to dashboard');
            window.history.back();
        }
    };

    const handleNext = async () => {
        if (currentStep === 1 && !showGeneratedText) {
            await generateStoryText();
        } else if (currentStep === 1 && showGeneratedText) {
            setCurrentStep(2);
        } else if (currentStep === 2) {
            await generateVisualScenes();
        } else if (currentStep === 3) {
            // Optional: Auto-save on final step completion or prompt user to save
            alert("Story review complete. You can go back to generate new visuals or refine the text. Don't forget to save!");
        }
    };

    // --- NEW: handleSaveStory function ---
    const handleSaveStory = async () => {
        setSaving(true);
        setError('');

        if (!formData.title.trim()) {
            setError('Please add a story title before saving.');
            setSaving(false);
            return;
        }

        if (!formData.generatedText.trim()) {
            setError('Story text is empty. Generate text before saving.');
            setSaving(false);
            return;
        }

        try {
            const payload = {
                _id: storyId, // Pass the actual DB _id if it exists
                dummyStoryId: formData.dummyStoryId, // Always pass dummyId for tracking
                title: formData.title,
                description: formData.description,
                category: formData.category,
                ageGroup: formData.ageGroup,
                storyLength: formData.storyLength,
                specificScenarios: formData.specificScenarios,
                generatedText: formData.generatedText,
                mainCharacterDescription: formData.mainCharacterDescription,
                otherCharacters: formData.otherCharacters,
                visualScenes: formData.visualScenes,
                selectedStyle: formData.selectedStyle,
            };

            console.log("Saving payload:", payload);

            const response = await fetch('/api/stories/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save story to database.');
            }

            const data = await response.json();
            console.log("Story saved successfully:", data.story);
            // If it's a new story, capture the actual _id from the database
            if (data.story._id && !storyId) {
                setStoryId(data.story._id);
                // Optionally update formData.dummyStoryId if you want to remove it
                // setFormData(prev => ({ ...prev, dummyStoryId: data.story._id }));
            }
            alert("Story saved successfully!");
        } catch (err) {
            console.error('Error saving story:', err);
            setError(`Failed to save story: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };
    // --- END NEW: handleSaveStory function ---


    const generateStoryText = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/stories/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    purpose: formData.description,
                    guidelines: formData.specificScenarios,
                    wordCount: formData.storyLength === 'short' ? 100 : formData.storyLength === 'medium' ? 200 : 300,
                    category: formData.category,
                    ageGroup: formData.ageGroup,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate story text from API');
            }

            const data = await response.json();
            setFormData({ ...formData, generatedText: data.story });
            setShowGeneratedText(true);
        } catch (err) {
            console.error('Error generating story text:', err);
            setError(`Failed to generate story text: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const regenerateText = async () => {
        await generateStoryText();
    };

    const handleTextEdit = (e) => {
        setFormData({ ...formData, generatedText: e.target.value });
    };

    // API call to generate visual scenes for the story
    const generateVisualScenes = async () => {
        setLoading(true);
        setError('');

        if (!formData.generatedText.trim()) {
            setError('Story text is empty. Please generate or enter text first.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/stories/visuals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storyId: formData.dummyStoryId, // Include the dummy storyId
                    storyText: formData.generatedText,
                    visualStyle: formData.selectedStyle,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate visual scenes from API');
            }

            const data = await response.json();

            console.log("Full API Response Data:", data);

            if (!data.visualScenes || !Array.isArray(data.visualScenes)) {
                console.error("API response error: 'visualScenes' array is missing or malformed.", data);
                throw new Error("Failed to get visual scenes from API. Invalid response format.");
            }

            const scenes = data.visualScenes.map((sceneData) => ({
                id: sceneData.sceneNumber,
                title: `Scene ${sceneData.sceneNumber}`,
                text: sceneData.sceneText,
                image: sceneData.imageUrl,
            }));

            setFormData({
                ...formData,
                visualScenes: scenes,
                mainCharacterDescription: data.mainCharacterDescription || '',
                otherCharacters: data.otherCharacters || [],
            });
            setCurrentStep(3);
            setSelectedSceneIndex(0);
            setError('');
        } catch (err) {
            console.error('Error generating visual scenes:', err);
            setError(`Failed to generate visual scenes: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // API call to regenerate a single scene's image
    const regenerateScene = async (sceneIndex) => {
        setRegeneratingScene(sceneIndex);
        setError('');

        const sceneToRegenerate = formData.visualScenes[sceneIndex];
        if (!sceneToRegenerate) {
            setError("Scene not found for regeneration.");
            setRegeneratingScene(null);
            return;
        }

        try {
            const response = await fetch('/api/stories/regenerate-scene', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storyId: formData.dummyStoryId,
                    text: sceneToRegenerate.text,
                    visualStyle: formData.selectedStyle,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to regenerate scene from API');
            }

            const data = await response.json();
            const updatedScenes = [...formData.visualScenes];
            updatedScenes[sceneIndex] = {
                ...updatedScenes[sceneIndex],
                image: data.imageUrl,
            };

            setFormData({ ...formData, visualScenes: updatedScenes });
            setError('');
        } catch (err) {
            console.error('Error regenerating scene:', err);
            setError(`Failed to regenerate scene: ${err.message}`);
        } finally {
            setRegeneratingScene(null);
        }
    };

    const handleSceneTextEdit = (sceneIndex, newText) => {
        const updatedScenes = [...formData.visualScenes];
        updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            text: newText
        };
        setFormData({ ...formData, visualScenes: updatedScenes });
    };

    const steps = [
        { number: 1, title: 'Story Setup & Text Generation', icon: BookOpen, active: currentStep === 1, complete: currentStep > 1 },
        { number: 2, title: 'Generate Visuals', icon: Image, active: currentStep === 2, complete: currentStep > 2 },
        { number: 3, title: 'Review & Edit Visuals', icon: Eye, active: currentStep === 3, complete: false }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={handleBack}
                    className="flex items-center text-purple-700 hover:text-purple-900 mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <div className="flex justify-between items-center mb-10">
                    {steps.map((step) => (
                        <div key={step.number} className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                    ${step.complete ? 'bg-green-500' : step.active ? 'bg-purple-600' : 'bg-gray-400'}`}
                            >
                                <step.icon className="w-5 h-5" />
                            </div>
                            <p className={`text-sm mt-2 ${step.active ? 'text-purple-700 font-semibold' : 'text-gray-600'}`}>
                                {step.title}
                            </p>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h1 className="text-2xl font-bold mb-6 text-purple-800">Create a New Social Story</h1>
                        {!showGeneratedText ? (
                            <form>
                                <div className="mb-4">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Story Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., Lily's First Day at School"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">What is the story about? (Purpose/Situation)</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., Helping a child understand sharing toys"
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="social-skills">Social Skills</option>
                                            <option value="daily-routines">Daily Routines</option>
                                            <option value="emotional-regulation">Emotional Regulation</option>
                                            <option value="safety">Safety</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">Age Group</label>
                                        <select
                                            id="ageGroup"
                                            name="ageGroup"
                                            value={formData.ageGroup}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        >
                                            <option value="">Select Age Group</option>
                                            <option value="preschool">Preschool (3-5)</option>
                                            <option value="early-elementary">Early Elementary (6-8)</option>
                                            <option value="late-elementary">Late Elementary (9-11)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="storyLength" className="block text-sm font-medium text-gray-700">Story Length</label>
                                    <select
                                        id="storyLength"
                                        name="storyLength"
                                        value={formData.storyLength}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Select Length</option>
                                        <option value="short">Short (approx. 100 words)</option>
                                        <option value="medium">Medium (approx. 200 words)</option>
                                        <option value="long">Long (approx. 300 words)</option>
                                    </select>
                                </div>
                                <div className="mb-6">
                                    <label htmlFor="specificScenarios" className="block text-sm font-medium text-gray-700">Specific scenarios or details to include (optional)</label>
                                    <textarea
                                        id="specificScenarios"
                                        name="specificScenarios"
                                        value={formData.specificScenarios}
                                        onChange={handleChange}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., Character names, specific events, desired outcomes"
                                    ></textarea>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Generated Story Text</h2>
                                <textarea
                                    value={formData.generatedText}
                                    onChange={handleTextEdit}
                                    rows="15"
                                    className="w-full border border-gray-300 rounded-md shadow-sm p-3 mb-4 resize-y focus:ring-purple-500 focus:border-purple-500"
                                ></textarea>
                                <div className="flex gap-4">
                                    <button
                                        onClick={regenerateText}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                        Regenerate Text
                                    </button>
                                    <button
                                        onClick={handleSaveStory} // Save button after text generation
                                        disabled={saving || loading || !formData.generatedText.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Text
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h1 className="text-2xl font-bold mb-6 text-purple-800">Generate Visual Scenes</h1>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Generated Story Text</h3>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-gray-700 whitespace-pre-wrap">{formData.generatedText}</p>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <label htmlFor="visualStyle" className="block font-medium text-gray-700 mb-2">Visual Style</label>
                                <select
                                    id="visualStyle"
                                    name="selectedStyle"
                                    value={formData.selectedStyle}
                                    onChange={handleChange}
                                    className="w-full max-w-xs border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="cartoon">Cartoon</option>
                                    <option value="realistic">Realistic</option>
                                    <option value="simple">Simple Illustrations</option>
                                    <option value="watercolor">Watercolor</option>
                                </select>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleSaveStory} // Save button before visuals generation
                                    disabled={saving || loading || !formData.generatedText.trim()}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Progress
                                </button>
                                <button
                                    onClick={generateVisualScenes}
                                    disabled={loading || !formData.generatedText.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Image className="w-4 h-4 mr-2" />
                                    )}
                                    Generate Visuals
                                </button>
                            </div>
                        </div>

                        {formData.visualScenes.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-semibold mb-4">Generated Visuals Preview</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {formData.visualScenes.map((scene, index) => (
                                        <div key={index} className="bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                                            <img
                                                src={scene.image}
                                                alt={`Scene ${index + 1}`}
                                                className="w-full h-32 object-cover"
                                                onError={(e) => { e.target.src = "https://via.placeholder.com/400x300.png?text=Image+Load+Error"; }}
                                                loading="lazy"
                                            />
                                            <p className="p-2 text-sm text-gray-700 truncate">{scene.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

{currentStep === 3 && (
    <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-purple-800">Review Generated Visual Story</h1>

        {formData.mainCharacterDescription && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Main Character Details:</h3>
                <p className="text-blue-700">{formData.mainCharacterDescription}</p>
                {formData.otherCharacters.length > 0 && (
                    <>
                        <h4 className="text-md font-medium text-blue-700 mt-3">Other Characters:</h4>
                        <ul className="list-disc list-inside text-blue-700">
                            {formData.otherCharacters.map((char, idx) => (
                                <li key={idx}>{char}</li>
                            ))}
                        </ul>
                    </>
                )}
                <p className="text-sm text-blue-600 mt-2">
                    (These details were used to keep characters consistent across visuals.)
                </p>
            </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border-r pr-6">
                <h3 className="text-lg font-semibold mb-4">Scene Navigation</h3>
                <div className="flex flex-col gap-2">
                    {formData.visualScenes.map((scene, index) => (
                        <button
                            key={scene.id}
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
                            <h3 className="text-lg font-semibold">
                                Scene {selectedSceneIndex + 1}
                            </h3>
                            <button
                                onClick={() => regenerateScene(selectedSceneIndex)}
                                disabled={regeneratingScene === selectedSceneIndex}
                                className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm hover:bg-yellow-300 disabled:opacity-50 flex items-center"
                            >
                                {regeneratingScene === selectedSceneIndex ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Regenerate Image
                            </button>
                        </div>
                        <div className="mb-4">
                            <img
                                key={formData.visualScenes[selectedSceneIndex].id}
                                src={formData.visualScenes[selectedSceneIndex].image}
                                alt={`Scene ${selectedSceneIndex + 1}`}
                                className="w-full h-80 object-contain rounded-md bg-gray-100"
                                onError={(e) => { e.target.src = "https://via.placeholder.com/600x400.png?text=Image+Load+Error"; }}
                                loading="lazy"
                            />
                        </div>
                        <div>
                            <label htmlFor="sceneText" className="block text-sm font-medium text-gray-700 mb-2">Scene Text</label>
                            <textarea
                                id="sceneText"
                                value={formData.visualScenes[selectedSceneIndex].text}
                                onChange={(e) => handleSceneTextEdit(selectedSceneIndex, e.target.value)}
                                rows="5"
                                className="w-full border border-gray-300 rounded-md shadow-sm p-2 resize-y focus:ring-purple-500 focus:border-purple-500"
                            ></textarea>
                        </div>
                    </div>
                )}
            </div>
        </div>
        <div className="mt-8 flex justify-end">
            <button
                onClick={handleSaveStory} // Save button after visuals are regenerated (Step 3)
                disabled={saving || loading || !formData.visualScenes.length}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
            >
                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Final Story
            </button>
        </div>
    </div>
)}
                
                <div className="mt-8 flex justify-between">
                    <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={loading || saving || (currentStep === 1 && !formData.generatedText.trim() && showGeneratedText)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading && (currentStep === 1 || currentStep === 2) ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : currentStep === 1 && !showGeneratedText ? (
                            <Check className="w-5 h-5 mr-2" />
                        ) : currentStep === 3 ? (
                            <Check className="w-5 h-5 mr-2" />
                        ) : (
                            <ArrowRight className="w-5 h-5 mr-2" />
                        )}
                        {currentStep === 1 && !showGeneratedText && 'Generate Story Text'}
                        {currentStep === 1 && showGeneratedText && 'Proceed to Visuals'}
                        {currentStep === 2 && 'Generate All Visuals'}
                        {currentStep === 3 && 'Done Reviewing'}
                    </button>
                </div>
            </div>
        </div>
    );
}