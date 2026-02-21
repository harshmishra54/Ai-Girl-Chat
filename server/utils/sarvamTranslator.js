const axios = require("axios");

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

/**
 * Translate + stylize text using Sarvam AI
 * Style:
 * - Female personality
 * - Modern casual tone
 */
async function translateWithSarvam(text) {
    try {
        const response = await axios.post(
            "https://api.sarvam.ai/v1/translate", // Sarvam endpoint
            {
                input: text,

                // Example config — adjust language if needed
                source_language: "en",
                target_language: "hi",

                // 🔥 STYLE INSTRUCTION
                style_prompt:
                    "Rewrite this message as a modern, casual female character. Keep it playful, natural, and conversational. Avoid robotic tone.",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${SARVAM_API_KEY}`,
                },
            }
        );

        return response.data.output || text;
    } catch (err) {
        console.error("Sarvam Translation Error:", err.response?.data || err.message);

        // fallback → never break chat
        return text;
    }
}

module.exports = translateWithSarvam;