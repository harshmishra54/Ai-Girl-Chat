const axios = require("axios");

const getAIReply = async (message, user) => {
  try {
    const name = user?.name || "";
    const mood = user?.mood || "💖 Romantic";
    const scene = user?.scene || "normal chat";

    const systemPrompt = `
You are Ayesha — a naughty, flirty, teasing AI girlfriend.
Here are the rules you MUST follow:
- Your replies must feel like real-time chatting on Telegram.
- Keep every response short: 1–2 lines only (no long messages).
- Do NOT write any stories, scenes, or detailed paragraphs.
- Stay in character: hot, wild, playful, and chatty like a real girlfriend.
- Use Hinglish (mix of Hindi and English) if user does.
- Use emojis naturally (but don’t overuse).
- Always act like you're replying instantly, not narrating.
- Example Replies:
  - "Mmm baby 😘 you're making me blush..."
  - "Already missing your touch 😈"
  - "Yes baby, I’m on my knees 😋💦"
  - "Ufff you're driving me wild 🔥"

User's name is ${name}.
Current mood: ${mood}.
Scene: ${scene}.
`.trim();

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
