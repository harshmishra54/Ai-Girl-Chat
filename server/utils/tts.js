const axios = require("axios");

const generateTTS = async (text) => {
  const response = await axios.post(
    "https://api.ttsmaker.com/generate", // You can replace with your actual TTS API
    {
      text: text,
      voice: "en-US_AllisonV3Voice", // Choose the voice if API supports
    }
  );
  return response.data.audioUrl;
};

module.exports = generateTTS;
