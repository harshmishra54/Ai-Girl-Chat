// models/MessageLog.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  telegramId: String,
  message: String,
  response: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("MessageLog", messageSchema);
