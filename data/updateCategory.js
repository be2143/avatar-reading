// updateCategories.js
import mongoose from "mongoose";
import pkg from 'mongoose';
const { Schema, models } = pkg;

// Adjust the path to your Story model file
import Story from "../models/Story.js";

// IMPORTANT: Replace with your actual MongoDB URI
const MONGODB_URI = "mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // <<< IMPORTANT: Replace with your MongoDB URI

async function updateStoryCategories() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully!");

        // Define the mapping from existing categories to your desired simplified categories.
        // Keys are the current categories (normalized to lowercase for matching),
        // Values are the new, desired categories (matching your <option> values).
        const categoryMapping = {
            'social skills': 'social',
            'school routines': 'school', // Maps to 'Routines' in your UI
            'community': 'community',
            'emotions': 'emotions',
            'digital world/technology': 'emotions', // Mapping 'Digital world/Technology' to 'emotions' as per your option list
            'family relationships': 'social',     // Mapping 'Family Relationships' to 'social'
            'time management': 'school',          // Mapping 'Time Management' to 'school' (Routines)
            'healthy habits': 'school',           // Mapping 'Healthy Habits' to 'school' (Routines/Self-care)
            'understanding adults': 'social',     // Mapping 'Understanding Adults' to 'social'
            'social': 'social', // Ensure existing 'social' stays 'social'
            'school': 'school', // Ensure existing 'school' stays 'school'
            // Add other existing categories that might be lowercase in your DB if needed
        };

        // Fetch all stories from the database
        const storiesToUpdate = await Story.find({}).lean(); // .lean() for faster retrieval of plain JS objects

        let updatedCount = 0;
        let skippedCount = 0;

        // Iterate over each story and apply the mapping
        for (const story of storiesToUpdate) {
            const currentCategory = story.category ? story.category.toLowerCase().trim() : '';
            const newCategory = categoryMapping[currentCategory];

            // Only update if a valid new category is found in the mapping
            // AND the new category is different from the current one
            if (newCategory && story.category !== newCategory) {
                await Story.findByIdAndUpdate(
                    story._id,
                    { $set: { category: newCategory } },
                    { new: true } // Return the updated document (optional, but good for logging)
                );
                updatedCount++;
            } else {
                skippedCount++;
            }
        }

    } catch (error) {
        console.error("Error updating stories:", error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}

// Run the function
updateStoryCategories();
