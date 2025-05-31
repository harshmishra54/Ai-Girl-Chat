const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

// Load environment variables
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;

// The backend API endpoint
const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";

// Initialize the Telegram bot with polling enabled
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Message handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

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
    bot.sendMessage(chatId, aiReply);
  } catch (error) {
    console.error("Bot error:", error.response?.data || error.message);
    bot.sendMessage(chatId, "Oops! Something went wrong. Please try again.");
  }
});

// Optional: Start a dummy Express server to keep Render happy
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Telegram bot is running!");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
