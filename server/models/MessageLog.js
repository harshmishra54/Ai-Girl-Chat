const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, index: true },
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

messageSchema.index({ telegramId: 1, timestamp: -1 });

module.exports = mongoose.models.MessageLog || mongoose.model("MessageLog", messageSchema);
