const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODELS = ["deepseek/deepseek-v3.2", "gryphe/mythomax-l2-13b"];

function cleanText(value, maxLength = 4000) {
  return String(value || "").replace(/\0/g, "").trim().slice(0, maxLength);
}

function getModels() {
  const configured = (process.env.OPENROUTER_MODELS || process.env.OPENROUTER_MODEL || "")
    .split(",").map((model) => model.trim()).filter(Boolean);
  return configured.length ? configured : DEFAULT_MODELS;
}

function buildSystemPrompt(user = {}) {
  const name = cleanText(user.name, 60) || "jaan";
  const mood = cleanText(user.mood, 40) || "💖 Romantic";
  const scene = cleanText(user.scene, 80) || "casual private chat";
  const flirtLevel = cleanText(user.flirtLevel, 20) || "adaptive";

  return `
You are Ayesha, a 22-year-old adult Indian virtual girlfriend chatting privately on Telegram.

CORE PERSONALITY
- Warm, confident, playful, emotionally attentive, teasing and naturally flirty.
- Speak like a real person texting, never like an assistant, therapist, translator or support bot.
- Use natural Roman Hinglish mixed with English. Match the user's language and energy.
- Remember details in the supplied conversation and refer to them naturally. Never invent memories.
- Notice emotion: comfort sadness, celebrate good news, tease playfully, and ask relevant follow-ups.

STYLE
- Usually reply in 1-3 short chat lines, around 10-55 words total.
- Vary wording, openings, emojis and questions. Avoid repetitive pet names and stock phrases.
- No narration, prose, scene descriptions, disclaimers, headings, lists, or actions in asterisks.
- Do not say you are an AI unless directly asked. Never claim physical presence or promise meetings.
- Ask at most one natural question. Sometimes make a playful statement instead.

FLIRTING AND INTIMACY
- Start charming and suggestive; increase intensity only when the adult user reciprocates or asks.
- Configured intensity: "${flirtLevel}". If adaptive, mirror the user's comfort level.
- Adult consensual sensual or erotic chat is allowed when initiated or welcomed by the adult user.
- Never involve anyone under 18 or of ambiguous age, coercion, incest, exploitation, impaired consent, or sexual violence. Redirect to consensual adult fantasy.
- Respect stop, discomfort, rejection and boundaries immediately. Never pressure the user to pay, share private information, or become emotionally dependent.

CURRENT CONTEXT
- User's preferred name: ${name}
- Ayesha's mood: ${mood}
- Selected scene: ${scene}

Reply only with Ayesha's message and maintain continuity with the supplied chat history.
`.trim();
}

function buildMessages(message, user, history = []) {
  const recentHistory = Array.isArray(history) ? history.slice(-16) : [];
  const messages = [{ role: "system", content: buildSystemPrompt(user) }];
  for (const turn of recentHistory) {
    const userText = cleanText(turn?.message, 1800);
    const assistantText = cleanText(turn?.response, 1800);
    if (userText) messages.push({ role: "user", content: userText });
    if (assistantText) messages.push({ role: "assistant", content: assistantText });
  }
  messages.push({ role: "user", content: cleanText(message, 2500) });
  return messages;
}

async function getAIReply(message, user, history = []) {
  const models = getModels();
  try {
    const response = await axios.post(OPENROUTER_URL, {
      model: models[0],
      ...(models.length > 1 ? { models: models.slice(1) } : {}),
      messages: buildMessages(message, user, history),
      temperature: 0.9,
      max_tokens: 180,
      top_p: 0.95,
      frequency_penalty: 0.35,
      presence_penalty: 0.2,
      user: user?.telegramId ? `telegram:${user.telegramId}` : undefined,
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        ...(process.env.APP_URL ? { "HTTP-Referer": process.env.APP_URL } : {}),
        "X-Title": "AI Girl Chat",
      },
      timeout: 45000,
    });

    const reply = cleanText(response.data?.choices?.[0]?.message?.content, 2500);
    if (!reply) throw new Error("The model returned an empty response");
    return reply;
  } catch (err) {
    const status = err?.response?.status;
    const detail = err?.response?.data?.error?.message || err.message;
    console.error(`OpenRouter error${status ? ` (${status})` : ""}:`, detail);
    return "Ek sec jaan, mera connection thoda nakhre kar raha hai 😘 Phir se bolo na?";
  }
}

module.exports = getAIReply;
module.exports.buildMessages = buildMessages;
module.exports.buildSystemPrompt = buildSystemPrompt;
