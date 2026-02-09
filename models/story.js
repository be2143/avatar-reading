import mongoose, { Schema } from "mongoose";

const sceneSchema = new Schema({
  id: { type: Number, required: true },
  title: { type: String },
  text: { type: String, required: true },
  image: { type: String },
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
    category: { type: String },
    ageGroup: { type: String },
    storyLength: { type: String },
    specificScenarios: { type: String },
    mainCharacterDescription: { type: String },
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
  },
  { timestamps: true }
);

export default mongoose.models.Story || mongoose.model("Story", storySchema);