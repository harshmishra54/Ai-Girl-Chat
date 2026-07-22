const Payment = require("../models/Payment");
const User = require("../models/User");
const { calculateExpiry, getEffectiveExpiry, getPlan } = require("./subscription");

async function activatePayment({ paymentId, telegramId, amount, verifiedAt = new Date(), source, raw = {} }) {
  const normalizedTelegramId = String(telegramId || "");
  const normalizedAmount = Number(amount);
  const plan = getPlan(normalizedAmount);
  if (!paymentId || !normalizedTelegramId || !plan) throw new Error("Invalid payment activation data");

  const existingPayment = await Payment.findOne({ paymentId });
  if (existingPayment) {
    if (existingPayment.telegramId !== normalizedTelegramId) throw new Error("Payment already belongs to another user");
    const existingUser = await User.findOne({ telegramId: normalizedTelegramId });
    if (!existingUser) throw new Error("Telegram user not found");
    if (!existingUser.planExpiresAt || new Date(existingUser.planExpiresAt) < new Date(existingPayment.expiresAt)) {
      existingUser.paymentVerified = new Date(existingPayment.expiresAt) > new Date();
      existingUser.paymentId = existingPayment.paymentId;
      existingUser.paymentAmount = existingPayment.amount;
      existingUser.paymentVerifiedAt = existingPayment.verifiedAt;
      existingUser.planExpiresAt = existingPayment.expiresAt;
      await existingUser.save();
    }
    return { payment: existingPayment, user: existingUser, duplicate: true };
  }

  const user = await User.findOne({ telegramId: normalizedTelegramId });
  if (!user) throw new Error("Telegram user not found");

  const expiresAt = calculateExpiry(normalizedAmount, user.planExpiresAt, verifiedAt);
  let payment;
  try {
    payment = await Payment.create({
      paymentId,
      telegramId: normalizedTelegramId,
      amount: normalizedAmount,
      planLabel: plan.label,
      verifiedAt,
      expiresAt,
      source,
      status: "captured",
      raw: {
        orderId: raw.order_id,
        method: raw.method,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return activatePayment({ paymentId, telegramId, amount, verifiedAt, source, raw });
    }
    throw error;
  }

  user.paymentVerified = true;
  user.paymentId = paymentId;
  user.paymentAmount = normalizedAmount;
  user.paymentVerifiedAt = verifiedAt;
  user.planExpiresAt = expiresAt;
  await user.save();
  return { payment, user, duplicate: false };
}

async function expireSubscriptionIfNeeded(user, now = new Date()) {
  if (!user?.paymentVerified) return false;
  const expiry = getEffectiveExpiry(user);
  if (expiry && !user.planExpiresAt) {
    user.planExpiresAt = expiry;
    await user.save();
  }
  if (expiry && expiry > now) return false;
  user.paymentVerified = false;
  await user.save();
  return true;
}

module.exports = { activatePayment, expireSubscriptionIfNeeded };
