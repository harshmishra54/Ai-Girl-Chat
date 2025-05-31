const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const express = require("express");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;
const APP_URL = process.env.APP_URL; // https://ai-girl-chat-2.onrender.com

const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";

const bot = new TelegramBot(BOT_TOKEN);

const app = express();
app.use(express.json());

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
    const response = await axios.post(
      API_URL,
      { message: text },
      {
        headers: {
          "x-api-key": BOT_API_KEY,
        },
      }
    );

    const aiReply = response.data.reply || "Sorry, I didn't get that.";
    await bot.sendMessage(chatId, aiReply);
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    await bot.sendMessage(chatId, "Oops! Something went wrong. Please try again.");
  }

  res.sendStatus(200);
});

(async () => {
  try {
    const webhookURL = `${APP_URL}/bot${BOT_TOKEN}`;
    await bot.setWebHook(webhookURL);
    console.log("Webhook set to:", webhookURL);
  } catch (error) {
    console.error("Failed to set webhook:", error.message);
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
