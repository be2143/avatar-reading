"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check, BookOpen, Image, Eye, Edit3, RefreshCw, Save } from 'lucide-react';
import { predefinedCharacters } from '@/lib/characters';
import { BeatLoader } from 'react-spinners';
import { useRouter } from 'next/navigation';

export default function CreateStoryPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSceneIndex, setSelectedSceneIndex] = useState(0);
    const [regeneratingScene, setRegeneratingScene] = useState(null);
    const [saving, setSaving] = useState(false);
    const [storyId, setStoryId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '', // This will be the purpose for text generation
        category: '',
        ageGroup: '',
        storyLength: 'medium', // Default
        specificScenarios: '', // This will be the guidelines for text generation
        generatedText: '',
        visualScenes: [],
        characterName: '', // Holds the key, e.g., 'fatima'
        mainCharacterName: '', // Holds the display name, e.g., 'Fatima'
        initialCartoonBaseImageUrl: '', // Will store the selected character's base image URL
        dummyStoryId: Date.now().toString()
    });

    const [showGeneratedText, setShowGeneratedText] = useState(false);
    const [imageGenerationStep, setImageGenerationStep] = useState(2); // 2 = normal, 2.5 = generating images
    const [visualScenes, setVisualScenes] = useState([]);

    // Populate mainCharacterName when characterName is selected
    useEffect(() => {
        if (formData.characterName) {
            const charData = predefinedCharacters[formData.characterName.toLowerCase()];
            if (charData) {
                setFormData(prev => ({
                    ...prev,
                    mainCharacterName: charData.name
                }));
            }
        } else {
            setFormData(prev => ({ ...prev, mainCharacterName: '' }));
        }
    }, [formData.characterName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            if (currentStep === 2 && showGeneratedText) {
                setShowGeneratedText(false); // Go back to text generation input if navigating from visuals to text input
            }
            setSelectedSceneIndex(0);
        } else {
            // Potentially navigate back to a dashboard or home page
            window.history.back();
        }
    };

    const handleNext = async () => {
        setError(''); // Clear previous errors

        if (currentStep === 1) {
            if (!formData.title || !formData.description || !formData.category || !formData.ageGroup || !formData.storyLength) {
                setError('Please fill in all required fields for story setup.');
                return;
            }
            if (!showGeneratedText) {
                await generateStoryText();
            } else {
                setCurrentStep(2);
            }
        } else if (currentStep === 2) {
            if (!formData.characterName) {
                setError('Please select a main character for your story visuals.');
                return;
            }
            await generateVisualScenes();
        } else if (currentStep === 3) {
            const savedSuccessfully = await handleSaveStory(true);
            if (savedSuccessfully && storyId) {
                router.push(`/social-stories/${storyId}/read/`);
            } else if (savedSuccessfully && !storyId) {
                alert("Story saved but could not retrieve ID for redirection. Redirecting to dashboard.");
                router.push("/dashboard");
            }
        }
    };

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
                _id: storyId,
                dummyStoryId: formData.dummyStoryId,
                title: formData.title,
                description: formData.description,
                category: formData.category,
                ageGroup: formData.ageGroup,
                storyLength: formData.storyLength,
                specificScenarios: formData.specificScenarios,
                generatedText: formData.generatedText,
                // Include character details
                characterName: formData.characterName,
                mainCharacterName: formData.mainCharacterName,
                initialCartoonBaseImageUrl: formData.initialCartoonBaseImageUrl,
                visualScenes: formData.visualScenes,
                // selectedStyle: formData.selectedStyle, // Not strictly used for DALL-E 3 consistency logic
            };

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
            if (data.story._id && !storyId) {
                setStoryId(data.story._id);
            }
            alert("Story saved successfully!");
            router.push(`/dashboard/social-stories/${data.story._id}/read`);
        } catch (err) {
            setError(`Failed to save story: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

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
                    wordCount: formData.storyLength === 'very_short' ? 50 : formData.storyLength === 'short' ? 100 : formData.storyLength === 'medium' ? 200 : 300,
                    category: formData.category,
                    ageGroup: formData.ageGroup,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate story text from API');
            }

            const data = await response.json();
            setFormData(prev => ({ ...prev, generatedText: data.story }));
            setShowGeneratedText(true);
        } catch (err) {
            setError(`Failed to generate story text: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const regenerateText = async () => {
        await generateStoryText();
    };

    const handleTextEdit = (e) => {
        setFormData(prev => ({ ...prev, generatedText: e.target.value }));
    };

    const generateVisualScenes = async () => {
        setLoading(true);
        setError('');
        setImageGenerationStep(2.5); // Set to image generation step

        if (!formData.generatedText.trim()) {
            setError('Story text is empty. Please generate or enter text first.');
            setLoading(false);
            setImageGenerationStep(2);
            return;
        }
        if (!formData.characterName) {
            setError('Please select a main character for your story visuals.');
            setLoading(false);
            setImageGenerationStep(2);
            return;
        }

        // Retrieve the character data based on the selected characterName
        const selectedCharacter = predefinedCharacters[formData.characterName.toLowerCase()];

        if (!selectedCharacter) {
            setError('Selected character not found. Please choose a valid character.');
            setLoading(false);
            setImageGenerationStep(2);
            return;
        }

        // Split the story into scenes and create placeholder scenes immediately
        const scenes = formData.generatedText.split('\n\n').filter(s => s.trim());
        const placeholderScenes = scenes.map((sceneText, index) => ({
            id: index + 1,
            text: sceneText,
            image: null, // Will be updated when generated
            error: false,
            loading: true
        }));
        setVisualScenes(placeholderScenes);

        try {
            // Start batch generation and get batchId
            const response = await fetch('/api/generate-visuals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    storyId: formData.dummyStoryId,
                    personalizedStoryText: formData.generatedText,
                    mainCharacterName: selectedCharacter.name,
                    mainCharacterImage: selectedCharacter.imageUrl,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate visual scenes from API');
            }

            const data = await response.json();
            const batchId = data.batchId;
            if (!batchId) throw new Error('No batchId returned from API.');

            // Poll for progress
            const pollProgress = async () => {
                try {
                    const progressResponse = await fetch(`/api/stories/generate-scenes-batch?batchId=${batchId}`);
                    if (!progressResponse.ok) throw new Error('Failed to check progress');
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
                        setTimeout(pollProgress, 2000);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            visualScenes: updatedScenes,
                            initialCartoonBaseImageUrl: data.initialCartoonBaseImageUrl,
                        }));
                        setCurrentStep(3);
                        setSelectedSceneIndex(0);
                        setError('');
                        setImageGenerationStep(2);
                        setLoading(false);
                    }
                } catch (err) {
                    setError('Failed to check generation progress');
                    setImageGenerationStep(2);
                    setLoading(false);
                }
            };
            pollProgress();
        } catch (err) {
            setError(`Failed to generate visual scenes: ${err.message}`);
            setImageGenerationStep(2);
            setLoading(false);
        }
    };

    const regenerateScene = async (sceneIndex) => {
        setRegeneratingScene(sceneIndex);
        setError('');

        const sceneToRegenerate = visualScenes[sceneIndex];
        if (!sceneToRegenerate) {
            setError("Scene not found for regeneration.");
            setRegeneratingScene(null);
            return;
        }

        try {
            const response = await fetch('/api/stories/regenerate-scene', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sceneText: sceneToRegenerate.text,
                    mainCharacterImage: formData.initialCartoonBaseImageUrl, // Use cartoon image!
                    mainCharacterName: formData.mainCharacterName,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to regenerate scene from API');
            }

            const data = await response.json();
            const updatedScenes = [...visualScenes];
            updatedScenes[sceneIndex] = {
                ...updatedScenes[sceneIndex],
                image: data.imageUrl,
                error: false,
                loading: false,
            };
            setVisualScenes(updatedScenes);
            setFormData(prev => ({ ...prev, visualScenes: updatedScenes }));
            setError('');
        } catch (err) {
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
        setFormData(prev => ({ ...prev, visualScenes: updatedScenes }));
    };

    const steps = [
        { number: 1, title: 'Generate Text', icon: BookOpen, active: currentStep === 1, complete: currentStep > 1 },
        { number: 2, title: 'Generate Visuals', icon: Image, active: currentStep === 2 || imageGenerationStep === 2.5, complete: currentStep > 2 },
        { number: 3, title: 'Review Story', icon: Eye, active: currentStep === 3, complete: false }
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={handleBack}
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
                    <h1 className="text-3xl font-bold text-purple-700 mb-6">Generate a New Story</h1>
                </div>

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

                {error && (
                    <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* Step 1: Story Setup & Text Generation */}
                {currentStep === 1 && (
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        {!showGeneratedText ? (
                            <form>
                                <div className="mb-4">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Story Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., Lily's First Day at School"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">What is the story about? (Purpose/Situation) <span className="text-red-500">*</span></label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="e.g., Helping a child understand sharing toys"
                                        required
                                    ></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label>
                                        <select
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                            required
                                        >
                                            <option value="">Select category</option>
                                            <option value="social">Social Skills</option>
                                            <option value="routine">Routines</option>
                                            <option value="community">Community</option>
                                            <option value="emotions">Emotions</option>
                                            <option value="digital">Digital world/Technology</option>
                                            <option value="school">School</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">Age Group <span className="text-red-500">*</span></label>
                                        <select
                                            id="ageGroup"
                                            name="ageGroup"
                                            value={formData.ageGroup}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                            required
                                        >
                                            <option value="">Select age group</option>
                                            <option value="3-5">3–5 years</option>
                                            <option value="6-8">6–8 years</option>
                                            <option value="9-12">9–12 years</option>
                                            <option value="13+">13+ years</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="storyLength" className="block text-sm font-medium text-gray-700">Story Length <span className="text-red-500">*</span></label>
                                    <select
                                        id="storyLength"
                                        name="storyLength"
                                        value={formData.storyLength}
                                        onChange={handleChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    >
                                        <option value="">Select length</option>
                                        <option value="short">Very short (~50 words)</option>
                                        <option value="short">Short (~100 words)</option>
                                        <option value="medium">Medium (~200 words)</option>
                                        <option value="long">Long (~300 words)</option>
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
                                <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mb-6">
                                    <span className="mr-3 text-2xl">ℹ️</span>
                                    <span className="text-gray-700 text-base">Please review the story text before proceeding to visual generation. Click the text to edit.</span>
                                </div>
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
                                        onClick={handleSaveStory}
                                        disabled={saving || loading || !formData.generatedText.trim()}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        Save Text Story
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Character Selection & Generate Visuals */}
                {currentStep === 2 && imageGenerationStep === 2 && (

                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mb-6">
                            <span className="mr-3 text-2xl">ℹ️</span>
                            <span className="text-gray-700 text-base">Please select character and proceed to generate the visuals.</span>
                        </div>
                        <div className="mb-6">
                            <div className="bg-blue-50 border border-blue-400 rounded-lg p-5">
                                <h3 className="font-bold text-lg text-blue-900 mb-3">{formData.title}</h3>
                                <div className="text-blue-900 whitespace-pre-line leading-relaxed">
                                    {formData.generatedText}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-2">
                                Select Main Character for Visuals <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="characterName"
                                name="characterName"
                                value={formData.characterName}
                                onChange={handleChange}
                                className="w-full max-w-xs border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                required
                            >
                                <option value="">Choose a character</option>
                                {Object.keys(predefinedCharacters).map((key) => (
                                    <option key={key} value={key}>
                                        {predefinedCharacters[key].name}
                                    </option>
                                ))}
                            </select>
                            {formData.characterName && (
                                <div className="mt-4 flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <img
                                        src={predefinedCharacters[formData.characterName.toLowerCase()]?.imageUrl}
                                        alt={formData.mainCharacterName}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-400"
                                    />
                                    <div>
                                        <p className="font-semibold text-blue-800">Using {formData.mainCharacterName}</p>
                                        <p className="text-sm text-blue-700">{predefinedCharacters[formData.characterName.toLowerCase()]?.description}</p>
                                    </div>
                                </div>
                            )}
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
                                                onError={(e) => { e.target.src = "https://placehold.co/400x300/e0e0e0/000000?text=Image+Load+Error"; }}
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

                {/* Step 2.5: Image Generation Process */}
                {imageGenerationStep === 2.5 && (
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
                                        <img
                                            src={scene.image}
                                            alt={`Scene ${scene.id || index + 1}`}
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
                )}

                {/* Step 3: Review & Edit Visuals */}
                {currentStep === 3 && (
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h1 className="text-2xl font-bold mb-6 text-purple-800">Review Generated Visual Storybook</h1>
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
                                        </div>
                                        <div className="mb-4">
                                            <img
                                                key={formData.visualScenes[selectedSceneIndex].id} // Using id as key is better for dynamic updates
                                                src={formData.visualScenes[selectedSceneIndex].image}
                                                alt={`Scene ${selectedSceneIndex + 1}`}
                                                className="w-full h-80 object-contain rounded-md bg-gray-100"
                                                onError={(e) => { e.target.src = "https://placehold.co/600x400/e0e0e0/000000?text=Image+Load+Error"; }}
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
                                            <div className="flex items-center bg-yellow-100 border border-orange-400 rounded-lg px-4 py-3 mt-4">
                                                <span className="mr-3 text-2xl">ℹ️</span>
                                                <span className="text-gray-700 text-base">You can edit the scene text before saving. Click the text to edit.</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSaveStory}
                                disabled={saving || loading || !formData.visualScenes.length}
                                className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
                            >
                                {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                Save Final Story
                            </button>
                        </div> */}
                    </div>
                )}

                {/* Navigation Buttons (Outside step-specific content) */}
                <div className="mt-8 flex justify-between">
                    {/* <button
                        onClick={handleBack}
                        className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button> */}
                    <button
                        onClick={handleNext}
                        disabled={loading || saving || (currentStep === 1 && !formData.generatedText.trim() && showGeneratedText) || (currentStep === 2 && !formData.characterName)}
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
                        {currentStep === 3 && 'Done Reviewing, Save Story'}
                    </button>
                </div>
            </div>
        </div>
    );
}