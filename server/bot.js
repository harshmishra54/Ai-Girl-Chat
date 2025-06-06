const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

const checkPaymentStatus = require("./utils/checkPaymentStatus");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL;
const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";
const MONGO_URI = process.env.MONGO_URI;

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const bot = APP_URL
  ? new TelegramBot(BOT_TOKEN)
  : new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();
app.use(express.json());

// =============== MONGOOSE SCHEMAS ===============
const userSchema = new mongoose.Schema({
  telegramId: String,
  email: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
  paymentAmount: Number,
  paymentVerifiedAt: Date,
  paymentId: String,
  planExpiresAt: Date,
  freeChatStart: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema({
  telegramId: String,
  message: String,
  response: String,
  timestamp: { type: Date, default: Date.now },
});
const MessageLog = mongoose.model("MessageLog", messageSchema);

// =============== PAYMENT LINK GENERATOR ===============
async function createPaymentLink(telegramId, amount, durationLabel) {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      description: `AI Girl Chat Premium - ${durationLabel}`,
      customer: {
        name: `Telegram User ${telegramId}`,
        email: `${telegramId}@telegram.com`,
      },
      notify: { sms: false, email: false },
      reminder_enable: true,
      notes: { telegramId: telegramId.toString() },
      expire_by: Math.floor(Date.now() / 1000) + 86400 * 3,
    });
    return paymentLink.short_url;
  } catch (err) {
    console.error("Razorpay error:", err.error || err.message);
    return null;
  }
}

// =============== TELEGRAM BOT HANDLER ===============
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  try {
    const update = req.body;
    const chatId = update.message?.chat?.id;
    const text = update.message?.text;

    if (!chatId || !text) return res.sendStatus(200);

    let user = await User.findOne({ telegramId: chatId });
    const now = new Date();
    const isOwner = chatId === 5405202126;

    if (!user) {
      const email = update.message.from?.username
        ? `${update.message.from.username}@telegram.com`
        : `${chatId}@anon.com`;

      user = await User.create({
        telegramId: chatId,
        email,
        freeChatStart: now,
      });

      console.log(`New user created: ${chatId}`);
    }

    // ========== EXPIRED PLAN CHECK ==========
    if (user.paymentVerified && user.planExpiresAt && now > user.planExpiresAt) {
      user.paymentVerified = false;
      user.planExpiresAt = null;
      await user.save();

      const link1 = await createPaymentLink(chatId, 20, "1 Day");
      const link2 = await createPaymentLink(chatId, 59, "7 Days");
      const link3 = await createPaymentLink(chatId, 99, "30 Days");

      await bot.sendMessage(
        chatId,
        `❌ Your subscription has expired.\n\nChoose a plan to continue:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}`,
        { parse_mode: "Markdown" }
      );

      return res.sendStatus(200);
    }

    if (text === "/start") {
      await bot.sendMessage(
        chatId,
        "👋 Welcome to *AI Girl Chat*!\n\nYou have 10 minutes of free trial.\nAfter that, choose a subscription:\n\n1️⃣ ₹20 - 1 Day\n2️⃣ ₹59 - 7 Days\n3️⃣ ₹99 - 30 Days\n\nType `/verify payment_id` after payment.",
        { parse_mode: "Markdown" }
      );
      return res.sendStatus(200);
    }

    if (text === "/help") {
      await bot.sendMessage(
        chatId,
        "🆘 *Available Commands:*\n/start - Get started\n/verify payment_id - Verify your payment\n/help - Show this help message",
        { parse_mode: "Markdown" }
      );
      return res.sendStatus(200);
    }

    if (text.startsWith("/verify")) {
      const parts = text.split(" ");
      const paymentId = parts[1];

      if (!paymentId) {
        await bot.sendMessage(chatId, "❗Usage: `/verify payment_id`", {
          parse_mode: "Markdown",
        });
        return res.sendStatus(200);
      }

      const result = await checkPaymentStatus(paymentId);
      if (!result.success) {
        await bot.sendMessage(chatId, "❌ Invalid or failed payment ID.");
        return res.sendStatus(200);
      }

      const amount = result.amount / 100;
      const paymentTime = new Date(result.created_at * 1000);
      const ageInHours = (now - paymentTime) / 1000 / 60 / 60;

      if (
        (amount === 20 && ageInHours > 24) ||
        (amount === 59 && ageInHours > 168) ||
        (amount === 99 && ageInHours > 720)
      ) {
        await bot.sendMessage(chatId, "❗This payment has expired. Please buy a new plan.");
        return res.sendStatus(200);
      }

      const existingUser = await User.findOne({ paymentId });
      if (existingUser && existingUser.telegramId !== chatId) {
        await bot.sendMessage(chatId, "❗This payment ID is already used by another user.");
        return res.sendStatus(200);
      }

      const expiry = new Date();
      if (amount === 20) expiry.setDate(expiry.getDate() + 1);
      else if (amount === 59) expiry.setDate(expiry.getDate() + 7);
      else if (amount === 99) expiry.setDate(expiry.getDate() + 30);

      user.paymentVerified = true;
      user.paymentId = paymentId;
      user.planExpiresAt = expiry;
      user.paymentAmount = amount;
      user.paymentVerifiedAt = new Date();

      await user.save();

      await bot.sendMessage(
        chatId,
        `✅ Payment of ₹${amount} verified! Your access is active until ${expiry.toDateString()}.`
      );
      return res.sendStatus(200);
    }

    const start = new Date(user.freeChatStart);
    const diffInMinutes = (now - start) / 1000 / 60;
    const allowed = isOwner || user.paymentVerified || diffInMinutes < 10;

    if (!allowed) {
      const link1 = await createPaymentLink(chatId, 20, "1 Day");
      const link2 = await createPaymentLink(chatId, 59, "7 Days");
      const link3 = await createPaymentLink(chatId, 99, "30 Days");

      await bot.sendMessage(
        chatId,
        `🕒 Your free trial has ended.\n\nChoose a plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}`,
        { parse_mode: "Markdown" }
      );
      return res.sendStatus(200);
    }

    const response = await axios.post(API_URL, {
      message: text,
      apiKey: BOT_API_KEY,
    });

    const reply = response.data.response || "🤖 Sorry, I couldn't understand that.";

    await bot.sendMessage(chatId, reply);

    await MessageLog.create({
      telegramId: chatId,
      message: text,
      response: reply,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Bot error:", err.message);
    res.sendStatus(200);
  }
});

// =============== RAZORPAY WEBHOOK ===============
app.post(
  "/razorpay/webhook",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
  async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expected) {
      return res.status(400).send("Invalid signature");
    }

    const payload = req.body;
    if (payload.event === "payment_link.paid") {
      const paymentId = payload.payload.payment.entity.id;
      const amount = payload.payload.payment.entity.amount;
      const telegramId = payload.payload.payment_link.entity.notes.telegramId;

      try {
        const user = await User.findOne({ telegramId });
        if (!user) return res.sendStatus(200);

        const expiry = new Date();
        const inrAmount = amount / 100;

        if (inrAmount === 20) expiry.setDate(expiry.getDate() + 1);
        else if (inrAmount === 59) expiry.setDate(expiry.getDate() + 7);
        else if (inrAmount === 99) expiry.setDate(expiry.getDate() + 30);

        user.paymentVerified = true;
        user.paymentId = paymentId;
        user.planExpiresAt = expiry;
        user.paymentAmount = inrAmount;
        user.paymentVerifiedAt = new Date();

        await user.save();

        if (!APP_URL) {
          await bot.sendMessage(
            telegramId,
            `✅ Payment of ₹${inrAmount} verified! Your access is active until ${expiry.toDateString()}.`
          );
        }

        console.log(`✔️ Payment verified for ${telegramId}`);
      } catch (err) {
        console.error("Webhook error:", err.message);
      }
    }

    res.sendStatus(200);
  }
);

// =============== SERVER START & WEBHOOK SETUP ===============
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    if (APP_URL) {
      try {
        const url = `${APP_URL}/bot${BOT_TOKEN}`;
        await bot.setWebHook(url);
        console.log(`Webhook set: ${url}`);
      } catch (webhookErr) {
        console.error("Webhook error:", webhookErr.message);
      }
    } else {
      console.log("Polling mode active");
    }
  })
  .catch((err) => console.error("MongoDB error:", err));
