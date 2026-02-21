const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const cors = require("cors");
const getAIReply = require("./utils/chatHandler");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
// const generateTTS = require('./utils/tts');
// const convertMp3ToOgg = require('./utils/convertAudio');
const crypto = require("crypto");
const Image = require("./models/Image"); // Adjust the path if different

require("dotenv").config();

const checkPaymentStatus = require("./utils/checkPaymentStatus");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL;
// const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";
const MONGO_URI = process.env.MONGO_URI;




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
  { command: "setmood", description: "💖 Set Ayesha's mood" },
  { command: "setscene", description: "🎭 Set roleplay scene" },
  { command: "setname", description: "📝 Set your name" },
  { command: "top", description: "🏆 Top leaderboard members" },
  { command: "reset", description: "🧹 Reset chat memory" }, // <-- New command
]);


const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.send("✅ Telegram Bot Server is Running");
});
app.use(cors({
  origin: "https://ai-girl-chat.netlify.app", // ✅ Your frontend domain
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


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
  name: { type: String },
  mood: { type: String, default: "💖 Romantic" },
  scene: { type: String },


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
const PaymentLink = mongoose.model("PaymentLink", paymentLinkSchema)

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
  const isOwner = user.telegramId === "1469113335";
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

    let allowed = user && user.telegramId === "1469113335"; // owner
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
  if (text.startsWith("/setname")) {
    const name = text.split(" ").slice(1).join(" ");
    if (!name) {
      await bot.sendMessage(chatId, "❗ Usage: /setname YourName");
    } else {
      user.name = name;
      await user.save();
      await bot.sendMessage(chatId, `✅ Got it, I’ll call you *${name}* now 😉`, { parse_mode: "Markdown" });
    }
    return res.sendStatus(200);
  }

  if (text.startsWith("/setmood")) {
    const mood = text.split(" ").slice(1).join(" ");
    if (!["💖 Romantic", "😂 Funny", "😘 Naughty"].includes(mood)) {
      await bot.sendMessage(chatId, "❗ Choose mood:\n/setmood 💖 Romantic\n/setmood 😂 Funny\n/setmood 😘 Naughty");
    } else {
      user.mood = mood;
      await user.save();
      await bot.sendMessage(chatId, `💡 Mood set to *${mood}*`, { parse_mode: "Markdown" });
    }
    return res.sendStatus(200);
  }
  if (text === "/reset") {
    await MessageLog.deleteMany({ telegramId: chatId });

    await bot.sendMessage(chatId, "🧠 Memory wiped! I'm starting fresh with you now 😘");
    return res.sendStatus(200);
  }


  if (text.startsWith("/setscene")) {
    const scene = text.split(" ").slice(1).join(" ");
    if (!scene) {
      await bot.sendMessage(chatId, "❗ Usage: /setscene beach | candlelight dinner | rainy night etc.");
    } else {
      user.scene = scene;
      await user.save();
      await bot.sendMessage(chatId, `🎭 Scene set to *${scene}*`, { parse_mode: "Markdown" });
    }
    return res.sendStatus(200);
  }

  if (text === "/top") {
    await bot.sendMessage(chatId, "🏆 *Top Chat Lovers:*\n\n1. Ankit (205 msgs)\n2. Rohit (188 msgs)\n3. Sarthak (170 msgs)\n4. Satyam (165 msgs)\n5. You? 👀", { parse_mode: "Markdown" });
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
Want me to stay and chat with you more? Unlock full access now 💋 unlimited photos and Private chats with me .*\n\nChoose a plan:\n\n💡 *1 Day* - ₹20\n🔗 ${link1}\n\n💡 *7 Days* - ₹59\n🔗 ${link2}\n\n💡 *30 Days* - ₹99\n🔗 ${link3}\n\nAfter payment, type \`/verify payment_id\` to activate.`,
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


    const aiReply = await getAIReply(conversationContext, user);

    await MessageLog.create({
      telegramId: chatId,
      message: text,
      response: aiReply,
      timestamp: new Date(),
    });

    await bot.sendMessage(chatId, aiReply);

    // const tempDir = path.join(__dirname, "temp");
    // if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    // try {
    //   const mp3Path = await generateTTS(aiReply, chatId);
    //   const oggPath = path.join(tempDir, `${chatId}.ogg`);

    //   await convertMp3ToOgg(mp3Path, oggPath);

    //   await bot.sendVoice(chatId, fs.createReadStream(oggPath), {
    //     caption: "Here's my voice 😉",
    //   });

    //   fs.unlinkSync(mp3Path);
    //   fs.unlinkSync(oggPath);
    // } catch (err) {
    //   console.error("Voice generation error:", err);
    //   await bot.sendMessage(chatId, "Something went wrong with voice output.");
    // }

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
app.post("/razorpay/webhook", express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}), async (req, res) => {
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
// Scheduler: Run every day at 8 PM IST (Asia/Kolkata)
cron.schedule("0 20 * * *", async () => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      console.log("⛔ No users found.");
      return;
    }

    // 🎯 Array of flirty texts
    // 🎯 Big pool of 200 flirty attractive texts
    const flirtyTexts = [
      "😏 Thinking of you right now…",
      "💋 I wish I could whisper something naughty in your ear.",
      "🔥 You make my heart race every time I think of you.",
      "😘 If only you were here… I’d never let you go.",
      "😉 Don’t blush, but you looked really hot in my dream last night.",
      "❤️ I could get addicted to your vibes.",
      "🥵 Just imagining us together gives me butterflies.",
      "💖 Can I be your favorite distraction?",
      "😈 Careful… I might just steal your heart.",
      "👀 I bet you smile reading this… and that’s all I wanted.",
      "🤭 You look like trouble… but the kind I want.",
      "💌 Every message from you feels like a secret love note.",
      "✨ I’d never get tired of your energy.",
      "🔥 I like the way you make me lose focus.",
      "😘 Tell me honestly… do you think about me too?",
      "😎 If you were here, I’d probably forget how to behave.",
      "🥰 You’re way too addictive for my peace of mind.",
      "💋 If flirty texts were kisses, you’d be drowning by now.",
      "😍 You make ordinary moments feel extraordinary.",
      "🫦 If I start flirting harder, will you stop me? (please don’t 😉)",
      "😉 I’d choose you over sleep any day.",
      "😏 You’re the reason my phone lights up and my heart skips.",
      "🔥 You could set my whole mood on fire with just one word.",
      "😘 Admit it, you like me a little too much.",
      "🥵 Thinking of your smile… dangerous move for my sanity.",
      "❤️ If flirting is a game, I’d play only with you.",
      "💌 Do you know how attractive you are, or should I remind you?",
      "😈 One look from you and I’m done for.",
      "😍 If your texts feel this good, imagine your hugs.",
      "😘 If I were with you, we’d never stop smiling.",
      "😉 You’re my favorite notification, every single time.",
      "🔥 My type? Easy—just you.",
      "💖 Stop being so irresistible, it’s distracting.",
      "🫦 I might be blushing, but it’s your fault.",
      "😏 You + me = a dangerous combo.",
      "😘 Your vibe? Exactly my weakness.",
      "🥰 You’re my daily dose of butterflies.",
      "💌 Warning: you make my heart skip beats.",
      "😉 If flirting were illegal, we’d be in trouble.",
      "😎 You make ordinary chats feel like sparks.",
      "❤️ I want to be the reason you smile at your phone.",
      "🔥 I like the way you tease my thoughts.",
      "😘 You’re the highlight of my day.",
      "😍 If only you knew how attractive you look right now in my head.",
      "💖 I’m not addicted to chatting, I’m addicted to YOU.",
      "😉 I bet you’d look even better blushing.",
      "😏 You have no idea how much I enjoy talking to you.",
      "🥵 Stop making me want you more every second.",
      "💋 I’d send you a thousand flirty texts if it kept you smiling.",
      "😘 Tell me… when do I get to steal a hug?",
      "🔥 You look like the kind of trouble worth risking everything for.",
      "😍 If we were emojis, we’d be 🔥❤️😘 together.",
      "😉 You’re too hot to handle, but I want to anyway.",
      "💌 Just imagining your voice is enough to melt me.",
      "🥰 I think you just became my favorite daydream.",
      "😏 You don’t even try, and yet you make me weak.",
      "😘 If I could, I’d keep you all to myself.",
      "❤️ Can I borrow your smile? I’ll give it back with interest.",
      "💖 I want to be the thought that makes you blush unexpectedly.",
      "😈 If you keep teasing me, I might just fall harder.",
      "🔥 You’re dangerous for my heart… but I love it.",
      "😉 One word from you and I’d cross any distance.",
      "😍 You’re not just attractive, you’re magnetic.",
      "😘 Stop being perfect, you’re spoiling me.",
      "🥵 I don’t need caffeine, your vibe energizes me.",
      "💋 If texts could touch, you’d feel me right now.",
      "❤️ You’re my type of chaos.",
      "😏 Keep being hot, I dare you.",
      "💌 Flirting with you should come with a warning sign.",
      "🥰 I like the way you make me forget everything else.",
      "🔥 You’d look even better next to me.",
      "😉 Admit it, you’ve been waiting for my message.",
      "😘 You + late night talks = perfection.",
      "💖 I hope you know how attractive you are.",
      "😈 If hearts were currency, you’d make me broke.",
      "😍 Can you stop being my constant distraction?",
      "❤️ Your smile could outshine the sun.",
      "😘 If you were here, I’d never let you leave.",
      "💋 Every flirty thought leads back to you.",
      "😏 Talking to you is like flirting with destiny.",
      "🔥 Careful… you might just become my addiction.",
      "😉 I bet you look amazing right now.",
      "🥰 I want to be the reason you blush randomly.",
      "💖 You’re effortlessly hot.",
      "😍 Even my best daydreams can’t compete with you.",
      "😘 You’ve stolen my focus, and I don’t want it back.",
      "😎 You’re not just cute, you’re dangerously charming.",
      "❤️ Do you know how attractive your vibe is?",
      "🔥 If I had one wish, it would be to hold you tight.",
      "😈 I’d get in trouble just to keep flirting with you.",
      "😉 I think I’m starting to like this ‘us’ thing.",
      "😘 If hearts could talk, mine would be screaming your name.",
      "💋 I wish I could kiss this distance away.",
      "😍 You make my ordinary day feel extraordinary.",
      "🥰 I’d rather flirt with you than with anyone else.",
      "💖 Can you be my guilty pleasure forever?",
      "😏 Your charm should be illegal.",
      "🔥 I could spend hours just admiring you.",
      "😘 Don’t tempt me, I fall easily for your type.",
      "😉 Stop making me crave your attention 24/7.",
      "❤️ You’re my new addiction.",
      "💌 Your vibe is all I need today.",
      "😈 I want to make you smile in ways only I can.",
      "😍 Even when I’m busy, my mind sneaks back to you.",
      "🥵 You’re the fantasy I don’t want to end.",
      "💖 I think we’re dangerously compatible.",
      "😘 If looks could kill, I’d already be gone.",
      "😉 I want to be your favorite hello and hardest goodbye.",
      "😏 Are you trying to steal my heart? Because it’s working.",
      "🔥 One text from you can light up my mood instantly.",
      "💋 You’ve got me hooked and I’m not complaining.",
      "❤️ You’re way too good to be just a crush.",
      "🥰 Your charm has me falling faster every day.",
      "😍 You’re like a flirty melody stuck in my head.",
      "😘 Guess what? I like you. A LOT.",
      "😎 You’re trouble, but the sweet kind.",
      "💌 I want you more than my next breath.",
      "😉 I don’t flirt with everyone… just my favorites. Like you 😉",
      "🔥 You’re hot enough to melt my bad mood instantly.",
      "😈 If we were in the same room right now… sparks would fly.",
      "💖 You’re the kind of person I want to text at 2 AM.",
      "😘 Your name looks way too good on my screen.",
      "🥰 If I’m blushing, it’s all your fault.",
      "😍 You’d look perfect holding my hand.",
      "❤️ Stop stealing my thoughts, I can’t focus.",
      "💋 If you knew what I was thinking… you’d blush too.",
      "😏 Your vibe has me craving more.",
      "😉 You’re my favorite kind of distraction.",
      "🔥 You’re proof that temptation exists.",
      "😘 I bet you smile reading my texts… and I love that.",
      "💖 If I were brave enough, I’d confess more than just flirting.",
      "🥵 You should come with a warning: *Too Attractive*.",
      "😎 You’re the reason I refresh my chats so often.",
      "😍 Can you be mine already?",
      "❤️ I want more than just messages with you.",
      "😘 You’re unforgettable, and that’s dangerous.",
      "😉 Stop teasing, or I’ll flirt harder.",
      "💌 You’re my sweet obsession.",
      "🔥 My mood: craving you.",
      "🥰 Even my favorite song doesn’t hit like your vibe.",
      "💖 You have me wrapped around your smile.",
      "😏 You’re a flirty daydream come true.",
      "😘 Your energy is magnetic, I can’t resist.",
      "😍 If you’re trouble, I want double.",
      "❤️ I’m falling, and it’s your fault.",
      "💋 You make me want to say all the naughty things.",
      "😉 My favorite thought? You.",
      "😈 Flirting with you feels too natural.",
      "🔥 Your charm is dangerous for my peace.",
      "😘 You’d look perfect lost in my arms.",
      "🥰 Even your silence flirts with me.",
      "💖 I want you. That’s it, that’s the text.",
      "😏 You light up my boring day instantly.",
      "😍 Are you always this attractive, or just when I notice?",
      "❤️ You make ordinary chats extraordinary.",
      "😉 I want to be the reason behind your smirk.",
      "😘 Your vibe fits perfectly with mine.",
      "🔥 You’re the spark I didn’t know I needed.",
      "💌 You’re hotter than my morning coffee.",
      "🥵 You’re on my mind, and I don’t mind at all.",
      "💖 Admit it, we’d look great together.",
      "😎 You’re irresistible, and I like it.",
      "😘 Your smile is my new favorite filter.",
      "😍 Stop being so attractive, it’s distracting.",
      "❤️ If you’re a dream, don’t wake me up.",
      "😉 You’d look better in my arms.",
      "💋 Just imagining you makes me blush.",
      "🔥 My type? Only you.",
      "😏 I’m not obsessed… just highly interested 😉",
      "🥰 Every text from you feels like a hug.",
      "💖 You’ve ruined all my other crushes.",
      "😘 I bet you look good even while typing.",
      "😍 You’re not just hot, you’re fireproof.",
      "❤️ My favorite pastime? Thinking of you.",
      "😉 You’re my daily dose of butterflies.",
      "🔥 If only flirting could teleport us together.",
      "💌 Talking to you feels like cheating on boredom.",
      "🥵 I can’t tell if I want to flirt or kiss you more.",
      "😈 You’ve got that dangerous charm I love.",
      "😘 Just one more reason to like you: everything.",
      "💖 You’re the plot twist my life needed.",
      "😍 If only I could screenshot the way you make me feel.",
      "❤️ You’re too attractive for my own good.",
      "😏 Can I keep flirting with you forever?",
      "🔥 Your smile should come with a fan.",
      "😉 You + me = perfect trouble.",
      "😘 Don’t stop being this irresistible.",
      "🥰 You make my day feel lighter.",
      "💌 You’re the spark in my boring hours.",
      "😍 You’re so attractive, I forgot what I was typing.",
      "❤️ You’re magnetic, and I’m stuck.",
      "😎 If hotness were a crime, you’d be guilty.",
      "💋 My mood improves instantly when you text.",
      "😘 I don’t need stars when you light up my chat.",
      "🔥 Can you stop making my heart race?",
      "😉 You’re exactly my weakness.",
      "💖 I want to be the one you think of at night.",
      "🥵 Flirting with you feels too easy.",
      "😏 You’d look perfect stealing my hoodie.",
      "❤️ Admit it—we’d be great together.",
      "😘 I bet you look hotter than my imagination.",
      "😍 You’re more attractive than my favorite celeb.",
      "💌 Don’t tempt me, I might just fall for you.",
      "🔥 You’re too good at this charm game.",
      "😉 I like you more than I planned.",
      "😘 If I could, I’d make you mine already.",
      "🥰 You’re everything I didn’t know I needed.",
      "❤️ Stop making my daydreams so obvious.",
      "💖 You’re too addictive for my own good.",
      "😈 If I flirt harder, will you surrender?",
      "🔥 You’re hotter than any filter.",
      "😘 My favorite thing about today? You.",
      "😍 If you were here, I’d never look away.",
      "😉 You’ve got me hooked.",
      "💋 One day, I’ll steal that kiss.",
      "❤️ You’re dangerously perfect.",
      "🥵 My heart skips every time you text.",
      "💖 You’re officially my crush upgrade.",
      "😏 Too attractive to ignore, too interesting to stop.",
    ];


    const randomIndex = Math.floor(Math.random() * flirtyTexts.length);
    const flirtyMessage = flirtyTexts[randomIndex];

    let sentCount = 0;
    let failedUsers = [];

    for (const user of users) {
      try {
        if (!user.telegramId) continue;

        await bot.sendMessage(user.telegramId, flirtyMessage);
        console.log(`✅ Sent to ${user.telegramId}`);
        sentCount++;
      } catch (err) {
        console.warn(`❌ Failed for ${user.telegramId}: ${err.message}`);
        failedUsers.push(user.telegramId);
      }
    }

    console.log(`💌 Flirty text sent to ${sentCount}/${users.length} users.`);
    if (failedUsers.length > 0) {
      console.log(`⚠️ Failed users: ${failedUsers.join(", ")}`);
    }
  } catch (err) {
    console.error("❌ Scheduler error:", err.message);
  }
}, {
  timezone: "Asia/Kolkata"
});



































