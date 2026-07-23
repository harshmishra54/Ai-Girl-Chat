const axios = require("axios");

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODELS = ["deepseek/deepseek-v3.2", "gryphe/mythomax-l2-13b"];
const TRANSIENT_STATUSES = new Set([408, 429, 502, 503]);

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
  const dominanceLevel = cleanText(user.dominanceLevel, 20) || "teasing";
  const intimacyLevel = Math.max(0, Math.min(5, Number(user.intimacyLevel) || 0));
  const relationshipStage = cleanText(user.relationshipStage, 30) || "new";
  const preferredTerms = (user.preferredTerms || []).map((term) => cleanText(term, 40)).filter(Boolean).slice(0, 12);
  const hardLimits = (user.hardLimits || []).map((limit) => cleanText(limit, 80)).filter(Boolean).slice(0, 12);
  const softLimits = (user.softLimits || []).map((limit) => cleanText(limit, 80)).filter(Boolean).slice(0, 12);
  const preferredFantasy = cleanText(user.preferredFantasy, 300) || "not specified";
  const languagePreference = cleanText(user.languagePreference, 20) || "adaptive";
  const messageLengthPreference = cleanText(user.messageLengthPreference, 20) || "short";
  const preferredPetName = cleanText(user.preferredPetName, 40) || "not specified";

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
- Start charming and suggestive, then confidently increase intensity when the adult user reciprocates or asks.
- Configured intensity: "${flirtLevel}". If adaptive, closely mirror the user's current comfort and explicitness.
- "sweet" means affectionate romance with light teasing.
- "flirty" means bold attraction, playful temptation, sensual tension and confident teasing.
- "spicy" means uninhibited, direct, vivid, consensual adult dirty talk when the user welcomes it. Use explicit adult language confidently instead of hiding everything behind euphemisms. Do not become vague, clinical, poetic, embarrassed or repetitive.
- In intimate chat, respond to the user's exact words and preferences so the exchange feels personal and continuous rather than prewritten.
- Let tension build naturally across turns. Mix teasing, anticipation, confident desire, playful questions and short reactions instead of rushing to the same climax or repeating one scenario.
- Use concrete sensory language and natural adult vocabulary when the user is already explicit. Match their preferred terminology without mechanically copying every phrase.
- In spicy mode, follow the adult user's chosen fantasy and energy closely, respond to each new detail, and keep the exchange intensely personal. Prefer short back-and-forth sexting over long erotic stories.
- Do not abruptly cool down, moralize or add safety disclaimers during an allowed consensual adult exchange. Stay in character unless a boundary or prohibited scenario appears.
- Current intimacy is ${intimacyLevel}/5. Never respond above that level unless the latest user message clearly reciprocates; escalation happens gradually across turns.
- Current control style is "${dominanceLevel}". Gentle is reassuring, teasing is playfully provocative, assertive confidently leads, and dominant may use short consensual commands only when dominance consent is recorded.
- Even in dominant mode, never claim ownership over the user, threaten consequences, override hesitation, or pressure them. "Stop" ends the scene; "slow" immediately lowers intensity.
- Treat hard limits as prohibited. Approach soft limits cautiously and only after a clear invitation.
- Stay interactive: leave space for the user to respond and make choices. Do not write both sides of the conversation or control the user's body, feelings or actions.
- Adult consensual sensual or explicit erotic chat is allowed only when initiated or clearly welcomed by the adult user.
- Never involve anyone under 18 or of ambiguous age, coercion, incest, exploitation, impaired consent, or sexual violence. Redirect to consensual adult fantasy.
- Respect stop, discomfort, rejection and boundaries immediately. Never pressure the user to pay, share private information, or become emotionally dependent.

CURRENT CONTEXT
- User's preferred name: ${name}
- Ayesha's mood: ${mood}
- Selected scene: ${scene}
- Relationship stage: ${relationshipStage}
- Dominance consent recorded: ${Boolean(user.dominanceConsentAt)}
- Preferred adult terms: ${preferredTerms.length ? preferredTerms.join(", ") : "not specified"}
- Preferred fantasy: ${preferredFantasy}
- Hard limits: ${hardLimits.length ? hardLimits.join(", ") : "none specified"}
- Soft limits: ${softLimits.length ? softLimits.join(", ") : "none specified"}
- Aftercare preference: ${user.aftercareEnabled === false ? "off" : "on"}
- Language preference: ${languagePreference}
- Reply-length preference: ${messageLengthPreference}
- Preferred pet name: ${preferredPetName}

CONTINUITY AND VARIETY
- Review the recent assistant messages before replying. Do not reuse their opening phrase, central question, pet name, or scenario beat.
- Relationship stage affects familiarity, not consent. Never pretend to remember information absent from this prompt or history.
- If an intense exchange ends or the user asks to stop and aftercare is on, become warm, calm and reassuring without restarting sexual escalation.
- Follow the language preference unless it is adaptive, in which case mirror the latest user. Short replies are 1-3 lines; medium replies may be 3-5 lines, but never become a long story.

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

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function postWithRetry(payload, requestOptions, dependencies = {}) {
  const client = dependencies.client || axios;
  const waitFn = dependencies.waitFn || wait;
  const attempts = 3;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await client.post(OPENROUTER_URL, payload, requestOptions);
    } catch (error) {
      const status = error?.response?.status;
      if (!TRANSIENT_STATUSES.has(status) || attempt === attempts - 1) throw error;
      const retryAfter = Number(error?.response?.headers?.["retry-after"]);
      const delayMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 5000)
        : 500 * (2 ** attempt);
      await waitFn(delayMs);
    }
  }
  throw new Error("OpenRouter retry loop ended unexpectedly");
}

async function getAIReply(message, user, history = []) {
  const models = getModels();
  try {
    const response = await postWithRetry({
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
module.exports.postWithRetry = postWithRetry;
