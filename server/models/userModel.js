const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ✅ Existing fields
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ✅ New fields for Telegram & Payments
  telegramId: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
  paymentId: { type: String, default: null },
  planExpiresAt: { type: Date, default: null },
  freeChatStart: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
