import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: Number,
  diagnosis: String,
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
    required: true,
  },
  interests: {
    type: String,
    required: true,
  },
  challenges: {
    type: String,
    required: true,
  },
  personalizedStories: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Story' }
  ],
  startedDate: {
    type: Date,
    default: Date.now,
  },
  image: {
    type: String,  // base64 string or image URL (if storing in cloud storage)
    default: "",
  },
}, {
  timestamps: true,
});

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);
export default Student;