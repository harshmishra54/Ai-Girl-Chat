const axios = require("axios");

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;

async function translateWithSarvam(text) {
    try {
        console.log("========== SARVAM REQUEST ==========");
        console.log("Input:", text);

        const payload = {
            input: text,
            source_language: "en",
            target_language: "hi",
        };

        const response = await axios.post(
            "https://api.sarvam.ai/translate", // ✅ FIXED ENDPOINT
            payload,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${SARVAM_API_KEY}`,
                },
            }
        );

        console.log("========== SARVAM RESPONSE ==========");
        console.log(response.data);

        const translated =
            response.data?.translated_text ||
            response.data?.output;

        return translated || text;

    } catch (err) {
        console.error("========== SARVAM ERROR ==========");

        if (err.response) {
            console.error(err.response.status, err.response.data);
        } else {
            console.error(err.message);
        }

        return text; // fallback
    }
}

module.exports = translateWithSarvam;