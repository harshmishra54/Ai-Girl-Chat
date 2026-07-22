const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  telegramId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  planLabel: String,
  verifiedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true },
  source: { type: String, enum: ["manual", "webhook"], required: true },
  status: { type: String, default: "captured" },
  raw: {
    orderId: String,
    method: String,
  },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
