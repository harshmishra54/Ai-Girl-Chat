const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  username: String,
  paymentVerified: { type: Boolean, default: false },
  paymentId: String,
  planExpiresAt: Date,
});

module.exports = mongoose.model("User", userSchema);
