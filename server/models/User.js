const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  email: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
  paymentAmount: Number,
  paymentVerifiedAt: Date,
  paymentId: String,
  planExpiresAt: { type: Date, index: true },
  freeChatStart: { type: Date, default: Date.now },
  name: String,
  mood: { type: String, default: "💖 Romantic" },
  scene: String,
  flirtLevel: {
    type: String,
    enum: ["adaptive", "sweet", "flirty", "spicy"],
    default: "adaptive",
  },
  notificationsEnabled: { type: Boolean, default: false },
  adultConsentAt: Date,
  dominanceLevel: {
    type: String,
    enum: ["gentle", "teasing", "assertive", "dominant"],
    default: "teasing",
  },
  dominanceConsentAt: Date,
  intimacyLevel: { type: Number, min: 0, max: 5, default: 0 },
  messageCount: { type: Number, min: 0, default: 0 },
  relationshipStage: {
    type: String,
    enum: ["new", "flirty", "comfortable", "intimate", "deeply-familiar"],
    default: "new",
  },
  preferredTerms: { type: [String], default: [] },
  preferredFantasy: { type: String, default: "" },
  hardLimits: { type: [String], default: [] },
  softLimits: { type: [String], default: [] },
  aftercareEnabled: { type: Boolean, default: true },
  languagePreference: {
    type: String,
    enum: ["adaptive", "hinglish", "hindi", "english"],
    default: "adaptive",
  },
  messageLengthPreference: {
    type: String,
    enum: ["short", "medium"],
    default: "short",
  },
  preferredPetName: { type: String, default: "" },
  vocabularyStyle: {
    type: String,
    enum: ["mirror", "soft", "bold", "direct"],
    default: "mirror",
  },
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
