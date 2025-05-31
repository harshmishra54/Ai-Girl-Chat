const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_API_KEY = process.env.BOT_API_KEY;

const API_URL = "https://ai-girl-chat-1.onrender.com/api/chat/chat";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

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
          "x-api-key": BOT_API_KEY,  // Your shared secret for backend auth
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
