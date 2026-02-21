const axios = require("axios");
const KEY = process.env.SARVAM_API_KEY;

async function translate(text, target) {
    try {
        const res = await axios.post(
            "https://api.sarvam.ai/translate",
            {
                input: text,
                source_language_code: "auto",
                target_language_code: target,
            },
            {
                headers: {
                    "api-subscription-key": KEY,
                    "Content-Type": "application/json",
                },
            }
        );

        return (
            res.data?.translated_text ||
            res.data?.output?.[0]?.translated_text ||
            text
        );
    } catch (e) {
        console.error("Translation error:", e.response?.data || e.message);
        return text;
    }
}

module.exports = translate;