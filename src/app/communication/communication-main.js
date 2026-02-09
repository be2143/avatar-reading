"use client"; // Add this if you're using Next.js App Router (for Next.js 13+)
import { useState } from "react";
import React from "react";
import Image from "next/image";
import Card from "../components/VocabCard"; // Adjust the path based on your structure
import HorizontalCard from "../components/HorizontalCard";
import CircleCard from "../components/CircleCard";

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

const CommunicationMain = () => {
    const [sentence, setSentence] = useState("..."); // Initial sentence
    const [currentCards, setCurrentCards] = useState([
        ...cardDataVertical,
        ...cardDataHorizontal,
    ]);
    const [selectedWords, setSelectedWords] = useState([]);

    const handleCardClick = async (word, type) => {
        if (type === "circle") {
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
        } else {
            // Update sentence
            setSentence((prev) => (prev === "..." ? word : `${prev} ${word}`));
            const updatedSelectedWords = [...selectedWords, word];
            setSelectedWords(updatedSelectedWords);

            try {
                // POST to /api/recommendations
                const recommendationsResponse = await fetch("/api/recommendations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ selectedWords: updatedSelectedWords }),
                });

                if (!recommendationsResponse.ok) {
                    throw new Error(`Error: ${recommendationsResponse.statusText}`);
                }

                const recommendationsData = await recommendationsResponse.json();
                const { suggestions } = recommendationsData;

                // Fetch cards for each suggested word
                const newCards = await Promise.all(
                    suggestions.map(async (suggestedWord) => {
                        const cardResponse = await fetch(`/api/cards?word=${suggestedWord}`);
                        const cardDataVertical = await cardResponse.json();
                        return {
                            imageSrc: `${cardDataVertical.image}`,
                            title: cardDataVertical.word,
                            color: "#f9de8b",
                            type: "vertical"
                        };
                    })
                );

                // Update current cards with new recommendations
                setCurrentCards(newCards);
            } catch (error) {
                console.error("Error fetching recommendations or cards:", error);
            }

            // 🔊 **Text-to-Speech Integration**
            try {
                const response = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: word })
                });

                if (!response.ok) throw new Error('Failed to fetch audio');

                // Create blob from the audio data
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);

                // Play the audio
                const audio = new Audio(audioUrl);
                await audio.play();

                // Clean up the URL after playing
                audio.onended = () => URL.revokeObjectURL(audioUrl);
            } catch (error) {
                console.error('Error playing audio:', error);
            }
        }
    }

    return (
        <div className="ml-20 p-6 bg-[url('/bg.png')] min-h-screen">
            {/* Sentence Input Bar */}
            <div className="bg-white text-3xl text-gray-800 px-4 py-5 flex rounded-lg shadow-md border-2 border-purple-400 w-full max-w-4xl ml-5 mb-6">
                <Image
                    src="/communication.png"
                    alt="communication icon"
                    width={50}
                    height={50}
                    className="object-contain mb-3 mr-10 ml-5"
                />
                <p className="mt-3">{sentence}</p>
            </div>

            {/* Circle Cards (Always Visible) */}
            <div className="flex flex-wrap gap-6 p-5">
                {cardDataCircle.map((item, index) => (
                    <CircleCard
                        key={index}
                        imageSrc={item.imageSrc}
                        title={item.title}
                        color={item.color}
                        onClick={() => handleCardClick(item.title, "circle")}
                    />
                ))}
            </div>

            <div>
                {/* Vertical Cards */}
                <div className="flex flex-wrap gap-6 p-5">
                    {currentCards
                        .filter((item) => item.type === "vertical")
                        .map((item, index) => (
                            <Card
                                key={index}
                                imageSrc={item.imageSrc}
                                title={item.title}
                                color={item.color}
                                onClick={() => handleCardClick(item.title, "vertical")}
                            />
                        ))}
                </div>

                {/* Horizontal Cards */}
                <div className="flex flex-wrap gap-6 p-5">
                    {currentCards
                        .filter((item) => item.type === "horizontal")
                        .map((item, index) => (
                            <HorizontalCard
                                key={index}
                                imageSrc={item.imageSrc}
                                title={item.title}
                                color={item.color}
                                onClick={() => handleCardClick(item.title, "horizontal")}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
};
export default CommunicationMain;
