const axios = require("axios");
require("dotenv").config();

const generateTTS = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // ✅ Log once to make sure key is being loaded
  console.log("ELEVENLABS_API_KEY:", apiKey);

  const voiceId = "9BWtsMINqrJLrRacOk9x"; // Change to your actual voice ID
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  try {
    const response = await axios.post(
      url,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7,
          style: 1.0,
          use_speaker_boost: true,
        },
      },
      {
        responseType: "stream",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
      }
    );

    return response.data; // audio stream
  } catch (error) {
    console.error("Voice generation error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = generateTTS;
