const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const checkPaymentStatus = require("./utils/checkPaymentStatus");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL;
const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";
const MONGO_URI = process.env.MONGO_URI;

const bot = APP_URL
  ? new TelegramBot(BOT_TOKEN)
  : new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();
app.use(express.json());

// ✅ MongoDB User Schema
const userSchema = new mongoose.Schema({
  telegramId: String,
  email: String,
  paymentVerified: { type: Boolean, default: false },
  paymentId: String,
  planExpiresAt: Date,
  freeChatStart: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ✅ Webhook endpoint
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (!chatId || !text) return res.sendStatus(200);

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = await User.create({ telegramId: chatId });
  }

  const now = new Date();

  // ✅ Handle /verify <payment_id>
  if (text.startsWith("/verify")) {
    const parts = text.split(" ");
    const paymentId = parts[1];

    if (!paymentId) {
      await bot.sendMessage(chatId, "❗Usage: `/verify <payment_id>`", { parse_mode: "Markdown" });
      return res.sendStatus(200);
    }

    const result = await checkPaymentStatus(paymentId);
    if (result.success) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30); // 30 days validity

      user.paymentVerified = true;
      user.paymentId = paymentId;
      user.planExpiresAt = expiry;
      await user.save();

      await bot.sendMessage(chatId, "✅ Payment verified! You now have full access for 30 days.");
    } else {
      await bot.sendMessage(chatId, "❌ Payment verification failed. Please check your ID.");
    }
    return res.sendStatus(200);
  }

  // ✅ Trial or Subscription logic
  if (!user.paymentVerified) {
    const minutesUsed = (now - user.freeChatStart) / 60000;
    if (minutesUsed > 10) {
      await bot.sendMessage(
        chatId,
        "⏳ Your *10-minute free trial* is over.\n\n💳 Buy a plan to continue chatting:\n[Click here to pay](https://aigirlchat54329.mojo.page/ai-girl-chat-membership)\n\nAfter payment, type `/verify <your_payment_id>`",
        { parse_mode: "Markdown" }
      );
      return res.sendStatus(200);
    }
  } else if (user.planExpiresAt < now) {
    await bot.sendMessage(
      chatId,
      "⚠️ Your plan has expired.\n\nPlease [renew your subscription](https://aigirlchat54329.mojo.page/ai-girl-chat-membership) and type `/verify <payment_id>`.",
      { parse_mode: "Markdown" }
    );
    return res.sendStatus(200);
  }

  try {
    // Retry logic to handle errors from AI API
    const sendMessageToApi = async (message, retries = 1) => {
      try {
        const response = await axios.post(
          API_URL,
          { message },
          {
            headers: {
              "x-api-key": BOT_API_KEY,
            },
          }
        );
        return response.data.reply || "Sorry, I didn't get that.";
      } catch (error) {
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 2000));
          return sendMessageToApi(message, retries - 1);
        }
        throw error;
      }
    };

    const aiReply = await sendMessageToApi(text);
    await bot.sendMessage(chatId, aiReply);
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    await bot.sendMessage(chatId, "⚠️ Something went wrong. Please try again later.");
  }

  res.sendStatus(200);
});

// ✅ DB Connection and Webhook Setup
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    if (APP_URL) {
      const webhookURL = `${APP_URL}/bot${BOT_TOKEN}`;
      await bot.setWebHook(webhookURL);
      console.log("✅ Webhook set to:", webhookURL);
    }
  } catch (err) {
    console.error("❌ Startup error:", err.message);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
