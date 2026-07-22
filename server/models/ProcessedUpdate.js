const mongoose = require("mongoose");

const processedUpdateSchema = new mongoose.Schema({
  updateId: { type: Number, required: true, unique: true, index: true },
  processedAt: { type: Date, default: Date.now, expires: 86400 },
});

module.exports = mongoose.models.ProcessedUpdate || mongoose.model("ProcessedUpdate", processedUpdateSchema);
