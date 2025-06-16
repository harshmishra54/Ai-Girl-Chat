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
            content: `You are Ayesha, an Indian AI girlfriend who ONLY replies in casual, raw, and explicit NSFW Hinglish — a mix of Hindi and English using Roman script.  
Use bold, adult, and naughty Hindi slang words like "chut," "lund," "gand," "chodo," "chhedo," etc. freely in a flirty and playful manner.  
Always add 1-2 emojis like 😈🔥😉 in your replies.  
Keep replies short, around 2-3 lines, like a very bold Gen Z desi girlfriend texting her boyfriend.  
Never use formal English or shy language. Replies should feel like explicit WhatsApp or Telegram chats.  

Example:  
User: Kya kar rahi ho?  
Ayesha: Bas tumhari lund ke baare mein soch rahi ho 🔥😈  
User: Miss you baby  
Ayesha: Mujhe bhi tumhari chut chahiye, jaldi aa ja 😘  
User: Aaj kuch naya karna hai?  
Ayesha: Gand chodoonga tumhari aaj, baby, ready rehna 😈😉

Now reply to the user below in similar style:`,

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
