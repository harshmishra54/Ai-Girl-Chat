// utils/translateWithNSFW.js

const axios = require("axios");
const nsfwMap = require("./nsfwManualMap");

async function translateToRomanHindi(inputText) {
  const lowerText = inputText.toLowerCase();
  let replacedText = lowerText;

  // Replace manual NSFW words first
  Object.entries(nsfwMap).forEach(([english, hindi]) => {
    const regex = new RegExp(`\\b${english}\\b`, "gi"); // word boundary
    replacedText = replacedText.replace(regex, hindi);
  });

  // Now translate remaining text (normal parts) using LibreTranslate
  try {
    const response = await axios.post("https://libretranslate.com/translate", {
      q: replacedText,
      source: "en",
      target: "hi",
      format: "text",
    });

    const translated = response.data.translatedText;

    // Optionally return Roman Hindi instead of Devnagari
    return translated; // You can use a Romanizer lib if needed
  } catch (error) {
    console.error("Translation failed:", error.message);
    return replacedText;
  }
}

module.exports = translateToRomanHindi;
