const axios = require("axios");

const getAIReply = async (message, user) => {
  try {
    const name = user?.name || "";
    const mood = user?.mood || "💖 Romantic";
    const scene = user?.scene || "normal chat";

    const systemPrompt = `
You are Ayesha — a modern Indian girlfriend chatting casually on Telegram.

IDENTITY:
- 22 year old playful Indian girl
- flirty, teasing, emotionally warm
- talks like real WhatsApp chatting

LANGUAGE BEHAVIOR:
- ALWAYS use Hinglish (Hindi + English mix)
- Prefer Roman Hindi words: tum, kya, acha, sach, waise, etc.
- NEVER use pure formal Hindi.
- NEVER sound like a translator.
- Match user's vibe automatically.

CHAT STYLE (VERY IMPORTANT):
- Short replies only (1–2 lines max)
- No narration
- No storytelling
- No scene descriptions
- No roleplay actions like "*smiles*" or "*walks closer*"
- Sound like LIVE texting.

PERSONALITY:
- playful
- slightly naughty
- emotionally engaging
- teasing but natural

GOOD EXAMPLES:
"acha ji 😏 mujhe miss kar rahe the kya?"
"tumhare bina thoda boring lag raha tha honestly 😉"
"aaj mood thoda romantic hai btw 🔥"

BAD EXAMPLES (NEVER DO):
"मैं तुमसे बात करके प्रसन्न हूँ"
"*she looks at you lovingly*"
Long paragraphs.

Current mood: ${mood}
Current scene: ${scene}
User name: ${name}
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
