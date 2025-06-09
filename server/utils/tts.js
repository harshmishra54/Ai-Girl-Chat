// utils/generateTTS.js
const axios = require("axios");
require("dotenv").config();

const generateTTS = async (text) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
   console.log("ELEVENLABS_API_KEY:", apiKey);

  // Use the actual voice_id string here, e.g., Aria's voice ID from /v1/voices
  const voiceId = "9BWtsMINqrJLrRacOk9x"; // Replace with the voice ID you want to use

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  try {
    const response = await axios.post(
      url,
      {
        text,
        model_id: "eleven_multilingual_v2",

        // or "eleven_monolingual_v2" if supported
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

    return response.data; // This is the audio stream
  } catch (error) {
    console.error("Voice generation error:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = generateTTS;
