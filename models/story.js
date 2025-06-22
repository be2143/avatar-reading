import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  chapter: String,
  explanation: String,
  story_content: String,
  category: String,
  isPersonalized: Boolean,
}, { timestamps: true });

export default mongoose.models.Story || mongoose.model("Story", storySchema);
