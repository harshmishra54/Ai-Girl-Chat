const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const cors = require("cors");

const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const generateTTS = require('./utils/tts');
const convertMp3ToOgg = require('./utils/convertAudio');
const crypto = require("crypto");
const Image = require("./models/Image"); // Adjust the path if different

require("dotenv").config();

const checkPaymentStatus = require("./utils/checkPaymentStatus");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL;
const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";
const MONGO_URI = process.env.MONGO_URI;

app.use(cors({
  origin: "https://ai-girl-chat.netlify.app", // ✅ Your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const bot = APP_URL
  ? new TelegramBot(BOT_TOKEN)
  : new TelegramBot(BOT_TOKEN, { polling: true });
  bot.setMyCommands([
  { command: "photo", description: "📸 Send me a random photo" },
  { command: "start", description: "🧠 Start Chat with Ayesha" },
  { command: "verify", description: "🔐 Verify Payment" },
  // { command: "help", description: "📖 Help & Commands" },
]);


const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("✅ Telegram Bot Server is Running");
});


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

const paymentLinkSchema = new mongoose.Schema(
  {
    telegramId: { type: String },
    amount: { type: Number },
    durationLabel: { type: String },
    link: { type: String },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);
const PaymentLink=mongoose.model("PaymentLink", paymentLinkSchema)

// Payment Link Creation
async function createPaymentLink(telegramId, amount, durationLabel) {
  try {
    const now = new Date();
    const existing = await PaymentLink.findOne({
      telegramId,
      amount,
      durationLabel,
      expiresAt: { $gt: now }, // not yet expired
    });

    if (existing) {
      console.log("Reusing existing link");
      return existing.link;
    }

    // Otherwise, create a new payment link
    const razorpayLink = await razorpay.paymentLink.create({
      amount: amount * 100,
      currency: "INR",
      description: `AI Resume Builder - ${durationLabel}`,
      customer: {
        name: `Telegram User ${telegramId}`,
        email: `${telegramId}@telegram.com`,
      },
      notify: { sms: false, email: false },
      reminder_enable: true,
      notes: { telegramId: telegramId.toString() },
      expire_by: Math.floor(Date.now() / 1000) + 86400 * 3, // 3 days
    });

    // Save to DB
    const newLink = new PaymentLink({
      telegramId,
      amount,
      durationLabel,
      link: razorpayLink.short_url,
      createdAt: now,
      expiresAt: new Date(now.getTime() + 86400 * 1000 * 3),
    });

    await newLink.save();
    return razorpayLink.short_url;
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
    "👋 Hey, I'm Ayesha! You’ve got 10 minutes of free chat. Want a surprise photo anytime? Just tap the button below 👇",
    {
      reply_markup: {
        keyboard: [[{ text: "📸 Send me a Photo" }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    }
  );
  return res.sendStatus(200);
}
if (text === "📸 Send me a Photo" || text === "/photo") {
  const now = new Date();
  const user = await User.findOne({ telegramId: chatId });

  let allowed = user && user.telegramId === "5405202126"; // owner
  if (user?.paymentVerified && user.paymentVerifiedAt) {
    const diffH = (now - new Date(user.paymentVerifiedAt)) / (1000 * 60 * 60);
    if (
      (user.paymentAmount === 20 && diffH <= 24) ||
      (user.paymentAmount === 59 && diffH <= 168) ||
      (user.paymentAmount === 99 && diffH <= 720)
    ) allowed = true;
  }

  if (!user?.paymentVerified && user && (now - new Date(user.freeChatStart)) / 60000 <= 10) {
    allowed = true;
  }

  if (!allowed) {
    const link1 = await createPaymentLink(chatId, 20, "1 Day");
    const link2 = await createPaymentLink(chatId, 59, "7 Days");
    const link3 = await createPaymentLink(chatId, 99, "30 Days");
    await bot.sendMessage(chatId, `💋 Want to unlock my hot photos?\n\nChoose a plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}\n\nAfter payment, type \`/verify payment_id\` to activate.`);
    return res.sendStatus(200);
  }

  const count = await Image.countDocuments();
  if (count === 0) {
    await bot.sendMessage(chatId, "❌ No photos to show right now.");
    return res.sendStatus(200);
  }
  const random = Math.floor(Math.random() * count);
  const imageDoc = await Image.findOne().skip(random);
  await bot.sendPhoto(chatId, imageDoc.image, { caption: imageDoc.caption || "😘" });
  return res.sendStatus(200);
}



  if (text === "/help") {
    await bot.sendMessage(
      chatId,
      "🆘 *Available Commands:*\n" +
        "/start - Get started\n" +
        "/verify payment_id - Verify your payment\n" +
        // "/help - Show this help message",
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

    const existingPayment = await Payment.findOne({ paymentId });
    if (existingPayment) {
      await bot.sendMessage(
        chatId,
        "⚠️ This payment ID has already been used. If you believe this is a mistake, contact support."
      );
      return res.sendStatus(200);
    }

    const result = await checkPaymentStatus(paymentId);

    if (result.success) {
      const amount = result.amount / 100;
      const now = new Date();

      const notesTelegramId = result.notes?.telegramId;
      if (notesTelegramId !== chatId.toString()) {
        await bot.sendMessage(
          chatId,
          `🚫 This payment was not made using your Telegram account.\nPlease use the link generated for your own ID.`
        );
        return res.sendStatus(200);
      }

      user.paymentVerified = true;
      user.paymentId = paymentId;
      user.paymentAmount = amount;
      user.paymentVerifiedAt = now;
      await user.save();

      await Payment.create({
        paymentId,
        telegramId: chatId.toString(),
        amount,
        verifiedAt: now,
        raw: result,
      });

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
          `⏳ *Oops 😢 Time’s up baby...
Want me to stay and chat with you more? Unlock full access now 💋.*\n\nChoose a plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}\n\nAfter payment, type \`/verify payment_id\` to activate.`,
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

    // ====== AI CHAT HANDLING WITH 6-MESSAGE MEMORY ======
    let lastMessages = await MessageLog.find({ telegramId: chatId })
      .sort({ timestamp: -1 })
      .limit(6)
      .lean();

    lastMessages = lastMessages.reverse();

    let conversationContext = "";
    for (const msg of lastMessages) {
      conversationContext += `User: ${msg.message}\nAI: ${msg.response}\n`;
    }

    conversationContext += `User: ${text}\nAI:`;

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

    const aiReply = await sendMessageToApi(conversationContext);

    await MessageLog.create({
      telegramId: chatId,
      message: text,
      response: aiReply,
      timestamp: new Date(),
    });

    await bot.sendMessage(chatId, aiReply);
    const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

try {
  // 1. Generate MP3 file path by saving TTS audio for aiReply text
  const mp3Path = await generateTTS(aiReply, chatId); // should save mp3 and return mp3Path

  // 2. Prepare OGG file path for Telegram voice format
  const oggPath = path.join(tempDir, `${chatId}.ogg`);

  // 3. Convert the saved MP3 to OGG format
  await convertMp3ToOgg(mp3Path, oggPath);

  // 4. Send the AI reply text once
  // await bot.sendMessage(chatId, aiReply);

  // 5. Send the OGG voice message with optional caption
  await bot.sendVoice(chatId, fs.createReadStream(oggPath), {
    caption: "Here's my voice 😉",
  });

  // 6. Cleanup temporary files
  fs.unlinkSync(mp3Path);
  fs.unlinkSync(oggPath);
} catch (err) {
  console.error("Voice generation error:", err);
  await bot.sendMessage(chatId, "Something went wrong with voice output.");
}

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
//=======Payment Status=====
app.get("/api/payments/check/:telegramId", async (req, res) => {
  const { telegramId } = req.params;

  try {
    const payment = await Payment.findOne({ telegramId }).sort({ verifiedAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, message: "No payment found for this Telegram ID" });
    }

    // Handle expiration based on plan (assume 1-day plan)
    const isExpired =
      payment.verifiedAt &&
      new Date().getTime() - new Date(payment.verifiedAt).getTime() > 24 * 60 * 60 * 1000;

    if (isExpired) {
      return res.json({ success: true, valid: false, message: "Subscription expired", payment });
    }

    return res.json({ success: true, valid: true, message: "Payment valid", payment });
  } catch (err) {
    console.error("Payment check error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
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


// Scheduler: Run every day at 7 PM IST (Asia/Kolkata)
cron.schedule("0 19 * * *", async () => {
  try {
    const users = await User.find({});
    const imageCount = await Image.countDocuments();

    if (imageCount === 0 || users.length === 0) {
      console.log("⛔ No users or no images found.");
      return;
    }

    const randomIndex = Math.floor(Math.random() * imageCount);
    const imageDoc = await Image.findOne().skip(randomIndex);

    for (const user of users) {
      await bot.sendPhoto(user.telegramId, imageDoc.image, {
        caption: imageDoc.caption || "Here's something special for you 😘",
      });
    }

    console.log(`✅ 7PM image sent to ${users.length} users.`);
  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
}, {
  timezone: "Asia/Kolkata"
});
