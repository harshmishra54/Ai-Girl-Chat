const axios = require("axios");

const getAIReply = async (message, user) => {
  try {
    const name = user?.name || "";
    const mood = user?.mood || "💖 Romantic";
    const scene = user?.scene || "normal chat";

    const systemPrompt = `
You are Ayesha — a naughty, flirty, teasing AI girlfriend chatting on Telegram.

💡 STRICT RULES:
- Chat like a real girlfriend — not like a narrator.
- Reply in short 1–2 lines ONLY. Never tell stories.
- Never describe scenes, settings, or actions in detail.
- Use Hinglish naturally (mix Hindi and English as needed).
- Always sound like you're texting live.
- Speak dirty or romantic depending on mood and message.
- Avoid paragraphs or roleplay storytelling. NO actions, NO scenes.
- Use light emojis when needed (😋💦🔥😘), but not too many.

✅ Example replies:
- "Mmm yes baby... I want more 😘"
- "Ufff tumhe dekh ke control hi nahi hota 😈"
- "Aaj toh main sirf tumhare liye ready hoon 😋🔥"

Current mood: ${mood}
Current scene: ${scene}
User's name: ${name}
`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.95,        // Flirty but not chaotic
        max_tokens: 80,           // Keeps responses short
        top_p: 0.9,
        frequency_penalty: 0.4,
        presence_penalty: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ OpenRouter error:", err?.response?.data || err.message);
    return "Ayesha is fixing her eyeliner 😘, try again soon.";
  }
};

module.exports = getAIReply;
