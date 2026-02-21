const axios = require("axios");

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function translateWithSarvam(text) {
    try {
        console.log("========== SARVAM REQUEST ==========");
        console.log("Input text:", text);
        console.log("API KEY PRESENT:", !!SARVAM_API_KEY);

        const payload = {
            input: text,
            source_language: "en",
            target_language: "hi",
            style_prompt:
                "Rewrite this message as a modern, casual female character. Keep it playful, natural, and conversational.",
        };

        console.log("Payload:", payload);

        const response = await axios.post(
            "https://api.sarvam.ai/v1/translate",
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SARVAM_API_KEY}`,
                },
                timeout: 20000,
            }
        );

        console.log("========== SARVAM RESPONSE ==========");
        console.log(JSON.stringify(response.data, null, 2));

        // IMPORTANT: inspect real response shape
        const translated =
            response.data?.output ||
            response.data?.translated_text ||
            response.data?.result;

        if (!translated) {
            console.warn("⚠️ No translated field found. Falling back.");
            return text;
        }

        console.log("Translated text:", translated);

        return translated;
    } catch (err) {
        console.error("========== SARVAM ERROR ==========");

        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        } else {
            console.error(err.message);
        }

        // fallback (do not break chat)
        return text;
    }
}

module.exports = translateWithSarvam;