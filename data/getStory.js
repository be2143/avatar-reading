// Import mongoose and your Story model
import mongoose from "mongoose";
import pkg from 'mongoose';
const { Schema, models } = pkg; // Destructure Schema and models from pkg

import Story from "../models/Story.js"; // Adjust the path to your Story model file

// IMPORTANT: Replace with your actual MongoDB URI
const MONGODB_URI = "mongodb+srv://be2143:HbnUc1DeihKQ0lUG@cluster0.enjzhry.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // <<< IMPORTANT: Replace with your MongoDB URI

async function getAllStoriesFromDB() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected successfully!");

        // Find all stories in the database
        const stories = await Story.find({}).lean(); // .lean() makes the query faster by returning plain JavaScript objects

        if (stories.length > 0) {
            console.log(`Found ${stories.length} stories in the database:`);
            stories.forEach((story, index) => {
                console.log(`--- Story ${index + 1} ---`);
                console.log(`ID: ${story.dummyStoryId || story._id}`); // Use dummyStoryId if available, otherwise _id
                console.log(`Title: ${story.title}`);
                console.log(`Category: ${story.category}`);
                console.log(`Source: ${story.source}`);
                console.log(`Story Content (first 100 chars): ${story.story_content.substring(0, 100)}...`);
                console.log('--------------------');
            });
        } else {
            console.log("No stories found in the database.");
        }

    } catch (error) {
        console.error("Error fetching stories from the database:", error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}

// Run the function
getAllStoriesFromDB();
