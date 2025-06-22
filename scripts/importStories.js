import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Story from "../models/story.js";
import { connectMongoDB } from "../lib/mongodb.js";

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importStories() {
  try {
    await connectMongoDB();

    const filePath = path.resolve(__dirname, "../data/stories.json");
    const fileData = fs.readFileSync(filePath, "utf-8");

    const stories = JSON.parse(fileData);

    for (const story of stories) {
      await Story.findOneAndUpdate(
        { id: story.id },
        { $set: story },
        { upsert: true }
      );
    }

    console.log("✅ Stories imported successfully");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error importing stories:", error);
  }
}

importStories();
