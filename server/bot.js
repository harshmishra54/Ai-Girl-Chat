const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const translate = require("@vitalets/google-translate-api");
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

// Escape Markdown for Telegram messages
function escapeMarkdown(text) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

// User schema
const userSchema = new mongoose.Schema({
  telegramId: String,
  email: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
  paymentId: String,
  planExpiresAt: Date,
  freeChatStart: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

// Message log schema
const messageSchema = new mongoose.Schema({
  telegramId: String,
  message: String,
  response: String,
  timestamp: { type: Date, default: Date.now },
});
const MessageLog = mongoose.model("MessageLog", messageSchema);

// Webhook endpoint
app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  const update = req.body;
  const chatId = update.message?.chat?.id;
  const text = update.message?.text;

  if (!chatId || !text) return res.sendStatus(200);

  let user = await User.findOne({ telegramId: chatId });
  let isNewUser = false;

  if (!user) {
    const email = update.message.from?.username
      ? `${update.message.from.username}@telegram.com`
      : `${chatId}@anon.com`;

    user = await User.create({
      telegramId: chatId,
      email,
      freeChatStart: new Date(),
    });
    isNewUser = true;
    console.log(`Created new user ${chatId} with email ${email}`);
  }

  const now = new Date();
  const isOwner = user.telegramId === "5405202126";

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      escapeMarkdown(
        "👋 Welcome to *AI Girl Chat*!\n\nYou can chat with the AI now.\nYou get 10 minutes of free access!\n\nUse `/verify payment_id` to unlock unlimited access."
      ),
      { parse_mode: "MarkdownV2" }
    );
    return res.sendStatus(200);
  }

  if (text === "/help") {
    await bot.sendMessage(
      chatId,
      escapeMarkdown(
        "🆘 *Available Commands:*\n" +
          "/start - Get started\n" +
          "/verify payment_id - Verify your payment\n" +
          "/help - Show this help message"
      ),
      { parse_mode: "MarkdownV2" }
    );
    return res.sendStatus(200);
  }

  if (text.startsWith("/verify")) {
    const parts = text.split(" ");
    const paymentId = parts[1];

    if (!paymentId) {
      await bot.sendMessage(chatId, escapeMarkdown("❗Usage: `/verify payment_id`"), {
        parse_mode: "MarkdownV2",
      });
      return res.sendStatus(200);
    }

    const result = await checkPaymentStatus(paymentId);
    if (result.success) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      user.paymentVerified = true;
      user.paymentId = paymentId;
      user.planExpiresAt = expiry;
      await user.save();

      await bot.sendMessage(
        chatId,
        escapeMarkdown("✅ Payment verified! You now have full access for 30 days."),
        { parse_mode: "MarkdownV2" }
      );
    } else {
      await bot.sendMessage(
        chatId,
        escapeMarkdown("❌ Payment verification failed. Please check your ID."),
        { parse_mode: "MarkdownV2" }
      );
    }
    return res.sendStatus(200);
  }

  if (!user.paymentVerified && !isOwner) {
    const minutesUsed = (now - new Date(user.freeChatStart)) / 60000;
    console.log(`User trial minutes used: ${minutesUsed.toFixed(2)}`);

    if (minutesUsed > 10) {
      await bot.sendMessage(
        chatId,
        escapeMarkdown(
          "⏳ Your *10-minute free trial* is over.\n\n💳 Buy a plan to continue chatting:\n[Click here to pay](https://aigirlchat54329.mojo.page/ai-girl-chat-membership)\n\nAfter payment, type `/verify payment_id`"
        ),
        { parse_mode: "MarkdownV2", disable_web_page_preview: false }
      );
      return res.sendStatus(200);
    }

    if (isNewUser && !text.startsWith("/")) {
      await bot.sendMessage(
        chatId,
        escapeMarkdown(
          "👋 Welcome! You have a 10-minute free trial to chat with AI.\n" +
            "After that, you can buy a subscription.\n\nType /help for commands."
        ),
        { parse_mode: "MarkdownV2" }
      );
      return res.sendStatus(200);
    }
  } else if (!isOwner && user.planExpiresAt && user.planExpiresAt < now) {
    await bot.sendMessage(
      chatId,
      escapeMarkdown(
        "⚠️ Your plan has expired.\n\nPlease [renew your subscription](https://aigirlchat54329.mojo.page/ai-girl-chat-membership) and type `/verify payment_id`."
      ),
      { parse_mode: "MarkdownV2" }
    );
    return res.sendStatus(200);
  }

  // 🤖 AI translation and response logic
  try {
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

    // Translate user input to English
    const { text: translatedToEnglish } = await translate(text, { to: "en" });

    // Send to AI API
    const aiReply = await sendMessageToApi(translatedToEnglish);

    // Translate AI reply to Hindi
    const { text: translatedToHindi } = await translate(aiReply, { to: "hi" });

    // Log conversation
    await MessageLog.create({
      telegramId: chatId,
      message: text,
      response: translatedToHindi,
    });

    // Send reply
    await bot.sendMessage(chatId, escapeMarkdown(translatedToHindi), {
      parse_mode: "MarkdownV2",
    });
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    await bot.sendMessage(
      chatId,
      escapeMarkdown("⚠️ Something went wrong. Please try again later."),
      { parse_mode: "MarkdownV2" }
    );
  }

  res.sendStatus(200);
});

// DB connection and webhook setup
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
