import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: { type: Number, required: true },
  diagnosis: { type: String, required: true },
  birthday: String,
  guardian: String,
  contact: String,
  comprehensionLevel: {
    type: String,
    required: true,
  },
  preferredStoryLength: {
    type: String,
    required: true,
  },
  preferredSentenceLength: {
    type: String,
    required: true,
  },
  learningPreferences: {
    type: String,
    default: ""
  },
  interests: {
    type: String,
    default: ""
  },
  challenges: {
    type: String,
    default: ""
  },
  goals: {
    type: String,
    default: ""
  },
  notes: {
    type: String,
    default: ""
  },
  personalizedStories: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Story' }
  ],
  startedDate: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,
    default: "",
  },
  cartoonImage: {
    type: String,
    default: "",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openAiFileId: {
    type: String,
    required: false,
    unique: false,
  },
  currentBehavioralScore: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 10
  },
  behavioralScoreHistory: [{
    score: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  challenge: { type: String, default: "" },
  goals: { type: String, default: "" },
  characterImages: {
    type: Map,
    of: String,
    default: () => new Map()
  }, // Store generated character images: { "Mom": "url1", "Dad": "url2", ... }
}, {
  timestamps: true,
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;
