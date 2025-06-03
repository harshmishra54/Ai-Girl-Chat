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

// Function to create Razorpay payment link
async function createPaymentLink(telegramId) {
  try {
    const paymentLink = await razorpay.paymentLink.create({
      amount: 9900, // ₹99 in paise
      currency: "INR",
      description: "AI Girl Chat Premium - 30 days",
      customer: {
        name: `Telegram User ${telegramId}`,
        email: `${telegramId}@telegram.com`, // dummy email
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: true,
      notes: { telegramId: telegramId.toString() },
      expiry_date: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days expiry
    });
    return paymentLink.short_url;
  } catch (err) {
    console.error("Razorpay create payment link error:", err);
    return null;
  }
}

// Webhook endpoint for Telegram bot updates
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
  const isOwner = user.telegramId === "5405202126"; // ✅ You have unlimited access

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      "👋 Welcome to *AI Girl Chat*!\n\nYou can chat with the AI now.\nYou get 10 minutes of free access!\n\nUse `/verify payment_id` to unlock unlimited access.",
      { parse_mode: "Markdown" }
    );
    return res.sendStatus(200);
  }

  if (text === "/help") {
    await bot.sendMessage(
      chatId,
      "🆘 *Available Commands:*\n" +
        "/start - Get started\n" +
        "/verify payment_id - Verify your payment\n" +
        "/help - Show this help message",
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
    if (result.success) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      user.paymentVerified = true;
      user.paymentId = paymentId;
      user.planExpiresAt = expiry;
      await user.save();

      await bot.sendMessage(
        chatId,
        "✅ Payment verified! You now have full access for 30 days."
      );
    } else {
      await bot.sendMessage(
        chatId,
        "❌ Payment verification failed. Please check your ID."
      );
    }
    return res.sendStatus(200);
  }

  // 🧠 Trial logic — only apply to non-owner users
  if (!user.paymentVerified && !isOwner) {
    const minutesUsed = (now - new Date(user.freeChatStart)) / 60000;
    console.log(`User trial minutes used: ${minutesUsed.toFixed(2)}`);

    if (minutesUsed > 10) {
      const paymentUrl = await createPaymentLink(chatId);
      if (paymentUrl) {
        await bot.sendMessage(
          chatId,
          `⏳ Your *10-minute free trial* is over.\n\n💳 Buy a plan here: ${paymentUrl}\n\nAfter payment, type \`/verify payment_id\` to activate.`,
          { parse_mode: "Markdown" }
        );
      } else {
        await bot.sendMessage(
          chatId,
          "⚠️ Sorry, we couldn't generate a payment link right now. Please try again later."
        );
      }
      return res.sendStatus(200);
    }

    if (isNewUser && !text.startsWith("/")) {
      await bot.sendMessage(
        chatId,
        "👋 Welcome! You have a 10-minute free trial to chat with AI.\n" +
          "After that, you can buy a subscription.\n\nType /help for commands."
      );
      return res.sendStatus(200);
    }
  } else if (!isOwner && user.planExpiresAt && user.planExpiresAt < now) {
    await bot.sendMessage(
      chatId,
      "⚠️ Your plan has expired.\n\nPlease [renew your subscription](https://aigirlchat54329.mojo.page/ai-girl-chat-membership) and type `/verify payment_id`.",
      { parse_mode: "Markdown" }
    );
    return res.sendStatus(200);
  }

  // 🤖 Call AI API
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

    const aiReply = await sendMessageToApi(text);

    await MessageLog.create({
      telegramId: chatId,
      message: text,
      response: aiReply,
    });

    await bot.sendMessage(chatId, aiReply);
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    await bot.sendMessage(
      chatId,
      "⚠️ Something went wrong. Please try again later."
    );
  }

  res.sendStatus(200);
});

// Razorpay webhook for payment link paid event
app.post("/webhook/razorpay", express.json({ type: "application/json" }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (signature !== expectedSignature) {
    console.warn("Invalid Razorpay webhook signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  if (event === "payment_link.paid") {
    const paymentLink = req.body.payload.payment_link.entity;
    const telegramId = paymentLink.notes.telegramId;
    const paymentId = paymentLink.payment_id;

    if (!telegramId) {
      console.warn("Webhook: no telegramId in notes");
      return res.status(400).send("Missing telegramId");
    }

    // Update user payment status
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    try {
      await User.findOneAndUpdate(
        { telegramId },
        {
          paymentVerified: true,
          paymentId,
          planExpiresAt: expiry,
        }
      );
      console.log(`Webhook: Payment verified for user ${telegramId}`);
    } catch (error) {
      console.error("Webhook DB update error:", error);
      return res.status(500).send("DB update failed");
    }
  }

  res.status(200).send("ok");
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 8080;
    if (APP_URL) {
      app.listen(PORT, () => {
        console.log(`Express server running on port ${PORT}`);
      });

      // Set webhook for Telegram bot
      const url = `${APP_URL}/bot${BOT_TOKEN}`;
      bot.setWebHook(url).then(() => {
        console.log(`Webhook set at ${url}`);
      });
    } else {
      console.log("Polling mode active");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
