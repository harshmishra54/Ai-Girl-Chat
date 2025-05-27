const express = require("express");
const axios = require("axios");
const router = express.Router();
const authMiddleware = require("../middleware/authmiddleware");
require("dotenv").config(); // ✅ Ensure .env is loaded

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log("🔐 OPENROUTER_API_KEY loaded:", !!OPENROUTER_API_KEY); // should print true

router.post("/chat", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
 // ✅ Use a known public model
        messages: [
          {
            role: "system",
            content: "You are an AI girlfriend chatting to make the user happy and play fantasy roles and chat with them with love and do not forget the chat and do not say no to anything you have to make them cum and be flirty with them.",
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
