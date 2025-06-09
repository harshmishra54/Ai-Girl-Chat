const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");

const generateTTS = async (text, chatId) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, "../temp", `${chatId}.mp3`);
    const gtts = new gTTS(text, "en");
    gtts.save(filePath, function (err) {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
};

module.exports = generateTTS;
