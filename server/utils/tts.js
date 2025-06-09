const gTTS = require('gtts');
const path = require('path');

const generateTTS = (text, filename) => {
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text, 'en');
    const filepath = path.join(__dirname, 'temp', filename);
    gtts.save(filepath, (err) => {
      if (err) reject(err);
      else resolve(filepath);
    });
  });
};

module.exports = generateTTS;
