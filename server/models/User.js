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
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
