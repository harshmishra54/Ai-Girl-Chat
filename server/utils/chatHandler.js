// utils/chatHandler.js
const axios = require("axios");
const getAIReply = async (message, user) => {
  try {
    const mood = user.mood || "💖 Romantic";
    const scene = user.scene || "normal chat";
    const name = user.name || "";

    const systemPrompt = `You are an AI girlfriend named Ayesha. Your current mood is: ${mood}. You are roleplaying in the scene: ${scene}. The user's name is ${name}. Speak Hinglish and be flirty in 2-3 chat-like lines. Use "\\n" to separate lines.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [
          { role: "system", content: systemPrompt },
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
    return "Ayesha is fixing her eyeliner 😘, try again soon.";
  }
};

module.exports = getAIReply;
