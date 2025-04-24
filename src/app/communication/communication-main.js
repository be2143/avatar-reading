"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";
import VocabCard from "../components/VocabCard"; // Adjust the path based on your structure
import PhraseCard from "../components/HorizontalCard";
import CategoryCard from "../components/CircleCard";

const cardDataVertical = [
    { imageSrc: "/want.gif", title: "I want", color: "#f9b4ab", type: "vertical" },
    { imageSrc: "/like.gif", title: "I like", color: "#c5b4f9", type: "vertical" },
    { imageSrc: "/i-think.gif", title: "I think", color: "#f9de8b", type: "vertical" },
    { imageSrc: "/feel.gif", title: "I feel", color: "#b4e3f9", type: "vertical" },
    { imageSrc: "/mom.png", title: "Mommy", color: "#E9C9E1", type: "vertical" },
    { imageSrc: "/dad.png", title: "Daddy", color: "#5F65BF", type: "vertical" },
];

const cardDataHorizontal = [
    { imageSrc: "/let's.gif", title: "Let's", color: "#BEEAD2", type: "horizontal" },
    { imageSrc: "/that's.gif", title: "That's", color: "#E9C9E1", type: "horizontal" },
    { imageSrc: "/help.gif", title: "Help!", color: "#C77171", type: "horizontal" },
    { imageSrc: "/thanks.gif", title: "Thank You!", color: "#b4e3f9", type: "horizontal" }
];

const cardDataCircle = [
    { imageSrc: "https://drive.google.com/uc?id=1Ce_ekwamcQQAaUVrIryh9J_f_-a-eORo", title: "Food", color: "#b4e3f9", type: "circle" },
    { imageSrc: "https://drive.google.com/uc?id=1bBo-xbl5FY_WOwDypgxl9GlEDFThcYa7", title: "Games", color: "#b4e3f9", type: "circle" },
    { imageSrc: "https://drive.google.com/uc?id=1oGKeDlKb8DocDuzy3Z_tAJ45cUjFWjlv", title: "Places", color: "#b4e3f9", type: "circle" },
    { imageSrc: "/activities.png", title: "Activities", color: "#b4e3f9", type: "circle" },
    { imageSrc: "/actions.png", title: "Actions", color: "#b4e3f9", type: "circle" },
    { imageSrc: "/clothes.png", title: "Clothes", color: "#b4e3f9", type: "circle" },
    { imageSrc: "/animals.png", title: "Animals", color: "#b4e3f9", type: "circle" },
    { imageSrc: "/emotions.png", title: "Emotions", color: "#b4e3f9", type: "circle" }
];

// Generate a mp3 out of the text
const textToSpeech = async (text) => {
    try {
        const response = await fetch('/api/tts', {
            method: 'POST', // Make sure this is a POST request
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }) // Send the text as a JSON payload
        });

        if (!response.ok) throw new Error('Failed to fetch audio');

        // Create blob from the audio data
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Create an audio element and play the audio
        const audio = new Audio(audioUrl);
        audio.play();

        // Clean up the URL after playing
        audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
        console.error('Error playing audio:', error);
    }
};

// Function to generate recommended words
const getRecommendations = async (selectedWords) => {
    try {
        const recommendationsResponse = await fetch("/api/recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ selectedWords }),
        });

        console.log("Response status:", recommendationsResponse.status); // Debugging

        if (!recommendationsResponse.ok) {
            throw new Error(`Error fetching recommendations: ${recommendationsResponse.statusText}`);
        }

        const recommendationsData = await recommendationsResponse.json();
        console.log("Received recommendations:", recommendationsData); // Debugging

        if (!recommendationsData.suggestions) {
            throw new Error("No suggestions found in the response");
        }


        return recommendationsData.suggestions;
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
};

// Function to make a full sentence out of the selected words
const correctSentence = async (selectedWords) => {
    try {
        if (!selectedWords || selectedWords.length === 0) {
            console.warn("No words selected, skipping request.");
            return "Please select words to form a sentence.";
        }

        console.log("Sending", selectedWords);
        const response = await fetch("/api/sentences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ selectedWords }),
        });

        if (!response.ok) {
            throw new Error(`Error making a sentence: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Received sentence:", data.sentence);

        textToSpeech(data.sentence); // Play the generated sentence
        // Return the generated sentence
        return data.sentence;
    } catch (error) {
        console.error("Error making a sentence:", error);
        return "Failed to generate sentence.";
    }
};

const CommunicationMain = () => {
    const [sentence, setSentence] = useState("..."); // Initial sentence
    const [currentCards, setCurrentCards] = useState([
        ...cardDataVertical,
        ...cardDataHorizontal,
    ]);
    const [selectedWords, setSelectedWords] = useState([]);

    const handleCategoryCardClick = async (word) => {
        // Fetch new category cards based on the circle card selected
        try {
            console.log(word.toLowerCase());
            word = word.toLowerCase();
            const response = await fetch(`/api/categories?name=${word}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const categoryData = await response.json();
            const cardIds = categoryData.cards;
            console.log(cardIds);

            // Fetch card details using IDs
            const fetchedCards = await Promise.all(
                cardIds.map(async (id) => {
                    console.log(id)
                    const cardResponse = await fetch(`/api/cards?id=${id}`);
                    if (!cardResponse.ok) {
                        throw new Error(`Error: ${cardResponse.statusText}`);
                    }
                    const cardDataCategory = await cardResponse.json();
                    console.log(cardDataCategory)
                    return {
                        imageSrc: `${cardDataCategory.image}`,
                        title: cardDataCategory.word,
                        color: "#f9de8b",
                        type: "vertical"
                    };
                })
            );

            // Update the state while keeping circle cards always visible
            setCurrentCards(fetchedCards);
        } catch (error) {
            console.error("Error fetching category cards:", error);
        }
    }

    const handleSentenceClick = async () => {
        const constructedSentence = await correctSentence(selectedWords); // Wait for the full sentence
        setSentence(constructedSentence); // Update the sentence state after receiving the constructed sentence
    };

    // Function to clear the selected words and reset the sentence
    const clearSelectedWords = () => {
        setSelectedWords([]); // Clear selected words
        setSentence("..."); // Optionally reset the sentence display
    };

    const handleCardClick = async (word) => {

        // Update selected words
        const updatedSelectedWords = [...selectedWords, word];
        setSelectedWords(updatedSelectedWords); // Update selectedWords with the clicked word

        // Update the sentence display (without waiting for API response)
        setSentence(updatedSelectedWords.join(" "));

        try {
            console.log("Fetching recommendations...");
            const suggestions = await getRecommendations(updatedSelectedWords);

            // Fetch cards for each suggested word
            const newCards = await Promise.all(
                suggestions.map(async (suggestedWord) => {
                    const cardResponse = await fetch(`/api/cards?word=${suggestedWord}`);
                    const cardData = await cardResponse.json();
                    return {
                        imageSrc: cardData.image,
                        title: cardData.word,
                        color: "#f9de8b",
                        type: "vertical",
                    };
                })
            );

            // Update current cards with new recommendations
            setCurrentCards(newCards);
        } catch (error) {
            console.error("Error fetching recommendations or cards:", error);
        }
    };

    return (
        <div className="ml-20 p-6 bg-[url('/bg.png')] min-h-screen">
    {/* Flex container to align items in a row */}
    <div className="flex items-center space-x-4 mb-6">
        {/* Sentence Input Bar */}
        <div
            className="bg-white text-3xl text-gray-800 px-4 py-5 flex rounded-lg shadow-md border-2 border-purple-400 w-full max-w-4xl ml-5 transform hover:scale-104 transition-all duration-200"
            onClick={handleSentenceClick} // Trigger sentence correction here
        >
            <Image
                src="/communication.png"
                alt="communication icon"
                width={50}
                height={50}
            />
            <span className="ml-4 mt-2">{sentence}</span> {/* Display the sentence here */}
        </div>
        {/* Add X button next to the sentence */}
        <button
            onClick={clearSelectedWords}
            className="bg-white text-3xl text-gray-800 px-4 py-5 flex rounded-lg shadow-md border-2 border-purple-400 w-24 h-24 justify-center items-center ml-5 text-2xl text-red-500 hover:text-red-700 transform hover:scale-110 transition-all duration-200"
            aria-label="Clear selected words"
        >
            ❌
        </button>
    </div>
            {/* Category Cards (Always Visible) */}
            <div className="flex flex-wrap gap-6 p-5">
                {cardDataCircle.map((item, index) => (
                    <CategoryCard
                        key={index}
                        imageSrc={item.imageSrc}
                        title={item.title}
                        color={item.color}
                        onClick={() => handleCategoryCardClick(item.title)}
                    />
                ))}
            </div>

            <div>
                {/* Vocabulary Cards */}
                <div className="flex flex-wrap gap-6 p-5">
                    {currentCards
                        .filter((item) => item.type === "vertical")
                        .map((item, index) => (
                            <VocabCard
                                key={index}
                                imageSrc={item.imageSrc}
                                title={item.title}
                                color={item.color}
                                onClick={() => handleCardClick(item.title)}
                            />
                        ))}
                </div>

                {/* Common Phrases Cards */}
                <div className="flex flex-wrap gap-6 p-5">
                    {currentCards
                        .filter((item) => item.type === "horizontal")
                        .map((item, index) => (
                            <PhraseCard
                                key={index}
                                imageSrc={item.imageSrc}
                                title={item.title}
                                color={item.color}
                                onClick={() => textToSpeech(item.title)}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
};
export default CommunicationMain;