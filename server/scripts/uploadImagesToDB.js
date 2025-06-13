const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Image = require("../models/Image");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Folder where images are stored
const IMAGE_DIR = path.join(__dirname, "../images");

// Sample captions and categories
const captions = [
   "I’ve been waiting for you all night 😘",
  "Your fantasy, delivered 😈",
  "Can’t stop thinking about last time… 💋",
  "Do you want to play? 💦",
  "I wore this just for you 😍",
  "Bet you’ve never seen me like this before 😉",
  "Naughty thoughts only 🖤",
  "Don’t just stare… take control 🥵",
  "Close the door… things are about to get wild 🔥",
  "Imagine this… but real 😏",
  "You know what I want... and it’s *you* 😈",
  "Touch me with your eyes first 👀",
  "I’m not wearing anything underneath… 😘",
  "One more pic? Or should I come over? 💋",
  "Tonight’s all about your pleasure 🥂",
  "You get me hot just by texting 🔥",
  "Be gentle... or don't 😈",
  "Every inch of me is yours 😍",
  "Am I your dream or your distraction? 💭",
  "Guess what I'm not wearing 😉",
  "Your good girl is feeling bad today 💋",
  "Want to see more? Say the magic word 🖤",
  "Undo me like your favorite song 🎵",
  "Don’t make me wait any longer 🥵",
  "You unlock a side of me no one sees 🔓",
  "Just imagine me whispering this to you 💞",
  "This is only the beginning… 😈",
  "I want to hear how I make you feel 💬",
  "What would you do if I was there right now? 😘",
  "You drive me wild every time 🔥",
  "No filters. Just raw desire. 😏",
  "Let’s keep this our little secret 🤫",
  "You're the reason I can't behave 😇",
  "Be the reason I lose control tonight 💋",
  "You always know how to tease me 🥴",
  "I could be your addiction 💊",
  "Eyes on me, baby 👀",
  "Say my name like you mean it 😍",
  "You’ve been on my mind... and between my thighs 💭",
  "The night’s not over yet 😈",
  "Show me how badly you want this 💦",
  "Tell me how I make you feel 🥺",
  "The view gets better in person 😘",
  "You get this pic, I get your attention 👅"
  
  
  
];
const categories = ["sweet", "naughty", "bossy", "dreamy"];

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  ssl: true,
  serverSelectionTimeoutMS: 30000, // 30s to pick a server
  socketTimeoutMS: 60000,          // 60s for socket timeout
})
.then(async () => {
  console.log("✅ MongoDB connected");

  const files = fs.readdirSync(IMAGE_DIR).filter(file =>
    /\.(jpg|jpeg|png)$/i.test(file)
  );

  for (let file of files) {
    const imgPath = path.join(IMAGE_DIR, file);
    const data = fs.readFileSync(imgPath);

    const image = new Image({
      caption: captions[Math.floor(Math.random() * captions.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      image: data,
      contentType: "image/jpeg", // You can adjust based on file extension if needed
    });

    try {
      await image.save();
      console.log(`✅ Uploaded: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to upload ${file}:`, err.message);
    }

    // Add short delay to avoid overwhelming the network/Atlas
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
})
.catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
});
