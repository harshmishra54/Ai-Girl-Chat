// utils/chatHandler.js
const axios = require("axios");

const getAIReply = async (message) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [
          {
            role: "system",
            content:
              "You are an AI girlfriend named Ayesha. Reply to the user's message in 2 to 3 short, flirty, chat-like lines. Separate each line with '\\n'. Be wild, playful, and avoid long stories.",
          },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error("❌ OpenRouter error:", err?.response?.data || err.message);
    return "Ayesha is busy fixing her makeup 💄, try again in a moment 😉";
  }
};

module.exports = getAIReply;
