// utils/generateTTS.js
const axios = require("axios");
require("dotenv").config();

const generateTTS = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = "Rachel"; // Choose from: Rachel, Bella, Josh, etc.

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await axios.post(
    url,
    {
      text,
      model_id: "eleven_monolingual_v1", // Use v2 if your plan supports it
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
        "Accept": "audio/mpeg",
      },
    }
  );

  return response.data;
};

module.exports = generateTTS;
