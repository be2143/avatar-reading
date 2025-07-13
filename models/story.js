import mongoose, { Schema, models } from "mongoose";

// Define a schema for individual scenes within a story
const sceneSchema = new Schema({
  // Using 'id' from the frontend mapping, which comes from sceneData.sceneNumber
  id: { type: Number, required: true },
  title: { type: String }, // Corresponds to `Scene N` title from frontend
  text: { type: String, required: true }, // The scene's text snippet
  image: { type: String }, // The URL of the generated image for this scene
  // imagePrompt: { type: String }, // Keep if you want to store the exact DALL-E prompt used for the image
});

// Define the main story schema
const storySchema = new Schema(
  {
    // The default MongoDB _id (ObjectId) is best for unique identification.
    // If you need a specific string 'id' for external reasons, keep it,
    // but often it's redundant with _id.
    // However, if you explicitly want to use a `dummyStoryId` from frontend
    // as a persistent string ID, let's keep it but make it sparse.
    dummyStoryId: { type: String, unique: true, sparse: true }, // Used for temporary tracking before _id is set

    title: { type: String, required: true },
    description: { type: String }, // Corresponds to 'purpose/situation'
    story_content: { type: String, required: true }, // This stores the full generated text

    category: { type: String },
    ageGroup: { type: String },
    storyLength: { type: String },
    specificScenarios: { type: String }, // Additional details/guidelines for generation

    // --- NEW FIELDS FOR CHARACTER CONSISTENCY & VISUALS ---
    mainCharacterDescription: { type: String }, // Detailed description of the main character
    otherCharacters: [{ type: String }],         // Array of descriptions for other characters
    selectedStyle: { type: String },             // The visual style chosen (e.g., 'cartoon')
    visualScenes: [sceneSchema],                 // Array of visual scene objects

    // --- GENERATION & IMAGE STATUS ---
    isGenerated: { type: Boolean, default: false }, // True if story text was AI-generated
    hasImages: { type: Boolean, default: false },   // True if visuals have been generated

    // --- STORY SOURCE & AUTHORSHIP ---
    source: {
      type: String,
      enum: ['system', 'generated', 'uploaded'],
      default: 'generated', // Default to 'generated' as this flow is for AI generation
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Assuming you have a User model for authentication
      default: null
    },
    // The following are more relevant for 'uploaded' source stories,
    // but you can keep them if you envision merging functionalities.
    authorName: { type: String },
    uploadedFileName: { type: String },

    // --- PERSONALIZATION (from your original model) ---
    isPersonalized: { type: Boolean, default: false },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },

    // Removed fields not currently used in the generation flow:
    // chapter: String,
    // explanation: String,
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Export the model
export default models.Story || mongoose.model("Story", storySchema);