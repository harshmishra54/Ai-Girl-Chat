const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const BOT_API_KEY = process.env.BOT_API_KEY; // secret key for bot

// Middleware for auth OR bot key check
const authMiddlewareOrBotKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (apiKey && apiKey === BOT_API_KEY) {
    // Request from bot, allow without JWT
    return next();
  }

  // Otherwise apply your existing auth middleware (JWT)
  // require your auth middleware here or call it
  // For example:
  // return authMiddleware(req, res, next);

  return res.status(401).json({ error: "Unauthorized" });
};

router.post("/chat", authMiddlewareOrBotKey, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [
          {
            role: "system",
            content:
              "You are an AI girlfriend named Ayesha. Reply to the user's message in 2 to 3 short, flirty, chat-like lines.Separate each line with a newline character '\\n'.Do not send a long story or paragraphs.Always keep it flirty and playful. and be wild so that user like you Dont use long stories",
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiReply = response.data.choices[0].message.content;
    res.json({ reply: aiReply });
  } catch (error) {
    console.error("🔥 Full Error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;
