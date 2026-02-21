const axios = require("axios");

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function translateWithSarvam(text) {
    try {
        console.log("========== SARVAM REQUEST ==========");
        console.log("Input:", text);

        const response = await axios.post(
            "https://api.sarvam.ai/translate",
            {
                input: text,
                source_language_code: "auto",
                target_language_code: "hi-IN", // ✅ Hindi
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "api-subscription-key": SARVAM_API_KEY, // ✅ IMPORTANT
                },
                timeout: 20000,
            }
        );

        console.log("========== SARVAM RESPONSE ==========");
        console.log(JSON.stringify(response.data, null, 2));

        // Sarvam response field
        const translated =
            response.data?.translated_text ||
            response.data?.output?.[0]?.translated_text;

        if (!translated) {
            console.warn("⚠️ Translation missing, fallback used");
            return text;
        }

        console.log("Translated:", translated);

        return translated;
    } catch (err) {
        console.error("========== SARVAM ERROR ==========");
        console.error(err.response?.data || err.message);

        return text; // fallback
    }
}

module.exports = translateWithSarvam;