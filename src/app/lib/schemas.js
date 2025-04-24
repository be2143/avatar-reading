// src/app/lib/schemas.js
import mongoose from "mongoose";

// Schema definitions
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  diagnosis: String,
  preferred_words: [String],
  past_interactions: Array,
}, { collection: "Users" });

const cardSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  image: { type: String },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  follow_up_words: [{ type: String }]
}, { collection: 'Cards' });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }]
}, { collection: 'Categories' });

const cacheSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  word: { type: String, required: true },
  recommendations: [{ type: String }],
  createdAt: { type: Date, default: Date.now, expires: 3600 }
}, { collection: 'Cache' });

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageSrc: { type: String, required: true },
  icon: { type: String, required: true},
  color: { type: String, default: "#ffffff" },
  planned: { type: Boolean, default: false },
  state: { type: String, default: "not done" }
}, { collection: 'Activities' });

// Check if models exist before creating them
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Cache = mongoose.models.Cache || mongoose.model("Cache", cacheSchema);
const Activity = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

export { User, Card, Category, Cache, Activity };