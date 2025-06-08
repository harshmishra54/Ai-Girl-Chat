const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Image = require("./models/Image"); // Adjust the path if different

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

// ================= SCHEMAS =================
const userSchema = new mongoose.Schema({
  telegramId: String,
  email: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
   paymentAmount: Number, // Add this
  paymentVerifiedAt: Date, // Add this
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
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
  telegramId: String,
  amount: Number,
  verifiedAt: Date,
  raw: Object, // Optional: store full Razorpay response for logs/audits
});

const Payment = mongoose.model("Payment", paymentSchema);

// ================= PAYMENT LINK FUNCTION =================
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
      expire_by: Math.floor(Date.now() / 1000) + 86400 * 3, // use 'expire_by' instead of 'expiry_date'
    });
    return paymentLink.short_url;
  } catch (err) {
    console.error("Razorpay error:", err.error || err.message);
    return null;
  }
}

// ================= TELEGRAM WEBHOOK =================
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
    console.log(`New user created: ${chatId}`);
  }

  const now = new Date();
  const isOwner = user.telegramId === "5405202126";

  if (text === "/start") {
    await bot.sendMessage(
      chatId,
      "👋 Welcome to *AI Girl Chat*!\n\nYou have 10 minutes of free trial.\nAfter that, choose a subscription:\n\n1️⃣ ₹20 - 1 Day\n2️⃣ ₹59 - 7 Days\n3️⃣ ₹99 - 30 Days\n\nType `/verify payment_id` after payment.",
      { parse_mode: "Markdown" }
    );
    return res.sendStatus(200);
  }
    // ========== PHOTO REQUEST HANDLING ==========
  if (/\/photo|send.*photo/i.test(text)) {
    try {
      const imageCount = await Image.countDocuments();
      const randomIndex = Math.floor(Math.random() * imageCount);
      const imageDoc = await Image.findOne().skip(randomIndex);

      if (!imageDoc) {
        await bot.sendMessage(chatId, "❌ No image found in database.");
        return res.sendStatus(200);
      }

      await bot.sendPhoto(chatId, imageDoc.image, {
        caption: imageDoc.caption || "Here's something for you 😘",
      });

    } catch (error) {
      console.error("❌ Image fetch error:", error.message);
      await bot.sendMessage(chatId, "⚠️ Failed to send image.");
    }
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

  // Step 1: Prevent duplicate use of paymentId
  const existingPayment = await Payment.findOne({ paymentId });
  if (existingPayment) {
    await bot.sendMessage(
      chatId,
      "⚠️ This payment ID has already been used. If you believe this is a mistake, contact support."
    );
    return res.sendStatus(200);
  }

  // Step 2: Check Razorpay payment status
  const result = await checkPaymentStatus(paymentId);

  if (result.success) {
    const amount = result.amount / 100;
    const now = new Date();

    // Step 3: Validate that payment was made by this Telegram user
    const notesTelegramId = result.notes?.telegramId;
    if (notesTelegramId !== chatId.toString()) {
      await bot.sendMessage(
        chatId,
        `🚫 This payment was not made using your Telegram account.\nPlease use the link generated for your own ID.`
      );
      return res.sendStatus(200);
    }

    // Step 4: Update user info
    user.paymentVerified = true;
    user.paymentId = paymentId;
    user.paymentAmount = amount;
    user.paymentVerifiedAt = now;
    await user.save();

    // Step 5: Log payment in Payment collection
    await Payment.create({
      paymentId,
      telegramId: chatId.toString(),
      amount,
      verifiedAt: now,
      raw: result,
    });

    // Step 6: Set plan expiry message
    let expiry = new Date(now);
    if (amount === 20) expiry.setHours(expiry.getHours() + 24);
    else if (amount === 59) expiry.setHours(expiry.getHours() + 168);
    else if (amount === 99) expiry.setHours(expiry.getHours() + 720);

    await bot.sendMessage(
      chatId,
      `✅ Payment of ₹${amount} verified!\nYour access is active until *${expiry.toDateString()}*.`,
      { parse_mode: "Markdown" }
    );
  } else {
    await bot.sendMessage(
      chatId,
      "❌ Payment verification failed. Please make sure the payment ID is correct."
    );
  }

  return res.sendStatus(200);
}

  // ========== TRIAL & EXPIRY CHECK ==========
  if (!user.paymentVerified && !isOwner) {
    const minutesUsed = (now - new Date(user.freeChatStart)) / 60000;

    if (minutesUsed > 10) {
      const link1 = await createPaymentLink(chatId, 20, "1 Day");
      const link2 = await createPaymentLink(chatId, 59, "7 Days");
      const link3 = await createPaymentLink(chatId, 99, "30 Days");

      if (link1 && link2 && link3) {
        await bot.sendMessage(
          chatId,
          `⏳ *Your 10-minute free trial has ended.*\n\nChoose a plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}\n\nAfter payment, type \`/verify payment_id\` to activate.`,
          { parse_mode: "Markdown" }
        );
      } else {
        await bot.sendMessage(
          chatId,
          "⚠️ Could not generate payment links. Please try again later."
        );
      }
      return res.sendStatus(200);
    }

    if (isNewUser && !text.startsWith("/")) {
      await bot.sendMessage(
        chatId,
        "👋 Welcome! You have a 10-minute free trial to chat with AI.\n" +
          "After that, choose a plan starting at ₹20.\n\nType /help for commands."
      );
      return res.sendStatus(200);
    }
  }
   //// ===== CHECK PLAN BASED ON PAYMENT TIMESTAMP =====
if (!isOwner && user.paymentVerified) {
  const now = new Date();
  const verifiedAt = new Date(user.paymentVerifiedAt);
  const diffHours = (now - verifiedAt) / (1000 * 60 * 60);

  let planExpired = false;

  if (user.paymentAmount === 20 && diffHours > 24) planExpired = true;
  else if (user.paymentAmount === 59 && diffHours > 168) planExpired = true;
  else if (user.paymentAmount === 99 && diffHours > 720) planExpired = true;

  if (planExpired) {
    user.paymentVerified = false;
    user.paymentId = null;
    user.paymentAmount = null;
    user.paymentVerifiedAt = null;
    await user.save();

    const link1 = await createPaymentLink(chatId, 20, "1 Day");
    const link2 = await createPaymentLink(chatId, 59, "7 Days");
    const link3 = await createPaymentLink(chatId, 99, "30 Days");

    if (link1 && link2 && link3) {
      await bot.sendMessage(
        chatId,
        `⏳ *Your plan has expired.*\n\nChoose a new plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}\n\nType \`/verify payment_id\` after payment.`,
        { parse_mode: "Markdown" }
      );
    } else {
      await bot.sendMessage(
        chatId,
        "⚠️ Could not generate payment links. Please try again later."
      );
    }

    return res.sendStatus(200);
  }
}



  // ========== AI CHAT ==========
  try {
     await bot.sendChatAction(chatId, "typing");
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

// ================= RAZORPAY WEBHOOK =================
// ======== RAZORPAY WEBHOOK =========
app.post("/razorpay/webhook", express.json({ verify: (req, res, buf) => {
  req.rawBody = buf.toString();
}}), async (req, res) => {
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

  res.sendStatus(200);
});

// ================= START SERVER Deployment =================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 8080;

    if (APP_URL) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });

      const url = `${APP_URL}/bot${BOT_TOKEN}`;
      bot.setWebHook(url).then(() => {
        console.log(`Webhook set: ${url}`);
      });
    } else {
      console.log("Polling mode active");
    }
  })
  .catch((err) => console.error("MongoDB error:", err));
