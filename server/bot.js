const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL; // e.g. https://ai-girl-chat-2.onrender.com

const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";

const app = express();
app.use(express.json());

let bot;

// Initialize bot differently based on webhook or polling
if (APP_URL) {
  // Webhook mode: no polling
  bot = new TelegramBot(BOT_TOKEN);
} else {
  // Polling mode for local/dev testing
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
}

app.post(`/bot${BOT_TOKEN}`, async (req, res) => {
  const update = req.body;

  if (!update.message) {
    return res.sendStatus(200);
  }

  const chatId = update.message.chat.id;
  const text = update.message.text;

  if (!text) {
    return res.sendStatus(200);
  }

  try {
    // Retry logic with 1 retry
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
          await new Promise((r) => setTimeout(r, 2000)); // wait 2 seconds
          return sendMessageToApi(message, retries - 1);
        }
        throw error;
      }
    };

    const aiReply = await sendMessageToApi(text);
    await bot.sendMessage(chatId, aiReply);
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    await bot.sendMessage(chatId, "Oops! Something went wrong. Please try again.");
  }

  res.sendStatus(200);
});

// Setup webhook if APP_URL is provided
(async () => {
  if (APP_URL) {
    try {
      const webhookURL = `${APP_URL}/bot${BOT_TOKEN}`;
      await bot.setWebHook(webhookURL);
      console.log("✅ Webhook set to:", webhookURL);
    } catch (error) {
      console.error("❌ Failed to set webhook:", error.message);
      // If webhook setup fails, fallback to polling (optional)
      bot = new TelegramBot(BOT_TOKEN, { polling: true });
      console.log("➡️ Fallback to polling mode");
    }
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
