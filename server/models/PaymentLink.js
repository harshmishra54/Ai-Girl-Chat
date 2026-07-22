const mongoose = require("mongoose");

const paymentLinkSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  durationLabel: { type: String, required: true },
  link: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

paymentLinkSchema.index({ telegramId: 1, amount: 1, expiresAt: -1 });

module.exports = mongoose.models.PaymentLink || mongoose.model("PaymentLink", paymentLinkSchema);
