import mongoose, { Schema } from "mongoose";

const sceneSchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String },
  text: { type: String, required: true },
  image: { type: String },
});

const activitySchema = new Schema({
  activity: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new Schema({
  sessionNum: { type: Number, required: true },
  sessionDate: { type: Date, required: true, default: Date.now },
  timeSpent: { type: Number, required: true },
  sessionNotes: { type: String },
  comprehensionScore: { type: String },
});

const storySchema = new Schema(
  {
    dummyStoryId: { type: String, unique: true, sparse: true },
    title: { type: String, required: true },
    description: { type: String },
    story_content: { type: String, required: true },
    story_content_arabic: { type: String },
    category: { type: String },
    ageGroup: { type: String },
    storyLength: { type: String },
    specificScenarios: { type: String },
    mainCharacterDescription: { type: String },
    mainCharacterName: { type: String }, // Name of the main character used in visuals
    initialCartoonBaseImageUrl: { type: String }, // Character reference image for regeneration
    otherCharacters: [{ type: String }],
    visualScenes: [sceneSchema],
    sessions: [sessionSchema], 
    isGenerated: { type: Boolean, default: false },
    hasImages: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['system', 'generated', 'uploaded'],
      default: 'generated',
      required: true
    },
    authorName: { type: String }, 
    isPersonalized: { type: Boolean, default: false },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: { type: String },
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
      required: true
    },
    goal: { type: String }, // Goal for personalized stories
    savedActivities: [activitySchema], // Activities with rating >= 3
    activityFeedback: [{ type: String }], // Feedback from activities with rating < 3
  },
  { timestamps: true }
);

// Delete the cached model to ensure schema changes are applied
if (mongoose.models.Story) {
  delete mongoose.models.Story;
}

export default mongoose.model("Story", storySchema);