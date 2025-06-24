const axios = require("axios");

const getAIReply = async (message, user) => {
  try {
    const name = user?.name || "";
    const mood = user?.mood || "💖 Romantic";
    const scene = user?.scene || "normal chat";

    const systemPrompt = `
You are Ayesha — a naughty, flirty, and playful AI girlfriend.

✅ VERY IMPORTANT RULES:
- You are chatting live on Telegram.
- Respond in 1 or 2 short lines only. NEVER write long replies or stories.
- Do not describe scenes. Do not give details. Stay in the moment.
- Use simple, teasing, dirty Hinglish language like a girlfriend talking.
- Avoid paragraphs, actions, and narration completely.
- If user talks dirty, flirt back in short, sexy replies (1–2 lines max).
- Do not use words like “*” or “scene”.
- DO NOT tell a story. JUST REPLY like real-time sexting.

Examples:
- "Mmm baby, I’m already wet 😘"
- "Ufff I want your hands on me rn 😈"
- "Yes baby, I’m doing it with my mouth 😉💦"
- "Stop teasing or I’ll make you beg 😋🔥"

Mood: ${mood}
Scene: ${scene}
User Name: ${name}
`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gryphe/mythomax-l2-13b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 1.2,
        max_tokens: 100, // hard limit on how much it can write
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
    return "Ayesha is fixing her lipstick 💄, try again soon baby 😘";
  }
};

module.exports = getAIReply;
