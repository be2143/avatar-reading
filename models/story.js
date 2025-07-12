import mongoose from "mongoose";

const sceneSchema = new mongoose.Schema({
  text: { type: String, required: true },
  imageUrl: { type: String, required: true },
  // You might add an imagePrompt field here if you want to store the exact prompt used for this scene's image
  // imagePrompt: { type: String },
});

const storySchema = new mongoose.Schema({
  id: { type: String, unique: true },  // add this
  // id: Number, // Mongoose automatically creates an _id (ObjectId). You typically don't need a separate 'id' field unless it's an external ID.
  title: { type: String, required: true }, // Make title required
  description: { type: String }, // Corresponds to purpose/situation
  // chapter: String, // Keep if needed for other functionality, but not used in current flow
  // explanation: String, // Keep if needed for other functionality, but not used in current flow
  story_content: { type: String, required: true }, // This will store the generatedText
  category: { type: String },
  ageGroup: { type: String }, // Add ageGroup from your frontend form
  storyLength: { type: String }, // Add storyLength from your frontend form
  specificScenarios: { type: String }, // Add specificScenarios from your frontend form

  isPersonalized: { type: Boolean, default: false },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },

  // --- NEW FIELDS FOR GENERATION STATUS AND VISUALS ---
  isGenerated: { type: Boolean, default: false }, // True once text is successfully generated and saved
  hasImages: { type: Boolean, default: false },   // True once images are successfully generated and saved
  scenes: [sceneSchema], // Array of sub-documents for each scene
  
  // --- STORY SOURCE INFORMATION ---
  source: { 
    type: String, 
    enum: ['system', 'generated', 'uploaded'], 
    default: 'system',
    required: true 
  }, // Indicates if story was system-provided, AI generated, or user uploaded
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }, // Reference to user who created/uploaded the story
  authorName: { type: String }, // For uploaded stories, store the original author name
  uploadedFileName: { type: String }, // For uploaded stories, store original file name
  // ----------------------------------------------------

}, { timestamps: true });

export default mongoose.models.Story || mongoose.model("Story", storySchema);